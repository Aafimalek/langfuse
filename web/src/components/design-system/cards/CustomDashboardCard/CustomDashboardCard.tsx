import { type ComponentProps } from "react";
import { DashboardCard } from "../internal/DashboardCard/DashboardCard";

export type DashboardCardActions = NonNullable<
  ComponentProps<typeof DashboardCard>["actions"]
>;

/** Public composition shell for cards containing multiple independent sections. */
export function CustomDashboardCard(
  props: ComponentProps<typeof DashboardCard>,
) {
  return <DashboardCard {...props} />;
}
