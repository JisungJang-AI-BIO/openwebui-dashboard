import { useState } from "react";
import { type DeveloperRanking } from "@/lib/api";
import { SortIcon, RatingCell, emailPrefix } from "@/lib/table-utils";
import Pagination from "./Pagination";

interface DeveloperRankingTableProps {
  data: DeveloperRanking[];
  total: number;
  offset: number;
  limit: number;
  onPageChange: (offset: number) => void;
}

type SortKey = "workspace_count" | "total_users" | "total_chats" | "total_messages" | "rating";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "workspace_count", label: "Workspaces" },
  { key: "total_users", label: "Users" },
  { key: "total_chats", label: "Chats" },
  { key: "total_messages", label: "Messages" },
  { key: "rating", label: "Rating" },
];

function getRating(row: DeveloperRanking) {
  return row.total_positive - row.total_negative;
}

export default function DeveloperRankingTable({ data, total, offset, limit, onPageChange }: DeveloperRankingTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("total_chats");
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
    const va = sortKey === "rating" ? getRating(a) : a[sortKey];
    const vb = sortKey === "rating" ? getRating(b) : b[sortKey];
    return sortDir === "desc" ? vb - va : va - vb;
  });

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Best Developer Ranking</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Metrics reflect aggregated usage of workspaces created by each developer, not their personal activity.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-3 pr-4 font-medium w-12">#</th>
              <th className="pb-3 pr-4 font-medium" title="Knox Portal Email">Developer</th>
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
            {sorted.map((dev, i) => (
              <tr key={dev.user_id} className="border-b border-border/50 hover:bg-muted/50">
                <td className="py-3 pr-4 text-muted-foreground font-mono">{offset + i + 1}</td>
                <td className="py-3 pr-4 font-medium">{emailPrefix(dev.email)}</td>
                <td className="py-3 pr-4 text-right font-mono">{dev.workspace_count}</td>
                <td className="py-3 pr-4 text-right font-mono">{dev.total_users}</td>
                <td className="py-3 pr-4 text-right font-mono">{dev.total_chats}</td>
                <td className="py-3 pr-4 text-right font-mono">{dev.total_messages}</td>
                <td className="py-3 pr-4 text-right"><RatingCell value={getRating(dev)} /></td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-muted-foreground">No developer data. Developers must create at least one workspace.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination total={total} offset={offset} limit={limit} onPageChange={onPageChange} />
    </div>
  );
}
