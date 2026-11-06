import { type ComponentProps } from "react";
import { truncate } from "@langfuse/shared";
import { Tooltip } from "../../../Tooltip/Tooltip";
import { DashboardTable } from "../DashboardTable/DashboardTable";

export function DataTable({
  columns,
  rows,
  collapse,
}: {
  columns: {
    id: string;
    label: string;
    align?: "left" | "right";
    sort?: "asc" | "desc";
  }[];
  rows: {
    value: string | number;
    title?: string;
    prefix?: string;
    detail?: string;
    truncateAt?: number;
  }[][];
  collapse?: ComponentProps<typeof DashboardTable>["collapse"];
}) {
  return (
    <DashboardTable
      headers={columns.map((column) => (
        <div
          key={column.id}
          className={column.align === "right" ? "text-right" : "text-left"}
        >
          {column.label}
          {column.sort && (
            <span className="ml-1">{column.sort === "desc" ? "▼" : "▲"}</span>
          )}
        </div>
      ))}
      rows={rows.map((row) =>
        row.map((cell, index) => {
          const text =
            cell.truncateAt === undefined
              ? cell.value
              : truncate(String(cell.value), cell.truncateAt);
          const content = (
            <span className="inline-flex items-center gap-2">
              {cell.prefix && (
                <span className="text-muted-foreground text-[10px] font-bold tracking-wide uppercase">
                  {cell.prefix}
                </span>
              )}
              <span>{text}</span>
            </span>
          );
          return (
            <div
              key={columns[index]?.id ?? index}
              title={cell.title}
              className={
                columns[index]?.align === "right" ? "text-right" : "text-left"
              }
            >
              {cell.detail ? (
                <Tooltip label={cell.detail}>
                  {({ getTriggerProps }) => (
                    <span tabIndex={0} {...getTriggerProps()}>
                      {content}
                    </span>
                  )}
                </Tooltip>
              ) : (
                content
              )}
            </div>
          );
        }),
      )}
      collapse={collapse}
    />
  );
}
