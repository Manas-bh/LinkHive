"use client";

import Sidebar from "@/components/Sidebar";
import {
  Search,
  Bell,
  Filter,
  MoreHorizontal,
  Calendar,
  Lock,
  Eye,
  Share2,
  Edit,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import LinkEditModal from "@/components/LinkEditModal";
import Image from "next/image";
import Link from "next/link";

export default function HistoryPage() {
  const [links, setLinks] = useState<any[]>([]);
  const [filter, setFilter] = useState("active");
  const [editingLink, setEditingLink] = useState<any>(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const response = await fetch("/api/url");
      const data = await response.json();

      if (data.success) {
        setLinks(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch links:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-400 border border-green-500/20";
      case "paused":
        return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
      case "disabled":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
    }
  };

  const getLinkIcon = (index: number) => {
    const icons = [
      { color: "bg-gradient-to-br from-blue-500 to-cyan-500", emoji: "🌐" },
      { color: "bg-gradient-to-br from-purple-500 to-pink-500", emoji: "🎯" },
      { color: "bg-gradient-to-br from-orange-500 to-red-500", emoji: "📱" },
      { color: "bg-gradient-to-br from-green-500 to-emerald-500", emoji: "✨" },
    ];
    return icons[index % icons.length];
  };

  const filteredLinks = links.filter((link) => {
    if (filter === "all") {
      return true;
    }
    return link.status === filter;
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
              <h1 className="text-2xl font-bold text-white">History</h1>

              <div className="flex items-center gap-3">
                <Button className="bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700">
                  <Filter className="w-4 h-4 mr-2" />
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
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Selection Bar */}
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

            {/* Link Cards */}
            <div className="space-y-4">
              {filteredLinks.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
                  <p className="text-gray-500">No links in history.</p>
                </div>
              ) : (
                filteredLinks.map((link, index) => {
                  const icon = getLinkIcon(index);

                  return (
                    <div
                      key={link._id}
                      className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div
                          className={`w-14 h-14 ${icon.color} rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-lg`}
                        >
                          {icon.emoji}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="mb-2">
                            <h3 className="text-lg font-semibold text-white mb-1">
                              {link.customAlias || link.urlCode}
                            </h3>
                            <a
                              href={link.shortUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-400 hover:underline block mb-1"
                            >
                              {link.shortUrl}
                            </a>
                            <p className="text-sm text-gray-500 truncate">
                              {link.originalUrl}
                            </p>
                          </div>

                          {/* Metadata Pills */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/analytics/${link._id}`}
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
                                {new Date(link.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            {link.password && (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 rounded-lg">
                                <Lock className="w-4 h-4 text-yellow-400" />
                                <span className="text-sm text-gray-400">
                                  Protected
                                </span>
                              </div>
                            )}

                            <div
                              className={`px-3 py-1.5 rounded-lg ${getStatusColor(
                                link.status
                              )}`}
                            >
                              <span className="text-sm font-medium capitalize">
                                {link.status}
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
                            onClick={() => setEditingLink(link)}
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

                        {/* QR Code */}
                        {link.qrCode && (
                          <div className="shrink-0">
                            <Image
                              src={link.qrCode}
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
                })
              )}
            </div>

            {/* End Message */}
            {filteredLinks.length > 0 && (
              <div className="text-center mt-8 pb-4">
                <p className="text-gray-500 text-sm">History ends here.</p>
              </div>
            )}
          </div>
        </main>

        <LinkEditModal
          isOpen={!!editingLink}
          onClose={() => setEditingLink(null)}
          onSuccess={fetchLinks}
          urlData={editingLink}
        />
      </div>
    </div>
  );
}
