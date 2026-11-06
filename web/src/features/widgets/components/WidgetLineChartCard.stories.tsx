import { expect } from "storybook/test";
import preview from "../../../../.storybook/preview";
import { WidgetChartCard } from "./WidgetChartCard";

const meta = preview.meta({
  component: WidgetChartCard,
  args: {
    chartType: "LINE_TIME_SERIES" as const,
    title: "Traces over time",
    data: [
      {
        time_dimension: "2026-11-01T00:00:00.000Z",
        dimension: "Traces",
        metric: 12,
      },
      {
        time_dimension: "2026-11-02T00:00:00.000Z",
        dimension: "Traces",
        metric: 24,
      },
      {
        time_dimension: "2026-11-03T00:00:00.000Z",
        dimension: "Traces",
        metric: 18,
      },
    ],
    metric: { value: "54", description: "Total traces" },
    label: "Traces",
    legendSummary: "sum" as const,
    missingValue: "zero" as const,
  },
  decorators: [
    (Story) => (
      <div className="h-96 w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
});

export const Ready = meta.story({
  name: "(Test) Ready",
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("heading", { name: "Traces over time" }),
    ).toBeVisible();
    await expect(canvas.getByText("54")).toBeVisible();
    await expect(canvas.getByText("Total traces")).toBeVisible();
    await expect(canvas.queryByText("No data")).not.toBeInTheDocument();
  },
});

export const WithoutMetric = meta.story({ args: { metric: undefined } });

export const Empty = meta.story({
  name: "(Test) Empty",
  args: { data: [], emptyState: { message: "No traces in this date range" } },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText("No traces in this date range"),
    ).toBeVisible();
    await expect(canvas.queryByText("54")).not.toBeInTheDocument();
  },
});

export const MissingValues = meta.story({
  name: "(Test) Missing values",
  args: {
    data: [
      {
        time_dimension: "2026-11-01T00:00:00.000Z",
        dimension: "Traces",
        metric: null,
      },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No data")).toBeVisible();
  },
});

export const Loading = meta.story({
  name: "(Test) Loading",
  args: { data: [], state: { status: "loading" } },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("status", { name: "Loading chart data" }),
    ).toBeVisible();
    await expect(canvas.queryByText("No data")).not.toBeInTheDocument();
  },
});

export const Error = meta.story({
  name: "(Test) Error",
  args: { data: [], state: { status: "error", message: "Query failed" } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Query failed")).toBeInTheDocument();
    await expect(canvas.queryByText("No data")).not.toBeInTheDocument();
  },
});
