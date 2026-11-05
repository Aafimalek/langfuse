import { describe, expect, it } from "vitest";

import {
  compileClickhouseQuery,
  renderClickhouseExpression,
} from "../../../server/query-ast/compile";
import { getClickhouseKysely } from "../../../server/query-ast/dialect";
import {
  clickhouseLocalAvailable,
  executeClickhouseLocal,
} from "../../../server/repositories/goldenHarness";
import {
  literal,
  type TemplateAggregate,
} from "../../../server/query-ast/extensions";
import type { ClickHouseDatabase } from "../../../server/query-ast/schema";
import { eventsObservationsView } from "../dataModel";
import {
  expressionBuilder,
  type AliasableExpression,
  type ExpressionBuilder,
} from "kysely";
import {
  EVENTS_OBSERVATIONS_DIMENSIONS,
  EVENTS_OBSERVATIONS_MEASURES,
  aggregationSlot,
  eventsObservationsScoresJoin,
} from "./eventsObservationsRegistry";
import { NULL_IF_EMPTY_RE } from "./nullIfEmptyFilter";

// select … from events_truncated as events_observations left join scores on <join>
const baseQuery = () =>
  getClickhouseKysely()
    .selectFrom("events_truncated as events_observations")
    .leftJoin("scores", (join) => join.on(eventsObservationsScoresJoin));

/** Builder of {@link baseQuery}'s select list. */
type QueryBuilder = ExpressionBuilder<
  {
    events_observations: ClickHouseDatabase["events_truncated"];
    scores: ClickHouseDatabase["scores"];
  },
  "events_observations" | "scores"
>;

type Case = {
  /** Plain-identifier output name of the case. */
  key: string;
  legacy: string;
  build: (eb: QueryBuilder) => AliasableExpression<unknown>;
};

const view = eventsObservationsView;

/** The legacy `@@AGGn@@` substitution of `queryBuilder.ts`, per query level. */
function legacyMeasureSql(
  sql: string,
  aggs: Record<string, string>,
  level: "single" | "two",
): string {
  let result = sql;
  for (const [slot, fn] of Object.entries(aggs)) {
    result = result.replaceAll(
      `@@${slot.toUpperCase()}@@`,
      level === "single" ? "" : fn,
    );
  }
  return result;
}

/** One case per registry entry and template level, with the view's SQL. */
function registryCases(): Case[] {
  const cases: Case[] = [];
  for (const [name, entry] of Object.entries(EVENTS_OBSERVATIONS_DIMENSIONS)) {
    const legacy = view.dimensions[name];
    cases.push({
      key: `dimension_${name}`,
      legacy: legacy.sql,
      build: (eb) => entry.expression(eb),
    });
    if ("pairExpand" in entry) {
      cases.push({
        key: `pair_values_${name}`,
        legacy: legacy.pairExpand?.valuesSql ?? "missing_pair_expand",
        build: (eb) => entry.pairExpand.values(eb),
      });
    }
  }
  for (const [name, entry] of Object.entries(EVENTS_OBSERVATIONS_MEASURES)) {
    const legacy = view.measures[name];
    if ("aggs" in entry) {
      for (const level of ["single", "two"] as const) {
        cases.push({
          key: `measure_${name}_${level}`,
          legacy: legacyMeasureSql(legacy.sql, legacy.aggs ?? {}, level),
          build: (eb) => entry.expression(eb, level),
        });
      }
    } else {
      cases.push({
        key: `measure_${name}`,
        legacy: legacy.sql,
        build: (eb) => entry.expression(eb),
      });
    }
  }
  cases.push({
    key: "scores_join",
    legacy: view.tableRelations.scores.joinConditionSql.replace(/^ON /, ""),
    build: (eb) => eventsObservationsScoresJoin(eb),
  });
  return cases;
}

/** Each case's registry expression as SQL text, keyed by case key. */
function renderCases(cases: Case[]): Record<string, string> {
  const eb: QueryBuilder = expressionBuilder(baseQuery());
  return Object.fromEntries(
    cases.map((c) => [c.key, renderClickhouseExpression(c.build(eb))]),
  );
}

