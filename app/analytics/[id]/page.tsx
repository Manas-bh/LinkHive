"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import GeospatialMap from "@/components/GeospatialMap";

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    if (!params?.id) return;
    try {
      const response = await fetch(`/api/analytics/url/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [params?.id]);

  useEffect(() => {
    if (params?.id) {
      fetchAnalytics();
    }
  }, [params?.id, fetchAnalytics]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-gray-400">Analytics not found</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            Go Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const {
    url,
    metrics,
    clicksByDay,
    deviceBreakdown,
    browserBreakdown,
    osBreakdown,
    geoBreakdown,
    clickCoordinates,
  } = analytics;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white">Analytics</h1>
                <p className="text-sm text-gray-400">{url?.shortUrl}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
              onClick={() => {
                if (params?.id) {
                  window.location.href = `/api/analytics/export?urlId=${params.id}`;
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* URL Info Card */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <a
                  href={url?.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 font-medium hover:underline text-lg"
                >
                  {url?.shortUrl}
                </a>
                <button
                  onClick={() => copyToClipboard(url?.shortUrl)}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  {copied ? (
                    <svg
                      className="w-4 h-4 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                <ExternalLink className="w-4 h-4 text-gray-500" />
              </div>
              <p className="text-sm text-gray-400">{url?.originalUrl}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm font-medium">
                {url?.status}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Total Clicks</p>
            <p className="text-3xl font-bold text-white">
              {metrics?.totalClicks?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Unique Visitors</p>
            <p className="text-3xl font-bold text-white">
              {metrics?.uniqueVisitors?.toLocaleString() || 0}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <p className="text-sm text-gray-400 mb-2">Top Location</p>
            <p className="text-xl font-bold text-white">
              {geoBreakdown?.[0]?.country || "N/A"}
            </p>
          </div>
        </div>

        {/* Charts */}
        <AnalyticsCharts
          clicksByDay={clicksByDay || []}
          deviceBreakdown={deviceBreakdown || []}
          browserBreakdown={browserBreakdown || []}
          osBreakdown={osBreakdown || []}
        />

        {/* Geospatial Map */}
        {clickCoordinates && clickCoordinates.length > 0 && (
          <div className="mt-6 bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              Clicks Demographics
            </h3>
            <GeospatialMap clicks={clickCoordinates} height="500px" />
          </div>
        )}

        {/* Geographic Breakdown */}
        <div className="mt-6 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            Clicks Demographics
          </h3>
          <div className="space-y-3">
            {geoBreakdown?.slice(0, 5).map((geo: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-300">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {geo.country}
                    </p>
                    <p className="text-xs text-gray-400">{geo.city}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">
                    {geo.count} clicks
                  </p>
                  <p className="text-xs text-gray-400">
                    {((geo.count / (metrics?.totalClicks || 1)) * 100).toFixed(
                      0
                    )}
                    %
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
