import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export function SortIcon<K extends string>({ col, sortKey, sortDir }: { col: K; sortKey: K; sortDir: "asc" | "desc" }) {
  if (sortKey !== col) return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 opacity-40" />;
  return sortDir === "desc"
    ? <ArrowDown className="ml-1 inline h-3.5 w-3.5" />
    : <ArrowUp className="ml-1 inline h-3.5 w-3.5" />;
}

export function RatingCell({ value }: { value: number }) {
  if (value > 0) return <span className="font-mono text-emerald-400">+{value}</span>;
  if (value < 0) return <span className="font-mono text-rose-400">{value}</span>;
  return <span className="font-mono text-muted-foreground">0</span>;
}

export function emailPrefix(email: string) {
  if (!email) return "-";
  return email.split("@")[0];
}
