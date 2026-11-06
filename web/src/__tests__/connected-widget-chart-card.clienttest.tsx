import { fireEvent, render, screen } from "@testing-library/react";
import { ConnectedWidgetChartCard } from "@/src/features/widgets/components/ConnectedWidgetChartCard/ConnectedWidgetChartCard";
import { type ComponentProps } from "react";

const { useWidgetChart } = vi.hoisted(() => ({ useWidgetChart: vi.fn() }));
vi.mock("@/src/features/widgets/components/InlineWidget", () => ({
  useWidgetChart,
}));

describe("ConnectedWidgetChartCard", () => {
  const props = {
    title: "Gateway requests",
    description: "Requests by model",
    projectId: "project",
    query: {
      view: "observations",
      dimensions: [],
      metrics: [{ measure: "count", aggregation: "count" }],
      filters: [],
      timeDimension: null,
      fromTimestamp: "2026-11-01T00:00:00.000Z",
      toTimestamp: "2026-11-02T00:00:00.000Z",
      orderBy: null,
    },
    version: "v2",
    chartType: "HORIZONTAL_BAR",
    chartConfig: { type: "HORIZONTAL_BAR" },
    metrics: [{ measure: "count", agg: "count" }],
    dimensions: [],
    view: "observations",
    schedulerId: "gateway-test",
    layoutHint: "compact",
  } satisfies ComponentProps<typeof ConnectedWidgetChartCard>;

  beforeEach(() => {
    useWidgetChart.mockReset();
  });

  test("keeps the header visible while the chart is loading", () => {
    useWidgetChart.mockReturnValue({
      chartProps: { chartType: "HORIZONTAL_BAR", data: [], isLoading: true },
      chartLoadingState: {},
    });
    render(<ConnectedWidgetChartCard {...props} />);
    expect(
      screen.getByRole("heading", { name: "Gateway requests" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Loading chart data" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("No data")).not.toBeInTheDocument();
  });

  test("shows the card empty state for empty breakdown data", () => {
    useWidgetChart.mockReturnValue({
      chartProps: { chartType: "HORIZONTAL_BAR", data: [], isLoading: false },
      chartLoadingState: {},
    });
    render(<ConnectedWidgetChartCard {...props} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  test("shows query errors and allows retrying", () => {
    const onRetry = vi.fn();
    useWidgetChart.mockReturnValue({
      chartProps: { chartType: "HORIZONTAL_BAR", data: [], isLoading: false },
      chartLoadingState: { hintText: "Query failed" },
      onRetry,
    });
    render(<ConnectedWidgetChartCard {...props} />);
    expect(screen.getByText("Query failed")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
