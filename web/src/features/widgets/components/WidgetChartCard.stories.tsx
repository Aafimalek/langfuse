import { expect } from "storybook/test";
import preview from "../../../../.storybook/preview";
import { WidgetChartCard } from "./WidgetChartCard";

const pivotData = [
  {
    dimension: "Model A",
    metric: 0,
    time_dimension: undefined,
    model: "Model A",
    count: 12,
  },
];

const meta = preview.meta({
  component: WidgetChartCard,
  args: {
    chartType: "AREA_TIME_SERIES" as const,
    title: "Widget chart",
    data: [
      {
        dimension: "Traces",
        metric: 12,
        time_dimension: "2026-11-01T00:00:00.000Z",
      },
      {
        dimension: "Traces",
        metric: 24,
        time_dimension: "2026-11-02T00:00:00.000Z",
      },
    ],
    sizing: "fill" as const,
  },
  decorators: [
    (Story) => (
      <div className="h-96 w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
});

export const Area = meta.story({});
export const BarTimeSeries = meta.story({
  args: { chartType: "BAR_TIME_SERIES" },
});
export const VerticalBar = meta.story({
  args: { chartType: "VERTICAL_BAR" },
});
export const Pie = meta.story({ args: { chartType: "PIE" } });
export const Histogram = meta.story({
  args: {
    chartType: "HISTOGRAM",
    data: [
      {
        dimension: "Latency",
        metric: [
          [0, 1, 2],
          [1, 2, 3],
        ],
        time_dimension: undefined,
      },
    ],
  },
});
export const Number = meta.story({
  name: "(Test) Number",
  args: {
    chartType: "NUMBER",
    data: [{ dimension: "Traces", metric: 0, time_dimension: undefined }],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("0")).toBeVisible();
    await expect(canvas.queryByText("No data")).not.toBeInTheDocument();
  },
});
export const PivotTable = meta.story({
  name: "(Test) Pivot table",
  args: {
    chartType: "PIVOT_TABLE",
    data: pivotData,
    chartConfig: {
      type: "PIVOT_TABLE",
      dimensions: ["model"],
      metrics: ["count"],
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Model A")).toBeVisible();
    await expect(canvas.getByRole("table")).toBeVisible();
  },
});
