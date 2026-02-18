import { useState } from "react";
import { type GroupRanking } from "@/lib/api";
import { SortIcon } from "@/lib/table-utils";
import Pagination from "./Pagination";

interface GroupRankingTableProps {
  data: GroupRanking[];
  total: number;
  offset: number;
  limit: number;
  onPageChange: (offset: number) => void;
}

type SortKey = "member_count" | "total_feedbacks" | "chats_per_member" | "messages_per_member";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "member_count", label: "Members" },
  { key: "chats_per_member", label: "Chats/Member" },
  { key: "messages_per_member", label: "Messages/Member" },
  { key: "total_feedbacks", label: "Total number of feedbacks" },
];

export default function GroupRankingTable({ data, total, offset, limit, onPageChange }: GroupRankingTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("chats_per_member");
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
        <h3 className="text-lg font-semibold">Best User Group Ranking</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Per-capita usage metrics for each user group. Ranked by chats per member by default.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-3 pr-4 font-medium w-12">#</th>
              <th className="pb-3 pr-4 font-medium">Group</th>
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
            {sorted.map((g, i) => (
              <tr key={g.group_id} className="border-b border-border/50 hover:bg-muted/50">
                <td className="py-3 pr-4 text-muted-foreground font-mono">{offset + i + 1}</td>
                <td className="py-3 pr-4 font-medium">{g.group_name}</td>
                <td className="py-3 pr-4 text-right font-mono">{g.member_count}</td>
                <td className="py-3 pr-4 text-right font-mono">{g.chats_per_member}</td>
                <td className="py-3 pr-4 text-right font-mono">{g.messages_per_member}</td>
                <td className="py-3 pr-4 text-right font-mono">{g.total_feedbacks}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-muted-foreground">No group data.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination total={total} offset={offset} limit={limit} onPageChange={onPageChange} />
    </div>
  );
}
