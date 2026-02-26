import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MessagesSquare, MessageSquare, Bot, ThumbsUp } from "lucide-react";
import StatCard from "@/components/StatCard";
import DailyChart from "@/components/DailyChart";
import WorkspaceRankingTable from "@/components/WorkspaceRankingTable";
import DeveloperRankingTable from "@/components/DeveloperRankingTable";
import GroupRankingTable from "@/components/GroupRankingTable";
import RequirePackages from "@/components/RequirePackages";
import MockAuthBanner from "@/components/MockAuthBanner";
import {
  fetchOverview, fetchDailyStats, fetchWorkspaceRanking,
  fetchDeveloperRanking, fetchGroupRanking,
  type OverviewStats, type DailyStat,
  type WorkspaceRanking, type DeveloperRanking, type GroupRanking,
} from "@/lib/api";

const PAGE_SIZE = 20;

function kstDate(offsetDays: number): string {
  const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default function Dashboard() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [daily, setDaily] = useState<DailyStat[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceRanking[]>([]);
  const [developers, setDevelopers] = useState<DeveloperRanking[]>([]);
  const [groups, setGroups] = useState<GroupRanking[]>([]);
  const [mockUser, setMockUser] = useState(() => localStorage.getItem("mockUser") || "jisung.jang");
  const [searchParams, setSearchParams] = useSearchParams();
  const dateFrom = searchParams.get("from") || kstDate(-7);
  const dateTo = searchParams.get("to") || kstDate(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [wsOffset, setWsOffset] = useState(0);
  const [wsTotal, setWsTotal] = useState(0);
  const [devOffset, setDevOffset] = useState(0);
  const [devTotal, setDevTotal] = useState(0);
  const [grpOffset, setGrpOffset] = useState(0);
  const [grpTotal, setGrpTotal] = useState(0);

  useEffect(() => {
    Promise.all([
      fetchOverview().then(setOverview),
      fetchDailyStats(dateFrom, dateTo).then(setDaily),
      fetchWorkspaceRanking(0, PAGE_SIZE).then((res) => { setWorkspaces(res.items); setWsTotal(res.total); }),
      fetchDeveloperRanking(0, PAGE_SIZE).then((res) => { setDevelopers(res.items); setDevTotal(res.total); }),
      fetchGroupRanking(0, PAGE_SIZE).then((res) => { setGroups(res.items); setGrpTotal(res.total); }),
    ])
      .catch((err) => setError(err?.message || "Failed to load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  const handleDateChange = (from: string, to: string) => {
    setSearchParams({ from, to });
    fetchDailyStats(from, to)
      .then(setDaily)
      .catch((err) => setError(err?.message || "Failed to load daily stats."));
  };

  const handleWsPage = (newOffset: number) => {
    setWsOffset(newOffset);
    fetchWorkspaceRanking(newOffset, PAGE_SIZE).then((res) => { setWorkspaces(res.items); setWsTotal(res.total); });
  };
  const handleDevPage = (newOffset: number) => {
    setDevOffset(newOffset);
    fetchDeveloperRanking(newOffset, PAGE_SIZE).then((res) => { setDevelopers(res.items); setDevTotal(res.total); });
  };
  const handleGrpPage = (newOffset: number) => {
    setGrpOffset(newOffset);
    fetchGroupRanking(newOffset, PAGE_SIZE).then((res) => { setGroups(res.items); setGrpTotal(res.total); });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg text-red-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Chats" value={overview?.total_chats ?? 0} icon={MessagesSquare} />
        <StatCard title="Total Messages" value={overview?.total_messages ?? 0} icon={MessageSquare} />
        <StatCard title="Workspaces" value={overview?.total_models ?? 0} icon={Bot} />
        <StatCard title="Feedbacks" value={overview?.total_feedbacks ?? 0} icon={ThumbsUp} />
      </div>
      <DailyChart data={daily} dateFrom={dateFrom} dateTo={dateTo} onDateChange={handleDateChange} />
      <WorkspaceRankingTable data={workspaces} total={wsTotal} offset={wsOffset} limit={PAGE_SIZE} onPageChange={handleWsPage} />
      <DeveloperRankingTable data={developers} total={devTotal} offset={devOffset} limit={PAGE_SIZE} onPageChange={handleDevPage} />
      <GroupRankingTable data={groups} total={grpTotal} offset={grpOffset} limit={PAGE_SIZE} onPageChange={handleGrpPage} />
      <RequirePackages currentUser={mockUser} />
      <MockAuthBanner user={mockUser} onChangeUser={(u) => { setMockUser(u); localStorage.setItem("mockUser", u); }} />
    </div>
  );
}
