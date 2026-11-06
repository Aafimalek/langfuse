import { type ComponentProps } from "react";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import preview from "../../../../../.storybook/preview";
import { DataCard } from "./DataCard";

const models = [
  "claude-opus-5-5",
  "claude-sonnet-5-5",
  "gpt-5.4",
  "claude-haiku-4-5",
  "gpt-5.4-mini",
];
const series = models.map((id, index) => ({
  id,
  label: id,
  color: `hsl(var(--chart-${index + 1}))`,
  fillColor: `hsl(var(--chart-fill-${index + 1}))`,
}));
const timeSeries = Array.from({ length: 14 }, (_, day) => ({
  x: new Date(Date.UTC(2026, 8, 30 + day)),
  values: Object.fromEntries(
    models.map((model, index) => [
      model,
      Math.round(
        (60 - index * 9) * (1 + 0.35 * Math.sin(day / 2 + index)) * 10,
      ),
    ]),
  ),
}));
const barSeries = timeSeries.map(({ x, values }) => ({
  key: x.toISOString().slice(0, 10),
  values,
}));
const traceNames = [
  { label: "agent-turn", value: 3493 },
  { label: "in-app-agent-conversation", value: 1677 },
  { label: "search-bar-filter", value: 303 },
  { label: "experiment-item-run", value: 202 },
  { label: "natural-language-filter", value: 64 },
  { label: "introspection-only", value: 12 },
];
const modelTotals = models.map((label, index) => ({
  label,
  value: [910, 648, 320, 120, 40][index] ?? 0,
  color: series[index]?.fillColor,
}));
const latencyBins = Array.from({ length: 12 }, (_, bin) => ({
  label: `${bin * 250}–${(bin + 1) * 250}ms`,
  value: Math.round(400 * Math.exp(-((bin - 3) ** 2) / 8)),
}));
const line = {
  type: "line",
  data: timeSeries,
  series,
  xAxis: { type: "time" },
} satisfies ComponentProps<typeof DataCard>["visualization"];
const table = {
  type: "table",
  columns: [
    { id: "model", label: "Model" },
    { id: "cost", label: "USD", align: "right" },
  ],
  rows: [
    [{ value: "Model A" }, { value: "$12.00" }],
    [{ value: "Model B" }, { value: "$8.00" }],
  ],
} satisfies ComponentProps<typeof DataCard>["visualization"];
const tableArgs = {
  title: "Model costs",
  visualization: table,
  metric: {
    value: "$20.00",
    description: "Total cost",
    documentation: {
      description: "Cost across all models.",
      href: "https://langfuse.com/docs/model-usage-and-cost",
    },
  },
} satisfies ComponentProps<typeof DataCard>;
const emptyPivotTable = {
  type: "pivot-table",
  dimensionLabel: "Model",
  columns: [],
  rows: [],
} satisfies ComponentProps<typeof DataCard>["visualization"];
const onSort = fn();
const cards: ComponentProps<typeof DataCard>[] = [
  { title: "Line time series", visualization: line },
  {
    title: "Area time series",
    visualization: {
      type: "area",
      data: timeSeries,
      series,
      xAxis: { type: "time" },
    },
  },
  {
    title: "Stacked bar",
    visualization: { type: "stacked-bar", data: barSeries, series },
  },
  {
    title: "Grouped bar",
    visualization: { type: "grouped-bar", data: barSeries, series },
  },
  { title: "Vertical bar", visualization: { type: "bar", data: traceNames } },
  {
    title: "Vertical bar, colour by category",
    visualization: {
      type: "bar",
      data: modelTotals,
      legend: {
        items: series.map((item) => ({
          id: item.id,
          label: item.label,
          color: item.fillColor,
        })),
      },
    },
  },
  {
    title: "Horizontal bar",
    visualization: { type: "horizontal-bar", data: traceNames },
  },
  { title: "Pie", visualization: { type: "pie", data: modelTotals } },
  {
    title: "Histogram",
    visualization: { type: "histogram", data: latencyBins },
  },
  { title: "Number", visualization: { type: "number", value: 38750 } },
  {
    title: "Table",
    visualization: {
      type: "table",
      columns: [
        { id: "model", label: "Model" },
        { id: "count", label: "Count", align: "right" },
      ],
      rows: modelTotals.map((row) => [
        { value: row.label },
        { value: row.value },
      ]),
    },
  },
  {
    title: "Pivot table",
    visualization: {
      type: "pivot-table",
      dimensionLabel: "Model",
      columns: [{ id: "count", label: "Count" }],
      rows: modelTotals.map((row) => ({
        id: row.label,
        label: row.label,
        level: 0,
        emphasis: "normal",
        values: [String(row.value)],
      })),
    },
  },
];

