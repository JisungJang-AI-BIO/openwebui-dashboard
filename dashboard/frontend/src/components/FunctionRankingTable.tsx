import { type FunctionRanking } from "@/lib/api";
import { emailPrefix } from "@/lib/table-utils";
import Pagination from "./Pagination";

interface FunctionRankingTableProps {
  data: FunctionRanking[];
  total: number;
  offset: number;
  limit: number;
  onPageChange: (offset: number) => void;
}

function formatDate(dateStr: string) {
  if (!dateStr || dateStr === "None") return "-";
  return dateStr.slice(0, 16).replace("T", " ");
}

const TYPE_COLORS: Record<string, string> = {
  pipe: "bg-blue-500/20 text-blue-400",
  filter: "bg-amber-500/20 text-amber-400",
  action: "bg-purple-500/20 text-purple-400",
};

function TypeBadge({ type }: { type: string }) {
  const color = TYPE_COLORS[type] || "bg-muted text-muted-foreground";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {type}
    </span>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${active ? "bg-emerald-400" : "bg-zinc-500"}`}
      title={active ? "Yes" : "No"}
    />
  );
}

export default function FunctionRankingTable({ data, total, offset, limit, onPageChange }: FunctionRankingTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Registered Functions</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Pipes, filters, and actions registered in Open WebUI. Sorted by last updated.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-3 pr-4 font-medium w-12">#</th>
              <th className="pb-3 pr-4 font-medium">Name</th>
              <th className="pb-3 pr-4 font-medium">Type</th>
              <th className="pb-3 pr-4 font-medium text-center">Active</th>
              <th className="pb-3 pr-4 font-medium text-center">Global</th>
              <th className="pb-3 pr-4 font-medium">Creator</th>
              <th className="pb-3 pr-4 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {data.map((f, i) => (
              <tr key={f.id} className="border-b border-border/50 hover:bg-muted/50">
                <td className="py-3 pr-4 text-muted-foreground font-mono">{offset + i + 1}</td>
                <td className="py-3 pr-4 font-medium">{f.name}</td>
                <td className="py-3 pr-4"><TypeBadge type={f.type} /></td>
                <td className="py-3 pr-4 text-center"><StatusDot active={f.is_active} /></td>
                <td className="py-3 pr-4 text-center"><StatusDot active={f.is_global} /></td>
                <td className="py-3 pr-4 text-muted-foreground">{emailPrefix(f.creator_email)}</td>
                <td className="py-3 pr-4 text-muted-foreground font-mono text-xs">{formatDate(f.updated_at)}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-muted-foreground">No functions registered.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination total={total} offset={offset} limit={limit} onPageChange={onPageChange} />
    </div>
  );
}
