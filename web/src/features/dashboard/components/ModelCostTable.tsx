/* eslint-disable @repo/no-style-props */
import { type DashboardCardActions } from "@/src/components/design-system/cards/CustomDashboardCard/CustomDashboardCard";
import { DataCard } from "@/src/components/design-system/cards/DataCard/DataCard";
import { type FilterState, getGenerationLikeTypes } from "@langfuse/shared";
import { compactNumberFormatter, costFormatter } from "@/src/utils/numbers";

import { type QueryType, type ViewVersion } from "@langfuse/shared/query";
import { mapLegacyUiTableFilterToView } from "@/src/features/dashboard/lib/dashboardUiTableToViewMapping";
import { useScheduledDashboardExecuteQuery } from "@/src/features/dashboard/hooks/DashboardQuerySchedulerProvider";
import { cn } from "@/src/utils/tailwind";

export const ModelCostTable = ({
  actions,
  className,
  projectId,
  globalFilterState,
  fromTimestamp,
  toTimestamp,
  isLoading = false,
  metricsVersion,
  schedulerId,
}: {
  actions?: DashboardCardActions;
  className: string;
  projectId: string;
  globalFilterState: FilterState;
  fromTimestamp: Date;
  toTimestamp: Date;
  isLoading?: boolean;
  metricsVersion: ViewVersion;
  schedulerId?: string;
}) => {
  const modelCostQuery: QueryType = {
    view: "observations",
    dimensions: [{ field: "providedModelName" }],
    metrics: [
      { measure: "totalCost", aggregation: "sum" },
      { measure: "totalTokens", aggregation: "sum" },
    ],
    filters: [
      ...mapLegacyUiTableFilterToView("observations", globalFilterState),
      {
        column: "type",
        operator: "any of",
        value: getGenerationLikeTypes(),
        type: "stringOptions",
      },
    ],
    timeDimension: null,
    fromTimestamp: fromTimestamp.toISOString(),
    toTimestamp: toTimestamp.toISOString(),
    orderBy: [{ field: "sum_totalCost", direction: "desc" }],
    chartConfig: { type: "table", row_limit: 20 },
  };

  const metrics = useScheduledDashboardExecuteQuery(
    {
      projectId,
      query: modelCostQuery,
      version: metricsVersion,
    },
    {
      trpc: {
        context: {
          skipBatch: true,
        },
      },
      queryId: `${schedulerId ?? "home:model-costs"}:metrics`,
      enabled: !isLoading,
    },
  );

  const totalTokenCost = metrics.data?.reduce(
    (acc, curr) =>
      acc + (curr.sum_totalCost ? (curr.sum_totalCost as number) : 0),
    0,
  );

  const metricsData = metrics.data
    ? metrics.data
        .filter((item) => item.providedModelName !== null)
        .map((item) => [
          {
            value: String(item.providedModelName),
            title: String(item.providedModelName),
            truncateAt: 30,
          },
          {
            value: item.sum_totalTokens
              ? compactNumberFormatter(item.sum_totalTokens as number)
              : "0",
          },
          {
            value: item.sum_totalCost
              ? costFormatter(item.sum_totalCost as number)
              : "$0",
          },
        ])
    : [];

  const state = (() => {
    if (isLoading || metrics.isLoading) return { status: "loading" as const };
    return { status: "ready" as const };
  })();

  return (
    <div className={cn(className, "h-full")}>
      <DataCard
        actions={actions}
        title="Model costs"
        state={state}
        visualization={{
          type: "table",
          columns: [
            { id: "model", label: "Model" },
            { id: "tokens", label: "Tokens", align: "right" },
            { id: "cost", label: "USD", align: "right" },
          ],
          rows: metricsData,
          collapse: { collapsed: 5, expanded: 20 },
        }}
        metric={{
          value: costFormatter(totalTokenCost),
          description: "Total cost",
          documentation: {
            description:
              "Calculated multiplying the number of tokens with cost per token for each model.",
            href: "https://langfuse.com/docs/model-usage-and-cost",
          },
        }}
      />
    </div>
  );
};
