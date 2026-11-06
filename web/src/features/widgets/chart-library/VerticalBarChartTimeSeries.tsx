import { type ComponentProps, useMemo } from "react";
import { DataCard } from "@/src/components/design-system/cards/DataCard/DataCard";

import { StackedBarChart } from "@/src/components/design-system/charts/StackedBarChart/StackedBarChart";
import type { LineChartLegend } from "@/src/components/design-system/charts/LineChart/LineChart";
import { type ChartProps } from "@/src/features/widgets/chart-library/chart-props";
import {
  formatMetric,
  getUniqueDimensions,
  groupDataByTimeDimension,
  toFullMetricString,
} from "@/src/features/widgets/chart-library/utils";
import {
  parseChartTimestamp,
  prepareTimeAxis,
} from "@/src/features/widgets/chart-library/prepareTimeAxis";
import { prepareVisibleSeries } from "@/src/features/widgets/chart-library/prepareVisibleSeries";
import {
  seriesFillColor,
  SeriesOverflowNote,
} from "@/src/features/widgets/chart-library/SeriesOverflowNote";
import { getPlainTextFromReactNode } from "@/src/utils/react-node-plain-text";

export function VerticalBarChartTimeSeries({
  data,
  config,
  metricFormatter = formatMetric,
  legendPosition = "auto",
  legendSummary = "none",
  legendInteraction = "highlight",
  maxVisibleSeries,
  sync,
  hideXAxisLabels = false,
  card,
}: ChartProps & {
  card?: Omit<ComponentProps<typeof DataCard>, "visualization">;
}) {
  const groupedData = useMemo(() => groupDataByTimeDimension(data), [data]);
  const dimensions = useMemo(() => getUniqueDimensions(data), [data]);
  const visibleSeries = useMemo(
    () => prepareVisibleSeries(data, dimensions),
    [data, dimensions],
  );
  const timeAxis = useMemo(
    () =>
      prepareTimeAxis(
        groupedData.map((datum) => datum.time_dimension),
        undefined,
        {
          hideCategoryTickLabels: hideXAxisLabels,
        },
      ),
    [groupedData, hideXAxisLabels],
  );
  const formatValue = useMemo(
    () => (value: number) =>
      toFullMetricString(metricFormatter(value, { style: "compact" })),
    [metricFormatter],
  );
  const chartData = useMemo(
    () =>
      groupedData.map((datum) => ({
        key: String(datum.time_dimension ?? ""),
        values: Object.fromEntries(
          visibleSeries.visible.map((dimension) => [
            dimension,
            typeof datum[dimension] === "number" ? datum[dimension] : null,
          ]),
        ),
      })),
    [groupedData, visibleSeries],
  );
  const chartSeries = useMemo(
    () =>
      visibleSeries.visible.map((dimension, index) => ({
        id: dimension,
        label:
          getPlainTextFromReactNode(config?.[dimension]?.label ?? dimension) ??
          dimension,
        color: seriesFillColor(index),
      })),
    [visibleSeries, config],
  );
  const chartLegend = useMemo<LineChartLegend>(() => {
    if (legendPosition === "none") return { visibility: "hidden" };
    if (legendInteraction === "toggle") {
      return {
        visibility: legendPosition === "auto" ? "auto" : "visible",
        interaction: "toggle",
        summary: legendSummary,
        maxVisibleSeries,
      };
    }
    return {
      visibility: legendPosition === "auto" ? "auto" : "visible",
      interaction: "highlight",
      summary: legendSummary,
    };
  }, [legendPosition, legendInteraction, legendSummary, maxVisibleSeries]);

  const chartProps = {
    data: chartData,
    series: chartSeries,
    legend: chartLegend,
    valueFormatter: formatValue,
    tickFormatter: (key) => timeAxis.formatTick(key),
    categoryXAxisLabels: timeAxis.mode === "category",
    tooltipFormatter: (key) => timeAxis.formatTooltip(key),
    hideXAxisLabels: hideXAxisLabels && timeAxis.mode === "category",
    sync: sync
      ? {
          activeKey: chartData.find(
            (_, index) =>
              String(
                parseChartTimestamp(
                  groupedData[index]?.time_dimension,
                )?.getTime() ?? groupedData[index]?.time_dimension,
              ) === sync.activeKey,
          )?.key,
          onActiveKeyChange: (key) =>
            sync.onActiveKeyChange(
              key === undefined
                ? undefined
                : String(parseChartTimestamp(key)?.getTime() ?? key),
            ),
        }
      : undefined,
  } satisfies ComponentProps<typeof StackedBarChart>;
  if (card)
    return (
      <DataCard
        {...card}
        seriesOverflow={{
          visibleCount: visibleSeries.visible.length,
          totalCount: visibleSeries.total,
        }}
        visualization={{ type: "stacked-bar", ...chartProps }}
      />
    );
  return (
    <div className="flex size-full min-w-0 flex-col">
      {visibleSeries.total > visibleSeries.visible.length ? (
        <SeriesOverflowNote
          visibleCount={visibleSeries.visible.length}
          totalCount={visibleSeries.total}
        />
      ) : null}
      <div className="min-h-0 flex-1">
        <StackedBarChart {...chartProps} />
      </div>
    </div>
  );
}
