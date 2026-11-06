/* eslint-disable @repo/no-style-props */
import { type DashboardCardActions } from "@/src/components/design-system/cards/CustomDashboardCard/CustomDashboardCard";
import { DataCard } from "@/src/components/design-system/cards/DataCard/DataCard";
import {
  type ScoreDataTypeType,
  type ScoreSourceType,
  type FilterState,
} from "@langfuse/shared";
import { type ViewVersion } from "@langfuse/shared/query";
import { api } from "@/src/utils/api";
import { compactNumberFormatter } from "@/src/utils/numbers";
import { cn } from "@/src/utils/tailwind";
import { createTracesTimeFilter } from "@/src/features/dashboard/lib/dashboard-utils";
import { getScoreDataTypeIcon } from "@/src/features/scores/lib/scoreColumns";
import {
  isBooleanDataType,
  isCategoricalDataType,
  isNumericDataType,
} from "@/src/features/scores/lib/helpers";
import { type DatabaseRow } from "@/src/server/api/services/sqlInterface";

const dropValuesForCategoricalScores = (
  value: number,
  scoreDataType: ScoreDataTypeType,
): string => {
  if (isCategoricalDataType(scoreDataType)) return "-";
  if (isBooleanDataType(scoreDataType) || isNumericDataType(scoreDataType)) {
    return compactNumberFormatter(value);
  }
  return "-";
};

const scoreNameSourceDataTypeMatch =
  (
    scoreName: string,
    scoreSource: ScoreSourceType,
    scoreDataType: ScoreDataTypeType,
  ) =>
  (item: DatabaseRow) =>
    item.scoreName === scoreName &&
    item.scoreSource === scoreSource &&
    item.scoreDataType === scoreDataType;

export const ScoresTable = ({
  actions,
  className,
  projectId,
  globalFilterState,
  isLoading = false,
  metricsVersion,
}: {
  actions?: DashboardCardActions;
  className: string;
  projectId: string;
  globalFilterState: FilterState;
  isLoading?: boolean;
  metricsVersion: ViewVersion;
}) => {
  const localFilters = createTracesTimeFilter(
    globalFilterState,
    "scoreTimestamp",
  );

  const metrics = api.dashboard.chart.useQuery(
    {
      projectId,
      from: "traces_scores",
      select: [
        { column: "scoreName" },
        { column: "scoreId", agg: "COUNT" },
        { column: "value", agg: "AVG" },
        { column: "scoreSource" },
        { column: "scoreDataType" },
      ],
      filter: localFilters,
      groupBy: [
        { type: "string", column: "scoreName" },
        {
          type: "string",
          column: "scoreSource",
        },
        {
          type: "string",
          column: "scoreDataType",
        },
      ],
      orderBy: [{ column: "scoreId", direction: "DESC", agg: "COUNT" }],
      queryName: "score-aggregate",
      version: metricsVersion,
    },
    {
      trpc: {
        context: {
          skipBatch: true,
        },
      },
      enabled: !isLoading,
    },
  );

  const [zeroValueScores, oneValueScores] = [0, 1].map((i) =>
    api.dashboard.chart.useQuery(
      {
        projectId,
        from: "traces_scores",
        select: [
          { column: "scoreName" },
          { column: "scoreId", agg: "COUNT" },
          { column: "scoreSource" },
          { column: "scoreDataType" },
        ],
        filter: [
          ...localFilters,
          {
            column: "value",
            operator: "=",
            value: i,
            type: "number",
          },
        ],
        groupBy: [
          { type: "string", column: "scoreName" },
          {
            type: "string",
            column: "scoreSource",
          },
          {
            type: "string",
            column: "scoreDataType",
          },
        ],
        orderBy: [{ column: "scoreId", direction: "DESC", agg: "COUNT" }],
        queryName: "score-aggregate",
        version: metricsVersion,
      },
      {
        trpc: {
          context: {
            skipBatch: true,
          },
        },
        enabled: !isLoading,
      },
    ),
  );

  if (!zeroValueScores || !oneValueScores) {
    return (
      <DataCard
        visualization={{ type: "table", columns: [], rows: [] }}
        title="Scores"
        actions={actions}
        state={{ status: "empty" }}
      />
    );
  }

  const joinRequestData = () => {
    if (!metrics.data || !zeroValueScores.data || !oneValueScores.data)
      return [];

    return metrics.data.map((metric) => {
      const scoreName = metric.scoreName as string;
      const scoreSource = metric.scoreSource as ScoreSourceType;
      const scoreDataType = metric.scoreDataType as ScoreDataTypeType;

      const zeroValueScore = zeroValueScores.data.find(
        scoreNameSourceDataTypeMatch(scoreName, scoreSource, scoreDataType),
      );
      const oneValueScore = oneValueScores.data.find(
        scoreNameSourceDataTypeMatch(scoreName, scoreSource, scoreDataType),
      );

      return {
        scoreName,
        scoreSource,
        scoreDataType,
        countScoreId: metric.countScoreId ? metric.countScoreId : 0,
        avgValue: metric.avgValue ? (metric.avgValue as number) : 0,
        zeroValueScore: zeroValueScore?.countScoreId
          ? zeroValueScore.countScoreId
          : 0,
        oneValueScore: oneValueScore?.countScoreId
          ? (oneValueScore.countScoreId as number)
          : 0,
      };
    });
  };

  const data = joinRequestData();

  const totalScores = data.reduce(
    (acc, curr) => acc + (curr.countScoreId as number),
    0,
  );

  const state = (() => {
    if (
      isLoading ||
      metrics.isPending ||
      zeroValueScores.isPending ||
      oneValueScores.isPending
    )
      return { status: "loading" as const };
    return { status: "ready" as const };
  })();

  return (
    <div className={cn(className, "h-full")}>
      <DataCard
        actions={actions}
        title="Scores"
        state={state}
        visualization={{
          type: "table",
          columns: [
            { id: "name", label: "Name" },
            { id: "count", label: "#", align: "right" },
            { id: "average", label: "Avg", align: "right" },
            { id: "zero", label: "0", align: "right" },
            { id: "one", label: "1", align: "right" },
          ],
          rows: data.map((item) => [
            {
              value: `${getScoreDataTypeIcon(item.scoreDataType)} ${item.scoreName} (${item.scoreSource.toLowerCase()})`,
            },
            { value: compactNumberFormatter(item.countScoreId as number) },
            {
              value: dropValuesForCategoricalScores(
                item.avgValue,
                item.scoreDataType,
              ),
            },
            {
              value: dropValuesForCategoricalScores(
                item.zeroValueScore as number,
                item.scoreDataType,
              ),
            },
            {
              value: dropValuesForCategoricalScores(
                item.oneValueScore,
                item.scoreDataType,
              ),
            },
          ]),
          collapse: { collapsed: 5, expanded: 20 },
        }}
        emptyState={{
          description:
            "Scores evaluate LLM quality and can be created manually or using the SDK.",
          documentationUrl: "https://langfuse.com/docs/evaluation/overview",
        }}
        metric={{
          value: totalScores ? compactNumberFormatter(totalScores) : "0",
          description: "Total scores tracked",
        }}
      />
    </div>
  );
};
