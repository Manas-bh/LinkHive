"use client";

import Sidebar from "@/components/Sidebar";
import {
  Search,
  Bell,
  Share2,
  Edit,
  MoreHorizontal,
  Calendar,
  Lock,
  Eye,
  Plus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import CampaignCreateModal from "@/components/CampaignCreateModal";
import Image from "next/image";
import Link from "next/link";

export default function AdvanceToolsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [filter, setFilter] = useState("active");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch("/api/campaign");
      const data = await response.json();

      if (data.success) {
        setCampaigns(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-400";
      case "paused":
        return "bg-yellow-500/10 text-yellow-400";
      case "completed":
        return "bg-red-500/10 text-red-400";
      default:
        return "bg-gray-500/10 text-gray-400";
    }
  };

  const getCampaignIcon = (index: number) => {
    const icons = [
      { color: "bg-red-500", emoji: "📺" },
      { color: "bg-blue-500", emoji: "🌐" },
      { color: "bg-purple-500", emoji: "🎯" },
      { color: "bg-green-500", emoji: "📱" },
    ];
    return icons[index % icons.length];
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    if (filter === "all") {
      return true;
    }
    return campaign.status === filter;
  });

  return (
    <div className="flex h-screen bg-gray-950">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">🏠</span>
              <span className="text-gray-500">›</span>
              <span className="text-white font-medium">Dashboard</span>
              <span className="text-gray-500">›</span>
              <span className="text-blue-400">History</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search"
                  className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-64"
                />
              </div>
              <button
                type="button"
                aria-label="Notifications"
                className="relative p-2 bg-gray-800 rounded-lg hover:bg-gray-700"
              >
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  Advance Tools{" "}
                  <span className="text-gray-500 text-sm">
                    (Active links only)
                  </span>
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
                <Button className="bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700">
                  <Calendar className="w-4 h-4 mr-2" />
                  Filter by Date
                </Button>
                <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 flex items-center gap-2">
                  <span className="text-sm text-gray-400">Show :</span>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="all">All</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Selection Info */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-700"
                />
                <span className="text-gray-400 text-sm">0 Selected</span>
              </div>
              <Button variant="ghost" size="sm" className="text-gray-500">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>

            {/* Campaign Cards */}
            {filteredCampaigns.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
                <div className="text-gray-500 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-400">
                  No campaigns yet. Create your first campaign!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCampaigns.map((campaign, index) => {
                  const icon = getCampaignIcon(index);

                  return (
                    <div
                      key={campaign._id}
                      className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div
                          className={`w-14 h-14 ${icon.color} rounded-xl flex items-center justify-center text-2xl shrink-0`}
                        >
                          {icon.emoji}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-1">
                                {campaign.name}
                              </h3>
                              <a
                                href={campaign.destinationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-400 hover:underline truncate block"
                              >
                                {campaign.destinationUrl ||
                                  "No destination URL"}
                              </a>
                            </div>
                          </div>

                          {/* Metadata */}
                          <div className="flex flex-wrap items-center gap-3 mt-3">
                            <Link
                              href={`/analytics/campaign/${campaign._id}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                              <Eye className="w-4 h-4 text-blue-400" />
                              <span className="text-sm text-gray-300">
                                Analytics
                              </span>
                            </Link>

                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 rounded-lg">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-400">
                                {new Date(
                                  campaign.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>

                            {campaign.password && (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 rounded-lg">
                                <Lock className="w-4 h-4 text-yellow-400" />
                                <span className="text-sm text-gray-400">
                                  Protected
                                </span>
                              </div>
                            )}

                            <div
                              className={`px-3 py-1.5 rounded-lg ${getStatusColor(
                                campaign.status
                              )}`}
                            >
                              <span className="text-sm font-medium capitalize">
                                {campaign.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white hover:bg-gray-800"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white hover:bg-gray-800"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white hover:bg-gray-800"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* QR Code (if available) */}
                        {campaign.qrCode && (
                          <div className="shrink-0">
                            <Image
                              src={campaign.qrCode}
                              alt="QR Code"
                              width={80}
                              height={80}
                              className="w-20 h-20 rounded-lg bg-white p-2 object-contain"
                              unoptimized
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* End Message */}
            {filteredCampaigns.length > 0 && (
              <div className="text-center mt-8 pb-4">
                <p className="text-gray-500 text-sm">History ends here.</p>
              </div>
            )}
          </div>
        </main>

        <CampaignCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={fetchCampaigns}
        />
      </div>
    </div>
  );
}
