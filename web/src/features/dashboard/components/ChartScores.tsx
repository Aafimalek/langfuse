/* eslint-disable @repo/no-style-props */
import { useMemo } from "react";
import { type DashboardCardActions } from "@/src/components/design-system/cards/CustomDashboardCard/CustomDashboardCard";
import { type ScoreDataTypeType, type FilterState } from "@langfuse/shared";
import {
  extractTimeSeriesData,
  fillMissingValuesAndTransform,
} from "@/src/features/dashboard/components/hooks";
import {
  type DashboardDateRangeAggregationOption,
  dashboardDateRangeAggregationSettings,
} from "@/src/utils/date-range-utils";
import { getScoreDataTypeIcon } from "@/src/features/scores/lib/scoreColumns";
import { type QueryType, type ViewVersion } from "@langfuse/shared/query";
import { mapLegacyUiTableFilterToView } from "@/src/features/dashboard/lib/dashboardUiTableToViewMapping";
import { type DatabaseRow } from "@/src/server/api/services/sqlInterface";
import { WidgetChartCard } from "@/src/features/widgets/components/WidgetChartCard";
import { timeSeriesToDataPoints } from "@/src/features/dashboard/lib/chart-data-adapters";
import { useScheduledDashboardExecuteQuery } from "@/src/features/dashboard/hooks/DashboardQuerySchedulerProvider";

export function ChartScores(props: {
  actions?: DashboardCardActions;
  className?: string;
  agg: DashboardDateRangeAggregationOption;
  globalFilterState: FilterState;
  fromTimestamp: Date;
  toTimestamp: Date;
  projectId: string;
  isLoading?: boolean;
  metricsVersion: ViewVersion;
  schedulerId?: string;
  syncId?: string;
  sync?: {
    activeKey: string | undefined;
    onActiveKeyChange: (key: string | undefined) => void;
  };
}) {
  const scoresQuery: QueryType = {
    view: "scores-numeric",
    dimensions: [{ field: "name" }, { field: "dataType" }, { field: "source" }],
    metrics: [{ measure: "value", aggregation: "avg" }],
    filters: mapLegacyUiTableFilterToView(
      "scores-numeric",
      props.globalFilterState,
    ),
    timeDimension: {
      granularity:
        dashboardDateRangeAggregationSettings[props.agg].dateTrunc ?? "day",
    },
    fromTimestamp: props.fromTimestamp.toISOString(),
    toTimestamp: props.toTimestamp.toISOString(),
    orderBy: null,
  };

  const scores = useScheduledDashboardExecuteQuery(
    {
      projectId: props.projectId,
      query: scoresQuery,
      version: props.metricsVersion,
    },
    {
      trpc: {
        context: {
          skipBatch: true,
        },
      },
      queryId: `${props.schedulerId ?? "home:chart-scores"}:scores`,
      enabled: !props.isLoading,
    },
  );

  // Memoize the transform on the (scheduler-stable) query result so the chart's
  // data prop keeps a stable reference across dashboard re-renders. (LFE-10549)
  const extractedScores = useMemo(
    () =>
      scores.data
        ? fillMissingValuesAndTransform(
            extractTimeSeriesData(
              scores.data as DatabaseRow[],
              "time_dimension",
              [
                {
                  uniqueIdentifierColumns: [
                    {
                      accessor: "data_type",
                      formatFct: (value) =>
                        getScoreDataTypeIcon(value as ScoreDataTypeType),
                    },
                    { accessor: "name" },
                    {
                      accessor: "source",
                      formatFct: (value) => `(${value.toLowerCase()})`,
                    },
                  ],
                  valueColumn: "avg_value",
                },
              ],
            ),
          )
        : [],
    [scores.data],
  );

  const chartData = useMemo(
    () => timeSeriesToDataPoints(extractedScores),
    [extractedScores],
  );

  return (
    <div className={props.className}>
      <WidgetChartCard
        chartType="LINE_TIME_SERIES"
        actions={props.actions}
        title="Scores"
        description="Moving average per score"
        state={{
          status: props.isLoading || scores.isPending ? "loading" : "ready",
        }}
        emptyState={{
          description:
            "Scores evaluate LLM quality and can be created manually or using the SDK.",
          documentationUrl: "https://langfuse.com/docs/evaluation/overview",
        }}
        data={chartData}
        syncId={props.syncId}
        sync={props.sync}
      />
    </div>
  );
}
