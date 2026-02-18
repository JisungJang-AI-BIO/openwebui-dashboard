import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  total: number;
  offset: number;
  limit: number;
  onPageChange: (offset: number) => void;
}

export default function Pagination({ total, offset, limit, onPageChange }: PaginationProps) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const from = offset + 1;
  const to = Math.min(offset + limit, total);

  if (total <= limit) return null;

  return (
    <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
      <span>
        Showing {from}&ndash;{to} of {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          disabled={offset === 0}
          onClick={() => onPageChange(Math.max(0, offset - limit))}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </button>
        <span className="px-2 tabular-nums">
          {currentPage} / {totalPages}
        </span>
        <button
          disabled={offset + limit >= total}
          onClick={() => onPageChange(offset + limit)}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
