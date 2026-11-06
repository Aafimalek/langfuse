import { useState } from "react";
import { PencilIcon } from "@langfuse/icons";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import preview from "../../../../../../.storybook/preview";
import { DashboardCard } from "./DashboardCard";

const meta = preview.meta({
  component: DashboardCard,
  args: { title: "Traces", children: <p>Chart content</p> },
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
    await expect(canvas.getByRole("heading", { name: "Traces" })).toBeVisible();
    await expect(canvas.getByText("Chart content")).toBeVisible();
    await expect(canvas.queryByRole("status")).not.toBeInTheDocument();
  },
});

export const Loading = meta.story({
  name: "(Test) Loading",
  args: { state: { status: "loading" } },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("status", { name: "Loading chart data" }),
    ).toBeVisible();
    await expect(canvas.queryByText("Chart content")).not.toBeInTheDocument();
  },
});

export const Empty = meta.story({
  name: "(Test) Empty",
  args: { title: "Scores", state: { status: "empty" } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("No data")).toBeVisible();
    await expect(canvas.queryByText("Chart content")).not.toBeInTheDocument();
  },
});

export const EmptySelection = meta.story({
  name: "(Test) Empty selection",
  args: {
    title: "Scores",
    state: { status: "empty", message: "Select a score to view analytics" },
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText("Select a score to view analytics"),
    ).toBeVisible();
    await expect(canvas.queryByText("No data")).not.toBeInTheDocument();
  },
});

const onRetry = fn();
export const Error = meta.story({
  name: "(Test) Error",
  args: { state: { status: "error", message: "Query failed", onRetry } },
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByText("Query failed")).toBeVisible());
    await userEvent.click(canvas.getByRole("button", { name: "Retry" }));
    await expect(onRetry).toHaveBeenCalledOnce();
  },
});

const onValueChange = fn();
const onEdit = fn();
export const ControlsWhileLoading = meta.story({
  name: "(Test) Controls while loading",
  args: {
    title: "Usage",
    state: { status: "loading" },
    controls: [
      {
        type: "select",
        id: "model",
        label: "Model",
        value: "a",
        options: [
          { value: "a", label: "Model A" },
          { value: "b", label: "Model B" },
        ],
        onValueChange,
      },
    ],
    actions: {
      buttons: [
        { id: "edit", label: "Edit widget", icon: PencilIcon, onClick: onEdit },
      ],
    },
  },
  play: async ({ canvas, canvasElement }) => {
    await userEvent.selectOptions(
      canvas.getByRole("combobox", { name: "Model" }),
      "b",
    );
    await expect(onValueChange).toHaveBeenCalledWith("b");
    await expect(canvas.getByRole("combobox", { name: "Model" })).toHaveValue(
      "a",
    );
    await userEvent.hover(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Edit widget" }));
    await expect(onEdit).toHaveBeenCalledOnce();
  },
});

const onTabChange = fn();
export const Tabs = meta.story({
  name: "(Test) Tabs",
  args: {
    title: "Usage",
    tabs: {
      value: "cost",
      options: [
        { value: "cost", label: "Cost" },
        { value: "tokens", label: "Tokens" },
      ],
      onValueChange: onTabChange,
    },
    children: <p>Cost chart</p>,
  },
  play: async ({ canvas }) => {
    const activeTab = canvas.getByRole("tab", { name: "Cost" });
    const panel = canvas.getByRole("tabpanel");
    await expect(activeTab).toHaveAttribute("aria-controls", panel.id);
    await expect(panel).toHaveTextContent("Cost chart");
    await userEvent.click(canvas.getByRole("tab", { name: "Tokens" }));
    await expect(onTabChange).toHaveBeenCalledWith("tokens");
    await expect(activeTab).toHaveAttribute("aria-selected", "true");
  },
});

export const LoadingToReady = meta.story({
  name: "(Test) Loading to ready",
  render: (args) => {
    const [loading, setLoading] = useState(true);
    return (
      <>
        <button type="button" onClick={() => setLoading(false)}>
          Finish loading
        </button>
        <DashboardCard
          {...args}
          state={{ status: loading ? "loading" : "ready" }}
        />
      </>
    );
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("status", { name: "Loading chart data" }),
    ).toBeVisible();
    await expect(canvas.queryByText("Chart content")).not.toBeInTheDocument();
    await userEvent.click(
      canvas.getByRole("button", { name: "Finish loading" }),
    );
    await expect(canvas.queryByRole("status")).not.toBeInTheDocument();
    await expect(canvas.getByText("Chart content")).toBeVisible();
  },
});
