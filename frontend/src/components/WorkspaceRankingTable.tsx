import { useState } from "react";
import { type WorkspaceRanking } from "@/lib/api";
import { SortIcon, RatingCell, emailPrefix } from "@/lib/table-utils";
import Pagination from "./Pagination";

interface WorkspaceRankingTableProps {
  data: WorkspaceRanking[];
  total: number;
  offset: number;
  limit: number;
  onPageChange: (offset: number) => void;
}

type SortKey = "user_count" | "chat_count" | "message_count" | "rating";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "user_count", label: "Users" },
  { key: "chat_count", label: "Chats" },
  { key: "message_count", label: "Messages" },
  { key: "rating", label: "Rating" },
];

function getRating(row: WorkspaceRanking) {
  return row.positive - row.negative;
}

export default function WorkspaceRankingTable({ data, total, offset, limit, onPageChange }: WorkspaceRankingTableProps) {
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
    const va = sortKey === "rating" ? getRating(a) : a[sortKey];
    const vb = sortKey === "rating" ? getRating(b) : b[sortKey];
    return sortDir === "desc" ? vb - va : va - vb;
  });

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">Workspace Ranking</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-3 pr-4 font-medium w-12">#</th>
              <th className="pb-3 pr-4 font-medium">Workspace</th>
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
            {sorted.map((ws, i) => (
              <tr key={ws.id} className="border-b border-border/50 hover:bg-muted/50">
                <td className="py-3 pr-4 text-muted-foreground font-mono">{offset + i + 1}</td>
                <td className="py-3 pr-4 font-medium">{ws.name}</td>
                <td className="py-3 pr-4 text-muted-foreground">{emailPrefix(ws.developer_email)}</td>
                <td className="py-3 pr-4 text-right font-mono">{ws.user_count}</td>
                <td className="py-3 pr-4 text-right font-mono">{ws.chat_count}</td>
                <td className="py-3 pr-4 text-right font-mono">{ws.message_count}</td>
                <td className="py-3 pr-4 text-right"><RatingCell value={getRating(ws)} /></td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-muted-foreground">No workspace data.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination total={total} offset={offset} limit={limit} onPageChange={onPageChange} />
    </div>
  );
}