const meta = preview.meta({
  component: DataCard,
  args: {
    title: "Traces",
    metric: { value: "36", description: "Total traces" },
    visualization: line,
  },
  decorators: [
    (Story, context) =>
      context.parameters.layout === "fullscreen" ? (
        <Story />
      ) : (
        <div className="h-96 max-w-2xl">
          <Story />
        </div>
      ),
  ],
});

export const Ready = meta.story({
  name: "(Test) Ready",
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "Traces" })).toBeVisible();
    await expect(canvas.getByText("36")).toBeVisible();
  },
});
export const MetricLabelLayout = meta.story({
  name: "(Test) Metric label below value",
  args: { metric: { value: "434.15K", description: "Total traces tracked" } },
  render: (args) => (
    <div className="h-96 w-60">
      <DataCard {...args} />
    </div>
  ),
  play: async ({ canvas }) => {
    const metricRect = canvas.getByText("434.15K").getBoundingClientRect();
    const descriptionRect = canvas
      .getByText("Total traces tracked")
      .getBoundingClientRect();
    await expect(descriptionRect.top).toBeGreaterThanOrEqual(
      metricRect.bottom - 1,
    );
    await expect(Math.abs(descriptionRect.left - metricRect.left)).toBeLessThan(
      2,
    );
    await expect(descriptionRect.height).toBeLessThan(metricRect.height);
  },
});
export const Loading = meta.story({
  name: "(Test) Loading",
  args: { state: { status: "loading" } },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("status", { name: "Loading chart data" }),
    ).toBeVisible();
  },
});
export const StatusLoading = meta.story({
  name: "(Test) Status loading",
  args: {
    visualization: undefined,
    metric: undefined,
    state: { status: "loading" },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "Traces" })).toBeVisible();
    await expect(
      canvas.getByRole("status", { name: "Loading chart data" }),
    ).toBeVisible();
  },
});
export const StatusEmpty = meta.story({
  name: "(Test) Status empty",
  args: {
    visualization: undefined,
    metric: undefined,
    state: { status: "empty" },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No data")).toBeVisible();
  },
});
export const StatusError = meta.story({
  name: "(Test) Status error",
  args: {
    visualization: undefined,
    metric: undefined,
    state: { status: "error", message: "Widget not found", onRetry: fn() },
  },
  play: async ({ canvas, args }) => {
    await waitFor(() =>
      expect(canvas.getByText("Widget not found")).toBeVisible(),
    );
    await userEvent.click(canvas.getByRole("button", { name: "Retry" }));
    if (args.state?.status === "error")
      await expect(args.state.onRetry).toHaveBeenCalledOnce();
  },
});
export const Empty = meta.story({
  name: "(Test) Empty",
  args: { state: { status: "empty" } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No data")).toBeVisible();
  },
});
export const Error = meta.story({
  name: "(Test) Error",
  args: { state: { status: "error", message: "Query failed", onRetry: fn() } },
  play: async ({ canvas, args }) => {
    await waitFor(() => expect(canvas.getByText("Query failed")).toBeVisible());
    await userEvent.click(canvas.getByRole("button", { name: "Retry" }));
    if (args.state?.status === "error")
      await expect(args.state.onRetry).toHaveBeenCalledOnce();
  },
});
export const HorizontalBar = meta.story({
  name: "(Test) Horizontal bar",
  args: {
    title: "Users",
    visualization: {
      type: "horizontal-bar",
      data: [
        { label: "Alice", value: 12 },
        { label: "Bob", value: 8 },
      ],
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Alice")).toBeVisible();
    await expect(canvas.getByText("Bob")).toBeVisible();
  },
});
export const Number = meta.story({
  name: "(Test) Number",
  args: {
    title: "Total traces",
    metric: undefined,
    visualization: {
      type: "number",
      value: 1200,
      valueFormatter: (value) => ({ main: value.toLocaleString("en-US") }),
    },
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("heading", { name: "Total traces" }),
    ).toBeVisible();
    await expect(canvas.getByText("1,200")).toBeVisible();
  },
});
export const Zero = meta.story({
  name: "(Test) Zero",
  args: {
    title: "Total traces",
    metric: undefined,
    visualization: { type: "number", value: 0 },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("0")).toBeVisible();
  },
});
export const AllVisualizations = meta.story({
  name: "(Test) All visualizations",
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="bg-background grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div key={card.title} className="h-80">
          <DataCard {...card} sizing="fill" />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvas }) => {
    for (const card of cards)
      await expect(
        canvas.getByRole("heading", { name: card.title }),
      ).toBeVisible();
    await expect(canvas.getAllByRole("heading")).toHaveLength(cards.length);
  },
});

