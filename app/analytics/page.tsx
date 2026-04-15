"use client";

import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import { Button } from "@/components/ui/button";
import {
  RefreshCcw,
  ArrowRight,
  TrendingUp,
  Users,
  Target,
  Activity,
  ExternalLink,
} from "lucide-react";

interface OverviewMetrics {
  totalLinks: number;
  totalClicks: number;
  totalUniqueVisitors: number;
  activeLinks: number;
}

interface BreakdownRow {
  name: string;
  value: number;
}

interface LinkSnapshot {
  id: string;
  shortUrl?: string;
  originalUrl: string;
  clicks: number;
  status?: string;
  createdAt?: string;
}

interface OverviewData {
  metrics: OverviewMetrics;
  clicksByDay: { date: string; clicks: number }[];
  deviceBreakdown: BreakdownRow[];
  browserBreakdown: BreakdownRow[];
  osBreakdown: BreakdownRow[];
  geoBreakdown: { country: string; city: string; count: number }[];
  topLinks: LinkSnapshot[];
  recentLinks: LinkSnapshot[];
}

const RANGE_OPTIONS = [
  { label: "7d", value: "7" },
  { label: "30d", value: "30" },
  { label: "90d", value: "90" },
];

export default function AnalyticsOverviewPage() {
  const { status } = useSession();
  const router = useRouter();
  const [selectedRange, setSelectedRange] = useState("30");
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOverview = useCallback(async (range: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/analytics/overview?days=${range}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch analytics");
      }

      setOverview(result.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch analytics"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchOverview(selectedRange);
    }
  }, [status, selectedRange, fetchOverview]);

  const formattedGeo = useMemo(() => {
    if (!overview?.geoBreakdown?.length) return [];
    return overview.geoBreakdown.slice(0, 5);
  }, [overview]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading analytics…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
        <p className="text-red-400 mb-4">{error}</p>
        <Button
          onClick={() => fetchOverview(selectedRange)}
          className="flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
        <p className="text-gray-400 mb-4">No analytics available yet.</p>
        <Button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          Create your first link
        </Button>
      </div>
    );
  }

  const {
    metrics,
    clicksByDay,
    deviceBreakdown,
    browserBreakdown,
    osBreakdown,
    topLinks,
    recentLinks,
  } = overview;

  return (
    <div className="flex h-screen bg-gray-950">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">🏠</span>
              <span className="text-gray-500">›</span>
              <span className="text-white font-medium">Analytics</span>
              <span className="text-gray-500">›</span>
              <span className="text-blue-400">Overview</span>
            </div>
            <div className="flex items-center gap-2">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedRange(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                    selectedRange === option.value
                      ? "bg-blue-600 text-white border-blue-500"
                      : "bg-gray-900 text-gray-400 border-gray-700 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              icon={TrendingUp}
              label="Total Clicks"
              value={metrics.totalClicks.toLocaleString()}
              badge="Live"
            />
            <MetricCard
              icon={Users}
              label="Unique Visitors"
              value={metrics.totalUniqueVisitors.toLocaleString()}
              badge="All time"
            />
            <MetricCard
              icon={Target}
              label="Active Links"
              value={metrics.activeLinks.toString()}
              badge={`${metrics.totalLinks} total`}
            />
            <MetricCard
              icon={Activity}
              label="Links Created"
              value={metrics.totalLinks.toString()}
              badge="Portfolio"
            />
          </div>

          {/* Charts */}
          <div className="mb-8">
            <AnalyticsCharts
              clicksByDay={clicksByDay}
              deviceBreakdown={deviceBreakdown}
              browserBreakdown={browserBreakdown}
              osBreakdown={osBreakdown}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Top Links */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 xl:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Top Performing Links
                  </h2>
                  <p className="text-sm text-gray-400">Based on click volume</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => router.push("/history")}
                >
                  View History
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-300">
                  <thead>
                    <tr className="text-gray-500 uppercase text-xs">
                      <th className="text-left pb-3">Short URL</th>
                      <th className="text-left pb-3">Destination</th>
                      <th className="text-right pb-3">Clicks</th>
                      <th className="text-right pb-3">Status</th>
                      <th className="text-right pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {topLinks.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-6 text-center text-gray-500"
                        >
                          No click data yet.
                        </td>
                      </tr>
                    )}
                    {topLinks.map((link) => (
                      <tr key={link.id} className="hover:bg-gray-800/50">
                        <td className="py-3 pr-4">
                          <p className="text-white text-sm truncate max-w-[160px]">
                            {link.shortUrl || "—"}
                          </p>
                        </td>
                        <td className="py-3 pr-4 max-w-[240px] truncate">
                          {link.originalUrl}
                        </td>
                        <td className="py-3 text-right font-semibold text-white">
                          {link.clicks.toLocaleString()}
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusPill(
                              link.status
                            )}`}
                          >
                            {link.status || "unknown"}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            href={`/analytics/${link.id}`}
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
                          >
                            View
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Geography */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Top Locations
                  </h2>
                  <p className="text-sm text-gray-400">
                    Top countries & cities
                  </p>
                </div>
                <GlobeIcon />
              </div>
              {formattedGeo.length ? (
                <div className="space-y-4">
                  {formattedGeo.map((geo, index) => (
                    <div
                      key={`${geo.country}-${geo.city}`}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {geo.country}
                          </p>
                          <p className="text-gray-400 text-xs">{geo.city}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-sm font-semibold">
                          {geo.count}
                        </p>
                        <p className="text-gray-500 text-xs">clicks</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No geographic data yet.</p>
              )}
            </div>
          </div>

          {/* Recent activity */}
          <div className="mt-8 bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Recent Activity
                </h2>
                <p className="text-sm text-gray-400">
                  Newest links and their performance
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => fetchOverview(selectedRange)}
                className="flex items-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
            <div className="space-y-4">
              {recentLinks.length === 0 && (
                <p className="text-gray-500 text-sm">
                  No recent links created.
                </p>
              )}
              {recentLinks.map((link) => (
                <div
                  key={`${link.id}-recent`}
                  className="flex flex-wrap items-center gap-4 py-3 border-b border-gray-800 last:border-none"
                >
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-white text-sm font-medium truncate">
                      {link.shortUrl || link.originalUrl}
                    </p>
                    <p className="text-gray-500 text-xs truncate">
                      {link.originalUrl}
                    </p>
                  </div>
                  <div className="text-right text-white font-semibold">
                    {link.clicks.toLocaleString()}{" "}
                    <span className="text-gray-500 text-xs font-normal">
                      clicks
                    </span>
                  </div>
                  <div className="text-gray-400 text-xs">
                    {link.createdAt
                      ? new Date(link.createdAt).toLocaleDateString()
                      : "—"}
                  </div>
                  <Link
                    href={`/analytics/${link.id}`}
                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
                  >
                    Details
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  badge,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  badge?: string;
}) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
        </div>
        <div className="p-3 bg-blue-500/10 rounded-xl">
          <Icon className="w-7 h-7 text-blue-400" />
        </div>
      </div>
      {badge && <p className="text-xs text-gray-500 mt-4">{badge}</p>}
    </div>
  );
}

function getStatusPill(status?: string) {
  switch (status) {
    case "active":
      return "bg-green-500/10 text-green-400";
    case "paused":
      return "bg-yellow-500/10 text-yellow-400";
    case "disabled":
      return "bg-red-500/10 text-red-400";
    default:
      return "bg-gray-700 text-gray-300";
  }
}

function GlobeIcon() {
  return (
    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m-9 9h18"
        />
      </svg>
    </div>
  );
}
