import { useState } from "react";
import { type UserRanking } from "@/lib/api";
import { SortIcon, emailPrefix } from "@/lib/table-utils";
import Pagination from "./Pagination";

interface UserRankingTableProps {
  data: UserRanking[];
  total: number;
  offset: number;
  limit: number;
  onPageChange: (offset: number) => void;
}

type SortKey = "chat_count" | "message_count" | "workspace_count" | "total_feedbacks";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "workspace_count", label: "Workspaces" },
  { key: "chat_count", label: "Chats" },
  { key: "message_count", label: "Messages" },
  { key: "total_feedbacks", label: "Feedbacks" },
];

export default function UserRankingTable({ data, total, offset, limit, onPageChange }: UserRankingTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("chat_count");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = [...data].sort((a, b) => {
    const va = a[sortKey];
    const vb = b[sortKey];
    return sortDir === "desc" ? vb - va : va - vb;
  });

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Best User Ranking</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Individual user activity. Ranked by chat count by default.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-3 pr-4 font-medium w-12">#</th>
              <th className="pb-3 pr-4 font-medium" title="Knox Portal Email">User</th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="pb-3 pr-4 font-medium text-right cursor-pointer select-none hover:text-foreground"
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((u, i) => (
              <tr key={u.user_id} className="border-b border-border/50 hover:bg-muted/50">
                <td className="py-3 pr-4 text-muted-foreground font-mono">{offset + i + 1}</td>
                <td className="py-3 pr-4 font-medium">{emailPrefix(u.email)}</td>
                <td className="py-3 pr-4 text-right font-mono">{u.workspace_count}</td>
                <td className="py-3 pr-4 text-right font-mono">{u.chat_count}</td>
                <td className="py-3 pr-4 text-right font-mono">{u.message_count}</td>
                <td className="py-3 pr-4 text-right font-mono">{u.total_feedbacks}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-muted-foreground">No user data.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination total={total} offset={offset} limit={limit} onPageChange={onPageChange} />
    </div>
  );
}
