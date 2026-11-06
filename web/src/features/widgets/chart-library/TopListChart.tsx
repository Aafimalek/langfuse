import { type ComponentProps } from "react";
import { HorizontalBarChart } from "@/src/components/design-system/charts/HorizontalBarChart/HorizontalBarChart";
import { DataCard } from "@/src/components/design-system/cards/DataCard/DataCard";
import { type ChartProps } from "@/src/features/widgets/chart-library/chart-props";
import {
  formatMetric,
  toFullMetricString,
} from "@/src/features/widgets/chart-library/utils";

export function TopListChart({
  data,
  config,
  metricFormatter = formatMetric,
  card,
}: ChartProps & {
  card?: Omit<ComponentProps<typeof DataCard>, "visualization">;
}) {
  const chart = {
    data: (data ?? []).map((row) => ({
      label: row.dimension ?? "n/a",
      value:
        typeof row.metric === "number" ? row.metric : Number(row.metric ?? 0),
    })),
    valueFormatter: (value: number) =>
      toFullMetricString(metricFormatter(value, { style: "compact" })),
    color: config?.metric?.color ?? "hsl(var(--chart-fill-1))",
  } satisfies ComponentProps<typeof HorizontalBarChart>;
  if (card)
    return (
      <DataCard
        {...card}
        visualization={{ type: "horizontal-bar", ...chart }}
      />
    );
  return <HorizontalBarChart {...chart} />;
}