export const Table = meta.story({
  name: "(Test) Table",
  args: tableArgs,
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("heading", { name: "Model costs" }),
    ).toBeVisible();
    await expect(canvas.getByText("$20.00")).toBeVisible();
    await expect(
      canvas.getByRole("columnheader", { name: "USD" }),
    ).toBeVisible();
    await expect(canvas.getByRole("cell", { name: "Model A" })).toBeVisible();
    await expect(canvas.getByRole("cell", { name: "$12.00" })).toBeVisible();
    await expect(
      canvas.getByRole("link", { name: "Metric documentation" }),
    ).toHaveAttribute("href", "https://langfuse.com/docs/model-usage-and-cost");
  },
});
export const TableEmpty = meta.story({
  name: "(Test) Table empty",
  args: { ...tableArgs, visualization: { ...table, rows: [] } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No data")).toBeVisible();
    await expect(canvas.queryByRole("table")).not.toBeInTheDocument();
    await expect(canvas.queryByText("$20.00")).not.toBeInTheDocument();
  },
});
export const TableLoading = meta.story({
  name: "(Test) Table loading",
  args: {
    ...tableArgs,
    visualization: { ...table, rows: [] },
    state: { status: "loading" },
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("status", { name: "Loading chart data" }),
    ).toBeVisible();
    await expect(canvas.queryByText("No data")).not.toBeInTheDocument();
  },
});
export const TableError = meta.story({
  name: "(Test) Table error",
  args: {
    ...tableArgs,
    visualization: { ...table, rows: [] },
    state: { status: "error", message: "Query failed" },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Query failed")).toBeInTheDocument();
    await expect(canvas.queryByText("No data")).not.toBeInTheDocument();
  },
});
export const TableLatencies = meta.story({
  args: {
    title: "Observation latency percentiles",
    metric: undefined,
    visualization: {
      type: "table",
      columns: [
        { id: "name", label: "Observation" },
        { id: "p95", label: "p95", align: "right", sort: "desc" },
      ],
      rows: [
        [
          {
            value: "A long observation name that is truncated",
            prefix: "SPAN",
            detail: "SPAN · A long observation name that is truncated",
            truncateAt: 16,
          },
          { value: "1.25s" },
        ],
      ],
    },
  },
});
export const TableExpandable = meta.story({
  name: "(Test) Table expandable",
  args: {
    ...tableArgs,
    visualization: {
      ...table,
      rows: Array.from({ length: 20 }, (_, index) => [
        { value: `Model ${index + 1}` },
        { value: "$1.00" },
      ]),
      collapse: { collapsed: 5, expanded: 20 },
    },
  },
  play: async ({ canvas }) => {
    await userEvent.click(
      await canvas.findByRole("button", { name: "Show all" }),
    );
    await expect(canvas.getAllByRole("row")).toHaveLength(21);
    await userEvent.click(canvas.getByRole("button", { name: "See less" }));
    await waitFor(() =>
      expect(canvas.getAllByRole("row").length).toBeLessThan(21),
    );
  },
});
export const PivotTableSort = meta.story({
  name: "(Test) Pivot table sort",
  args: {
    title: "Model usage",
    metric: undefined,
    visualization: {
      ...emptyPivotTable,
      columns: [{ id: "count", label: "Count" }],
      rows: [
        {
          id: "a",
          label: "Model A",
          level: 0,
          emphasis: "normal",
          values: ["12"],
        },
      ],
      onSort,
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("cell", { name: "Model A" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Count" }));
    await expect(onSort).toHaveBeenCalledWith("count");
  },
});
export const PivotTableEmpty = meta.story({
  name: "(Test) Pivot table empty",
  args: {
    title: "Model usage",
    metric: undefined,
    visualization: emptyPivotTable,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No data")).toBeVisible();
    await expect(canvas.queryByRole("table")).not.toBeInTheDocument();
  },
});
export const PivotTableLoading = meta.story({
  name: "(Test) Pivot table loading",
  args: {
    title: "Model usage",
    metric: undefined,
    visualization: emptyPivotTable,
    state: { status: "loading" },
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("status", { name: "Loading chart data" }),
    ).toBeVisible();
    await expect(canvas.queryByText("No data")).not.toBeInTheDocument();
  },
});
export const PivotTableError = meta.story({
  name: "(Test) Pivot table error",
  args: {
    title: "Model usage",
    metric: undefined,
    visualization: emptyPivotTable,
    state: { status: "error", message: "Query failed" },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Query failed")).toBeInTheDocument();
    await expect(canvas.queryByText("No data")).not.toBeInTheDocument();
  },
});