describe("v2 observations registry", () => {
  it("has an entry for every dimension and measure of the view, in order", () => {
    expect(Object.keys(EVENTS_OBSERVATIONS_DIMENSIONS)).toEqual(
      Object.keys(view.dimensions),
    );
    expect(Object.keys(EVENTS_OBSERVATIONS_MEASURES)).toEqual(
      Object.keys(view.measures),
    );
    expect(Object.keys(view.tableRelations)).toEqual(["scores"]);
  });

  it("declares the view's aggregation slots and pair-expanded aliases", () => {
    for (const [name, entry] of Object.entries(EVENTS_OBSERVATIONS_MEASURES)) {
      expect("aggs" in entry ? entry.aggs : undefined, name).toEqual(
        view.measures[name].aggs,
      );
    }
    for (const [name, entry] of Object.entries(
      EVENTS_OBSERVATIONS_DIMENSIONS,
    )) {
      expect(
        "pairExpand" in entry ? entry.pairExpand.valueAlias : undefined,
        name,
      ).toEqual(view.dimensions[name].pairExpand?.valueAlias);
    }
  });

  it("keeps nullIf(column, '') recognisable for the filter path", () => {
    const rendered = renderCases(registryCases());
    for (const name of Object.keys(EVENTS_OBSERVATIONS_DIMENSIONS)) {
      const legacyMatch = NULL_IF_EMPTY_RE.exec(view.dimensions[name].sql);
      const match = NULL_IF_EMPTY_RE.exec(rendered[`dimension_${name}`]);
      expect(match?.[1], name).toEqual(legacyMatch?.[1]);
    }
  });

  it("compiles every entry in one query on events_core", () => {
    const query = baseQuery().select((eb: QueryBuilder) =>
      registryCases()
        .filter((c) => !c.key.endsWith("_single"))
        .map((c) => c.build(eb).as(c.key)),
    );
    const { sql } = compileClickhouseQuery(query, "project-1");
    expect(sql).toContain("from events_core as events_observations");
  });

  it("rejects a slot the measure does not declare", () => {
    expect(() =>
      aggregationSlot<Record<string, TemplateAggregate>>(
        { agg1: "any" },
        "two",
      )("agg2", literal(1)),
    ).toThrow('Measure has no aggregation slot "agg2".');
  });
});

const describeWithClickhouse = clickhouseLocalAvailable()
  ? describe
  : describe.skip;

/** ClickHouse's parse tree of each `SELECT <expression>`, in order. */
function explainAst(expressions: string[]): string[] {
  const out = executeClickhouseLocal(
    expressions.map((e) => `EXPLAIN AST SELECT ${e}`).join(";\n"),
  );
  return out.split(/^(?=SelectWithUnionQuery)/m).map((tree) => tree.trimEnd());
}

/**
 * Lower-cases the names of functions ClickHouse resolves case-insensitively
 * (`COALESCE` → `coalesce`), the one way two parse trees of the same SQL
 * differ.
 */
function normalizeFunctionCase(tree: string, caseInsensitive: Set<string>) {
  return tree.replace(/^(\s*Function )(\S+)/gm, (line, prefix, name) =>
    caseInsensitive.has(name.toLowerCase())
      ? `${prefix}${name.toLowerCase()}`
      : line,
  );
}

describeWithClickhouse("v2 observations registry SQL", () => {
  it("parses to the same tree as the view's SQL, entry by entry", () => {
    const cases = registryCases();
    const rendered = renderCases(cases);
    const caseInsensitive = new Set(
      executeClickhouseLocal(
        "SELECT lower(name) FROM system.functions WHERE case_insensitive FORMAT TSV",
      ).split("\n"),
    );
    const legacyTrees = explainAst(cases.map((c) => c.legacy));
    const registryTrees = explainAst(cases.map((c) => rendered[c.key]));
    expect(registryTrees).toHaveLength(cases.length);
    cases.forEach((c, i) => {
      expect(
        normalizeFunctionCase(registryTrees[i], caseInsensitive),
        `${c.key}\nlegacy:   ${c.legacy}\nregistry: ${rendered[c.key]}`,
      ).toEqual(normalizeFunctionCase(legacyTrees[i], caseInsensitive));
    });
  });
});
