import { type ToolRanking } from "@/lib/api";
import { emailPrefix } from "@/lib/table-utils";
import Pagination from "./Pagination";

interface ToolRankingTableProps {
  data: ToolRanking[];
  total: number;
  offset: number;
  limit: number;
  onPageChange: (offset: number) => void;
}

function formatDate(dateStr: string) {
  if (!dateStr || dateStr === "None") return "-";
  return dateStr.slice(0, 16).replace("T", " ");
}

export default function ToolRankingTable({ data, total, offset, limit, onPageChange }: ToolRankingTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Registered Tools</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Custom tools available in Open WebUI. Sorted by last updated.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-3 pr-4 font-medium w-12">#</th>
              <th className="pb-3 pr-4 font-medium">Name</th>
              <th className="pb-3 pr-4 font-medium">Creator</th>
              <th className="pb-3 pr-4 font-medium">Created</th>
              <th className="pb-3 pr-4 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {data.map((t, i) => (
              <tr key={t.id} className="border-b border-border/50 hover:bg-muted/50">
                <td className="py-3 pr-4 text-muted-foreground font-mono">{offset + i + 1}</td>
                <td className="py-3 pr-4 font-medium">{t.name}</td>
                <td className="py-3 pr-4 text-muted-foreground">{emailPrefix(t.creator_email)}</td>
                <td className="py-3 pr-4 text-muted-foreground font-mono text-xs">{formatDate(t.created_at)}</td>
                <td className="py-3 pr-4 text-muted-foreground font-mono text-xs">{formatDate(t.updated_at)}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-muted-foreground">No tools registered.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination total={total} offset={offset} limit={limit} onPageChange={onPageChange} />
    </div>
  );
}
