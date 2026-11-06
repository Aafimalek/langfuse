import { expect } from "storybook/test";
import preview from "../../../../.storybook/preview";
import { WidgetChartCard } from "./WidgetChartCard";

const meta = preview.meta({
  component: WidgetChartCard,
  args: {
    chartType: "HORIZONTAL_BAR" as const,
    title: "User consumption",
    data: [
      { time_dimension: undefined, dimension: "Alice", metric: 12 },
      { time_dimension: undefined, dimension: "Bob", metric: 8 },
    ],
    rowLimit: 20,
    label: "Traces",
    unit: "traces",
    metric: { value: "20", description: "Total traces" },
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
      canvas.getByRole("heading", { name: "User consumption" }),
    ).toBeVisible();
    await expect(canvas.getByText("Total traces")).toBeVisible();
    await expect(canvas.getByText("Alice")).toBeVisible();
    await expect(canvas.getByText("Bob")).toBeVisible();
  },
});

export const WithoutMetric = meta.story({ args: { metric: undefined } });

export const Empty = meta.story({
  name: "(Test) Empty",
  args: { data: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No data")).toBeVisible();
    await expect(canvas.queryByText("Total traces")).not.toBeInTheDocument();
  },
});

export const EmptySelection = meta.story({
  name: "(Test) Empty selection",
  args: { data: [], emptyState: { message: "Select a user" } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Select a user")).toBeVisible();
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
