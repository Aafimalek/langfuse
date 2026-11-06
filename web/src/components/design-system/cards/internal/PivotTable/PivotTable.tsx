import { cn } from "@/src/utils/tailwind";

const ARIA_SORT = { asc: "ascending", desc: "descending" } as const;

export function PivotTable({
  dimensionLabel,
  columns,
  rows,
  onSort,
}: {
  dimensionLabel: string;
  columns: { id: string; label: string; sort?: "asc" | "desc" }[];
  rows: {
    id: string;
    label: string;
    level: number;
    emphasis: "normal" | "subtotal" | "total";
    values: string[];
  }[];
  onSort?: (column: string) => void;
}) {
  return (
    <div className="h-full overflow-auto px-5 pb-2">
      <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
        <thead className="bg-background sticky top-0 z-10">
          <tr>
            <th className="text-muted-foreground border-b p-2 text-left font-bold">
              {dimensionLabel}
            </th>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                aria-sort={column.sort ? ARIA_SORT[column.sort] : undefined}
                className="text-muted-foreground border-b p-2 text-right font-bold"
              >
                {onSort ? (
                  <button type="button" onClick={() => onSort(column.id)}>
                    {column.label}
                    {column.sort && (
                      <span className="ml-1">
                        {column.sort === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-xs">
          {rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                "hover:bg-muted/30",
                row.emphasis === "subtotal" && "bg-muted/30 font-bold",
                row.emphasis === "total" && "bg-muted/50 font-bold",
              )}
            >
              <td
                className={cn(
                  "border-b p-2",
                  row.level === 1 && "pl-6",
                  row.level >= 2 && "pl-10",
                )}
              >
                {row.label}
              </td>
              {row.values.map((value, index) => (
                <td
                  key={columns[index]?.id ?? index}
                  className="border-b p-2 text-right tabular-nums"
                >
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
