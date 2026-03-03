import { type SkillRanking } from "@/lib/api";
import { emailPrefix } from "@/lib/table-utils";
import Pagination from "./Pagination";

interface SkillRankingTableProps {
  data: SkillRanking[];
  total: number;
  offset: number;
  limit: number;
  onPageChange: (offset: number) => void;
}

function formatDate(dateStr: string) {
  if (!dateStr || dateStr === "None") return "-";
  return dateStr.slice(0, 16).replace("T", " ");
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${active ? "bg-emerald-400" : "bg-zinc-500"}`}
      title={active ? "Active" : "Inactive"}
    />
  );
}

export default function SkillRankingTable({ data, total, offset, limit, onPageChange }: SkillRankingTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Registered Skills</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Skills (markdown prompts) registered in Open WebUI. Sorted by last updated.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-3 pr-4 font-medium w-12">#</th>
              <th className="pb-3 pr-4 font-medium">Name</th>
              <th className="pb-3 pr-4 font-medium">Description</th>
              <th className="pb-3 pr-4 font-medium text-center">Active</th>
              <th className="pb-3 pr-4 font-medium">Creator</th>
              <th className="pb-3 pr-4 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s, i) => (
              <tr key={s.id} className="border-b border-border/50 hover:bg-muted/50">
                <td className="py-3 pr-4 text-muted-foreground font-mono">{offset + i + 1}</td>
                <td className="py-3 pr-4 font-medium">{s.name}</td>
                <td className="py-3 pr-4 text-muted-foreground text-xs max-w-[240px] truncate">{s.description || "-"}</td>
                <td className="py-3 pr-4 text-center"><StatusDot active={s.is_active} /></td>
                <td className="py-3 pr-4 text-muted-foreground">{emailPrefix(s.creator_email)}</td>
                <td className="py-3 pr-4 text-muted-foreground font-mono text-xs">{formatDate(s.updated_at)}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-muted-foreground">No skills registered.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination total={total} offset={offset} limit={limit} onPageChange={onPageChange} />
    </div>
  );
}
