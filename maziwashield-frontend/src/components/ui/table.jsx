import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

/*
  columns: [{ key, label, render?(row), sortable?, align?: "right", className?, card?: "title" | "actions" | "hide" }]
  Below md the same columns render as stacked cards.
*/
export default function DataTable({ columns, rows, getRowKey, rowClassName, sort, onSort, empty, caption, className }) {
  if (!rows.length) return empty ?? null;

  const cell = (col, row) => (col.render ? col.render(row) : row[col.key]);
  const titleCol = columns.find((c) => c.card === "title") ?? columns[0];
  const actionsCol = columns.find((c) => c.card === "actions");
  const cardCols = columns.filter((c) => c !== titleCol && c !== actionsCol && c.card !== "hide");

  return (
    <>
      <div className={cn("custom-scroll hidden overflow-x-auto md:block", className)}>
        <table className="w-full border-collapse text-left">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-line bg-surface-container-low text-[11px] font-bold uppercase tracking-wider text-outline">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={sort?.key === col.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                  className={cn("px-3 py-3 font-label-caps first:px-4 last:px-4", col.align === "right" && "text-right")}
                >
                  {col.sortable && onSort ? (
                    <button type="button" onClick={() => onSort(col.key)} className="inline-flex items-center gap-1 uppercase hover:text-primary">
                      {col.label}
                      <ArrowUpDown className="h-3 w-3" aria-hidden />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high text-body-sm font-body-sm">
            {rows.map((row) => (
              <tr key={getRowKey(row)} className={cn("transition-colors hover:bg-surface-container-low/60", rowClassName?.(row))}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn("px-3 py-3.5 first:px-4 last:px-4", col.align === "right" && "text-right", col.className)}
                  >
                    {cell(col, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-outline-variant/30 md:hidden">
        {rows.map((row) => (
          <li key={getRowKey(row)} className={cn("space-y-3 p-4", rowClassName?.(row))}>
            <div className="text-base font-semibold text-primary">{cell(titleCol, row)}</div>
            <dl className="space-y-2">
              {cardCols.map((col) => (
                <div key={col.key} className="flex items-start justify-between gap-4 text-base">
                  <dt className="shrink-0 pt-0.5 text-xs font-bold uppercase tracking-wider text-outline">{col.label}</dt>
                  <dd className="min-w-0 text-right text-on-surface">{cell(col, row)}</dd>
                </div>
              ))}
            </dl>
            {actionsCol && <div className="flex justify-end">{cell(actionsCol, row)}</div>}
          </li>
        ))}
      </ul>
    </>
  );
}