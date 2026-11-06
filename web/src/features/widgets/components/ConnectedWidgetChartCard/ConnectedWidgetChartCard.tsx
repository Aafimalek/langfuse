import { type ComponentProps } from "react";
import { useWidgetChart, type WidgetContent } from "../InlineWidget";
import { WidgetChartCard } from "../WidgetChartCard";

export function ConnectedWidgetChartCard({
  title,
  description,
  ...query
}: Pick<ComponentProps<typeof WidgetChartCard>, "title" | "description"> &
  Pick<ComponentProps<typeof WidgetContent>, "layoutHint"> &
  Parameters<typeof useWidgetChart>[0]) {
  const { chartProps, chartLoadingState, loadingProgress, onRetry } =
    useWidgetChart(query);
  const { isLoading, ...chart } = chartProps;
  const state = (() => {
    if (onRetry) {
      return {
        status: "error" as const,
        message: chartLoadingState.hintText ?? "Unable to load chart data",
        onRetry,
      };
    }
    if (isLoading) {
      return { status: "loading" as const, progress: loadingProgress };
    }
    return { status: "ready" as const };
  })();

  return (
    <WidgetChartCard
      {...chart}
      title={title}
      description={description}
      state={state}
      density={query.layoutHint}
      sizing="fill"
    />
  );
}
