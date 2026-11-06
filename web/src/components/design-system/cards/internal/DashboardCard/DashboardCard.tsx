import { type ComponentProps, type ReactNode } from "react";
import {
  GripVerticalIcon,
  MoreVerticalIcon,
  type IconComponent,
} from "@langfuse/icons";
import { MultiSelectTagInput } from "@/src/components/design-system/MultiSelectTagInput/MultiSelectTagInput";
import {
  DropdownMenu,
  type DropdownMenuItemDefinition,
} from "@/src/components/design-system/DropdownMenu/DropdownMenu";
import { Badge } from "@/src/components/design-system/Badge/Badge";
import { ChartLoadingState } from "@/src/components/design-system/ChartLoadingState/ChartLoadingState";
import { CardEmptyState } from "../CardEmptyState/CardEmptyState";
import { assertUnreachable } from "@/src/utils/types";
import { Tabs } from "@/src/components/design-system/Tabs/Tabs";

export type DashboardCardControl = {
  id: string;
  label: string;
} & (
  | ({ type: "multiselect" } & Pick<
      ComponentProps<typeof MultiSelectTagInput<string>>,
      | "value"
      | "options"
      | "onValueChange"
      | "placeholder"
      | "searchPlaceholder"
      | "emptyMessage"
      | "selectAllLabel"
      | "disabled"
    >)
  | {
      type: "select";
      value: string;
      options: { value: string; label: string; disabled?: boolean }[];
      onValueChange: (value: string) => void;
      disabled?: boolean;
    }
);

export type DashboardCardActions = {
  draggable?: boolean;
  buttons?: {
    id: string;
    label: string;
    icon: IconComponent;
    onClick: () => void;
    disabled?: boolean;
  }[];
  menu?: DropdownMenuItemDefinition[];
};

export type DashboardCardState =
  | { status: "ready" }
  | {
      status: "loading";
      progress?: ComponentProps<typeof ChartLoadingState>["progress"];
      message?: string;
    }
  | {
      status: "empty";
      message?: string;
      description?: string;
      documentationUrl?: string;
    }
  | { status: "error"; message: string; onRetry?: () => void };

export type DashboardCardProps = {
  title: string;
  description?: string | null;
  badge?: { text: string; description: string };
  controls?: DashboardCardControl[];
  tabs?: {
    value: string;
    options: { value: string; label: string }[];
    onValueChange: (value: string) => void;
  };
  actions?: DashboardCardActions;
  state?: DashboardCardState;
  density?: "default" | "compact" | "tight";
  children?: ReactNode;
};

export function DashboardCard({
  title,
  description,
  badge,
  controls = [],
  tabs,
  actions,
  state = { status: "ready" },
  density = "default",
  children,
}: DashboardCardProps) {
  const body = (() => {
    if (state.status === "ready") {
      return children;
    }
    if (state.status === "loading") {
      return (
        <ChartLoadingState
          layout={density}
          progress={state.progress}
          hintText={state.message}
        />
      );
    }
    if (state.status === "error") {
      return (
        <ChartLoadingState
          layout={density}
          showSpinner={false}
          showHintImmediately
          hintText={state.message}
          onRetry={state.onRetry}
        />
      );
    }
    if (state.status === "empty") {
      if (state.message) {
        return (
          <div className="text-muted-foreground flex min-h-36 flex-1 items-center justify-center rounded-md border border-dashed p-4 text-center">
            {state.message}
          </div>
        );
      }
      return (
        <CardEmptyState
          description={state.description}
          documentationUrl={state.documentationUrl}
        />
      );
    }
    return assertUnreachable(state);
  })();
  const content = (
    <div
      className="relative flex min-h-0 flex-1 flex-col gap-4 p-4 pt-0"
      aria-busy={state.status === "loading"}
    >
      {body}
    </div>
  );

  return (
    <div className="bg-card text-card-foreground group flex h-full min-h-0 w-full flex-col overflow-hidden rounded-lg border shadow-xs">
      <div className="flex shrink-0 flex-col gap-3 p-4">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex min-w-0 items-center gap-1.5">
              <h3
                className="truncate text-base leading-none font-bold tracking-tight"
                title={title}
              >
                {title}
              </h3>
              {badge && (
                <Badge
                  color="filled"
                  text={badge.text}
                  title={badge.description}
                />
              )}
            </div>
            {description && (
              <p className="text-muted-foreground text-sm">{description}</p>
            )}
          </div>
          {actions && (
            <div className="text-muted-foreground flex shrink-0 items-center gap-2 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 has-aria-expanded:opacity-100">
              {actions.draggable && (
                <GripVerticalIcon
                  size="base"
                  __rawClassName="drag-handle hidden cursor-grab active:cursor-grabbing lg:block"
                />
              )}
              {actions.buttons?.map(
                ({ id, label, icon: Icon, onClick, disabled }) => (
                  <button
                    key={id}
                    type="button"
                    aria-label={label}
                    title={label}
                    onClick={onClick}
                    disabled={disabled}
                    className="hover:text-foreground disabled:opacity-50"
                  >
                    <Icon size="base" />
                  </button>
                ),
              )}
              {Boolean(actions.menu?.length) && (
                <DropdownMenu placement="bottom-end" items={actions.menu ?? []}>
                  {({ getTriggerProps }) => (
                    <button
                      type="button"
                      aria-label="Widget actions"
                      className="hover:text-foreground"
                      {...getTriggerProps()}
                    >
                      <MoreVerticalIcon size="base" />
                    </button>
                  )}
                </DropdownMenu>
              )}
            </div>
          )}
        </div>
        {controls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {controls.map((control) => (
              <div key={control.id} className="w-80 max-w-full">
                {control.type === "multiselect" ? (
                  <MultiSelectTagInput
                    aria-label={control.label}
                    value={control.value}
                    options={control.options}
                    onValueChange={control.onValueChange}
                    placeholder={control.placeholder}
                    searchPlaceholder={control.searchPlaceholder}
                    emptyMessage={control.emptyMessage}
                    selectAllLabel={control.selectAllLabel}
                    disabled={control.disabled}
                  />
                ) : (
                  <select
                    aria-label={control.label}
                    value={control.value}
                    disabled={control.disabled}
                    onChange={(event) =>
                      control.onValueChange(event.target.value)
                    }
                    className="border-border bg-background w-full rounded-md border px-3 py-2 text-sm"
                  >
                    {control.options.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {tabs ? (
        <Tabs
          layout="fill"
          value={tabs.value}
          onValueChange={tabs.onValueChange}
        >
          <div className="mb-4 shrink-0">
            <div className="px-4 sm:hidden">
              <select
                aria-label={`${title} tabs`}
                value={tabs.value}
                onChange={(event) => tabs.onValueChange(event.target.value)}
                className="border-border bg-background w-full rounded-md border px-3 py-2 text-sm"
              >
                {tabs.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="hidden border-b sm:block">
              <Tabs.List
                variant="underline"
                overflow="menu"
                aria-label={`${title} tabs`}
              >
                {tabs.options.map((option) => (
                  <Tabs.Trigger
                    key={option.value}
                    value={option.value}
                    label={option.label}
                  />
                ))}
              </Tabs.List>
            </div>
          </div>
          <Tabs.Content value={tabs.value} layout="fill">
            {content}
          </Tabs.Content>
        </Tabs>
      ) : (
        content
      )}
    </div>
  );
}
