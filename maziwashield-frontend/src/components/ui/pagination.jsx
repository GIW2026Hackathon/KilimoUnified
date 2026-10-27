"use client";

import { cn } from "@/lib/utils";

function pageRange(page, count) {
  if (count <= 5) return Array.from({ length: count }, (_, i) => i + 1);
  const nums = [...new Set([1, count, page - 1, page, page + 1])].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) out.push(`gap-${n}`);
    out.push(n);
  });
  return out;
}

const BTN =
  "min-h-11 min-w-11 rounded border px-2.5 py-1 text-[12px] md:min-h-0 md:min-w-0";

export default function Pagination({ page, pageCount, onPageChange, total, pageSize, onPageSizeChange, pageSizes = [10, 25, 50], noun = "items" }) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t border-line bg-surface-container-low px-4 py-2.5 text-body-sm font-body-sm text-outline md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span>
          Showing <strong className="text-on-surface">{start} - {end}</strong> of <strong className="text-on-surface">{total}</strong> {noun}
        </span>
        {onPageSizeChange && (
          <>
            <span className="hidden text-outline-variant md:inline">|</span>
            <label htmlFor="rows-per-page" className="text-[12px]">
              Per page:
            </label>
            <select
              id="rows-per-page"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded border border-outline-variant/60 bg-surface-container-lowest px-2 py-0.5 text-[12px] text-on-surface outline-none"
            >
              {pageSizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </>
        )}
      </div>
      <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={cn(BTN, "border-outline-variant/60 bg-surface-container-lowest text-on-surface hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60")}
        >
          Previous
        </button>
        {pageRange(page, pageCount).map((n) =>
          typeof n === "string" ? (
            <span key={n} aria-hidden="true" className="px-1">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              aria-current={n === page ? "page" : undefined}
              onClick={() => onPageChange(n)}
              className={cn(
                BTN,
                n === page
                  ? "border-transparent bg-primary-container font-semibold text-surface"
                  : "border-outline-variant/60 bg-surface-container-lowest text-on-surface hover:bg-surface-container"
              )}
            >
              {n}
            </button>
          )
        )}
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className={cn(BTN, "border-outline-variant/60 bg-surface-container-lowest text-on-surface hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60")}
        >
          Next
        </button>
      </nav>
    </div>
  );
}