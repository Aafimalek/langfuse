import { type ComponentProps, useMemo } from "react";
import { LineChart } from "../../charts/LineChart/LineChart";
import { AreaChart } from "../../charts/AreaChart/AreaChart";
import { BarChart } from "../../charts/BarChart/BarChart";
import { HorizontalBarChart } from "../../charts/HorizontalBarChart/HorizontalBarChart";
import { StackedBarChart } from "../../charts/StackedBarChart/StackedBarChart";
import { GroupedBarChart } from "../../charts/GroupedBarChart/GroupedBarChart";
import { PieChart } from "../../charts/PieChart/PieChart";
import { HistogramChart } from "../../charts/HistogramChart/HistogramChart";
import { Tooltip } from "../../Tooltip/Tooltip";
import { DashboardCard } from "../internal/DashboardCard/DashboardCard";
import { DataTable } from "../internal/DataTable/DataTable";
import { PivotTable } from "../internal/PivotTable/PivotTable";
import { BigNumber } from "../../BigNumber/BigNumber";
import { assertUnreachable } from "@/src/utils/types";

export function DataCard({
  visualization,
  sizing,
  state,
  emptyState,
  metric,
  seriesOverflow,
  ...card
}: Omit<ComponentProps<typeof DashboardCard>, "children" | "state"> & {
  metric?: {
    value: string | number;
    description?: string;
    documentation?: { description: string; href: string };
  };
  sizing?: "auto" | "fill";
  seriesOverflow?: { visibleCount: number; totalCount: number };
  emptyState?: Pick<
    Extract<
      NonNullable<ComponentProps<typeof DashboardCard>["state"]>,
      { status: "empty" }
    >,
    "message" | "description" | "documentationUrl"
  >;
} & (
    | {
        visualization?: never;
        state: Exclude<
          NonNullable<ComponentProps<typeof DashboardCard>["state"]>,
          { status: "ready" }
        >;
      }
    | {
        state?: ComponentProps<typeof DashboardCard>["state"];
        visualization:
          | ({ type: "line" } & ComponentProps<typeof LineChart>)
          | ({ type: "area" } & ComponentProps<typeof AreaChart>)
          | ({ type: "bar" } & ComponentProps<typeof BarChart>)
          | ({ type: "horizontal-bar" } & ComponentProps<
              typeof HorizontalBarChart
            >)
          | ({ type: "stacked-bar" } & ComponentProps<typeof StackedBarChart>)
          | ({ type: "grouped-bar" } & ComponentProps<typeof GroupedBarChart>)
          | ({ type: "pie" } & ComponentProps<typeof PieChart>)
          | ({ type: "histogram" } & ComponentProps<typeof HistogramChart>)
          | ({ type: "number" } & ComponentProps<typeof BigNumber>)
          | ({ type: "table" } & ComponentProps<typeof DataTable>)
          | ({ type: "pivot-table" } & ComponentProps<typeof PivotTable>);
      }
  )) {
  const content = useMemo(() => {
    if (!visualization) return null;
    if (visualization.type === "line") return <LineChart {...visualization} />;
    if (visualization.type === "area") return <AreaChart {...visualization} />;
    if (visualization.type === "bar") return <BarChart {...visualization} />;
    if (visualization.type === "horizontal-bar")
      return <HorizontalBarChart {...visualization} />;
    if (visualization.type === "stacked-bar")
      return <StackedBarChart {...visualization} />;
    if (visualization.type === "grouped-bar")
      return <GroupedBarChart {...visualization} />;
    if (visualization.type === "pie") return <PieChart {...visualization} />;
    if (visualization.type === "histogram")
      return <HistogramChart {...visualization} />;
    if (visualization.type === "number")
      return <BigNumber {...visualization} />;
    if (visualization.type === "table") return <DataTable {...visualization} />;
    if (visualization.type === "pivot-table")
      return <PivotTable {...visualization} />;
    return assertUnreachable(visualization);
  }, [visualization]);
  if (!visualization) return <DashboardCard {...card} state={state} />;
  const displayState = (() => {
    if (state && state.status !== "ready") return state;
    if (visualization.type !== "table" && visualization.type !== "pivot-table")
      return state;
    if (visualization.rows.length > 0) return state;
    return { status: "empty" as const, ...emptyState };
  })();
  const metricDocumentation = metric?.documentation;
  const resolvedSizing =
    sizing ??
    (visualization.type === "number" || visualization.type === "pivot-table"
      ? "fill"
      : "auto");
  return (
    <DashboardCard {...card} state={displayState}>
      {metric && (
        <div className="animate-in flex flex-col items-start">
          <div className="text-3xl font-bold">{metric.value}</div>
          {(metric.description || metricDocumentation) && (
            <div className="flex min-w-0 items-center gap-1">
              {metric.description && (
                <p className="text-muted-foreground text-sm">
                  {metric.description}
                </p>
              )}
              {metricDocumentation && (
                <Tooltip label={metricDocumentation.description}>
                  {({ getTriggerProps }) => (
                    <a
                      {...getTriggerProps()}
                      aria-label="Metric documentation"
                      href={metricDocumentation.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      ⓘ
                    </a>
                  )}
                </Tooltip>
              )}
            </div>
          )}
        </div>
      )}
      {seriesOverflow &&
        seriesOverflow.totalCount > seriesOverflow.visibleCount && (
          <p className="text-muted-foreground text-xs">
            Showing {seriesOverflow.visibleCount} of {seriesOverflow.totalCount}{" "}
            series
          </p>
        )}
      {visualization.type === "table" ? (
        content
      ) : (
        <div
          className={
            resolvedSizing === "auto"
              ? "relative min-h-36 w-full flex-1"
              : "relative min-h-0 w-full flex-1"
          }
        >
          <div className="absolute inset-0">{content}</div>
        </div>
      )}
    </DashboardCard>
  );
}
