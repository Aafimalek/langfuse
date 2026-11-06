import { createRef } from "react";
import { expect } from "storybook/test";
import preview from "../../../../.storybook/preview";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./Card";

const meta = preview.meta({ component: Card });

export const Composition = meta.story({
  name: "(Test) Composition",
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Usage</CardTitle>
        <CardDescription>Monthly overview</CardDescription>
      </CardHeader>
      <CardContent>1,200 traces</CardContent>
      <CardFooter>Updated today</CardFooter>
    </Card>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("heading", { name: "Usage", level: 3 }),
    ).toBeVisible();
    await expect(canvas.getByText("Monthly overview")).toBeVisible();
    await expect(canvas.getByText("1,200 traces")).toBeVisible();
    await expect(canvas.getByText("Updated today")).toBeVisible();
  },
});

const cardRef = createRef<HTMLDivElement>();
const titleRef = createRef<HTMLHeadingElement>();
export const Refs = meta.story({
  name: "(Test) Refs and native attributes",
  render: () => (
    <Card ref={cardRef} role="region" aria-label="Usage summary">
      <CardHeader>
        <CardTitle ref={titleRef}>Usage</CardTitle>
      </CardHeader>
    </Card>
  ),
  play: async ({ canvas }) => {
    await expect(cardRef.current).toBe(
      canvas.getByRole("region", { name: "Usage summary" }),
    );
    await expect(titleRef.current).toBe(
      canvas.getByRole("heading", { name: "Usage" }),
    );
  },
});
