import { type ComponentProps, useMemo } from "react";
import { Chart } from "@/src/features/widgets/chart-library/Chart";
import { isChartDataEmpty } from "@/src/features/widgets/chart-library/isChartDataEmpty";
import type { CustomDashboardCard } from "@/src/components/design-system/cards/CustomDashboardCard/CustomDashboardCard";

type WidgetChartCardProps = Pick<
  ComponentProps<typeof CustomDashboardCard>,
  | "title"
  | "description"
  | "badge"
  | "controls"
  | "tabs"
  | "actions"
  | "state"
  | "density"
> &
  Pick<
    ComponentProps<typeof Chart>,
    | "data"
    | "chartConfig"
    | "config"
    | "sortState"
    | "onSortChange"
    | "legendPosition"
    | "legendSummary"
    | "legendInteraction"
    | "maxVisibleSeries"
    | "syncId"
    | "sync"
    | "overrideWarning"
    | "metricFormatter"
    | "thresholds"
    | "missingValue"
    | "hideXAxisLabels"
    | "compactYAxis"
    | "colorBarsByCategory"
    | "zeroBaseline"
  > & {
    rowLimit?: number;
    label?: string;
    unit?: string;
    sizing?: "auto" | "fill";
    metric?: { value: string | number; description?: string };
    emptyState?: {
      message?: string;
      description?: string;
      documentationUrl?: string;
    };
  };

export function WidgetChartCard({
  chartType,
  title,
  description,
  badge,
  controls,
  tabs,
  actions,
  density,
  state = { status: "ready" },
  metric,
  emptyState,
  sizing = "auto",
  data,
  label,
  unit,
  config,
  chartConfig,
  rowLimit = 100,
  ...chart
}: WidgetChartCardProps & Pick<ComponentProps<typeof Chart>, "chartType">) {
  const resolvedConfig = useMemo(
    () => config ?? (label ? { metric: { label } } : undefined),
    [config, label],
  );
  const resolvedChartConfig = useMemo(
    () => ({
      ...chartConfig,
      type: chartType,
      unit: unit ?? chartConfig?.unit,
    }),
    [chartConfig, chartType, unit],
  );
  const displayState =
    state.status === "ready" && isChartDataEmpty(data)
      ? { status: "empty" as const, ...emptyState }
      : state;
  return (
    <Chart
      {...chart}
      chartType={chartType}
      data={data}
      config={resolvedConfig}
      chartConfig={resolvedChartConfig}
      rowLimit={rowLimit}
      card={{
        title,
        description,
        badge,
        controls,
        tabs,
        actions,
        density,
        state: displayState,
        metric,
        sizing,
      }}
    />
  );
}
