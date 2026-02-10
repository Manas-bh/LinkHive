"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Download, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import GeospatialMap from "@/components/GeospatialMap";

export default function CampaignAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    if (!params?.id) return;
    try {
      const response = await fetch(`/api/analytics/campaign/${params.id}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || "Failed to load analytics");
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
      setError("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [params?.id]);

  useEffect(() => {
    if (params?.id) {
      fetchAnalytics();
    }
  }, [params?.id, fetchAnalytics]);
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white">
        <p className="text-red-400 mb-4">{error || "Campaign not found"}</p>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const {
    campaign,
    metrics,
    influencers,
    clicksByDay,
    deviceBreakdown,
    browserBreakdown,
    osBreakdown,
    geoBreakdown,
    clickCoordinates,
  } = data;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {campaign.name}
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">
                  Campaign
                </span>
              </h1>
              <a
                href={campaign.destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-blue-400 flex items-center gap-1 mt-1"
              >
                {campaign.destinationUrl}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <Button className="bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
            <p className="text-sm text-gray-400 mb-1">Total Clicks</p>
            <p className="text-3xl font-bold text-white">
              {metrics.totalClicks.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
            <p className="text-sm text-gray-400 mb-1">Unique Visitors</p>
            <p className="text-3xl font-bold text-white">
              {metrics.totalUniqueVisitors.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
            <p className="text-sm text-gray-400 mb-1">Influencers</p>
            <p className="text-3xl font-bold text-white">
              {influencers.length}
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

        {/* Influencer Stats Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Influencer Performance
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-gray-800/50 text-gray-300 uppercase font-medium">
                <tr>
                  <th className="px-6 py-3">Influencer Name</th>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3 text-right">Clicks</th>
                  <th className="px-6 py-3 text-right">Unique Visitors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {influencers.length ? (
                  influencers.map((stat: any, index: number) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-white">
                        {stat.name}
                      </td>
                      <td className="px-6 py-4">{stat.influencerId}</td>
                      <td className="px-6 py-4 text-right text-white">
                        {stat.clicks.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {stat.uniqueVisitors.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="px-6 py-8 text-center text-gray-400"
                      colSpan={4}
                    >
                      No influencer traffic recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Map */}
        {clickCoordinates?.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">
              Global Traffic
            </h3>
            <div className="h-[400px] rounded-lg overflow-hidden border border-gray-800">
              <GeospatialMap clicks={clickCoordinates} />
            </div>
          </div>
        )}

        {/* Geographic Breakdown */}
        {geoBreakdown?.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Top Locations
            </h3>
            <div className="space-y-3">
              {geoBreakdown.slice(0, 5).map((geo: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
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
                      {((geo.count / (metrics.totalClicks || 1)) * 100).toFixed(
                        0
                      )}
                      %
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
