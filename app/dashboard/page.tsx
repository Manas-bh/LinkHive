"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import LinkCreator from "@/components/LinkCreator";
import Sidebar from "@/components/Sidebar";
import LinkReadyModal from "@/components/LinkReadyModal";
import {
  Link2,
  TrendingUp,
  ExternalLink,
  Copy,
  MoreVertical,
  Search,
  Bell,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LinkEditModal from "@/components/LinkEditModal";

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [links, setLinks] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalLinks: 0,
    totalClicks: 0,
    activeLinks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [createdLink, setCreatedLink] = useState<any>(null);
  const [editingLink, setEditingLink] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      fetchLinks();
    }
  }, [status, router]);

  const fetchLinks = async () => {
    try {
      const response = await fetch("/api/url");
      const data = await response.json();

      if (data.success) {
        setLinks(data.data || []);

        // Calculate stats
        const totalLinks = data.data.length;
        const totalClicks = data.data.reduce(
          (sum: number, link: any) => sum + (link.clicks || 0),
          0
        );
        const activeLinks = data.data.filter(
          (link: any) => link.status === "active"
        ).length;

        setStats({ totalLinks, totalClicks, activeLinks });
      }
    } catch (error) {
      console.error("Failed to fetch links:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkCreated = (link: any) => {
    setCreatedLink(link);
    setModalOpen(true);
    fetchLinks();
  };

  const handleCreateNew = () => {
    setModalOpen(false);
    setCreatedLink(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">🏠</span>
              <span className="text-gray-500">›</span>
              <span className="text-white font-medium">Dashboard</span>
              <span className="text-gray-500">›</span>
              <span className="text-blue-400">Link</span>
            </div>

            {/* Search and Notifications */}
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

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">Create Link</h1>
            <p className="text-gray-400 text-sm">
              Shorten your URL and track its performance
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Total Links
                  </p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {stats.totalLinks}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Link2 className="w-8 h-8 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Total Clicks
                  </p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {stats.totalClicks.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Active Links
                  </p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {stats.activeLinks}
                  </p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <svg
                    className="w-8 h-8 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Link Creator */}
          <div className="mb-8">
            <LinkCreator onLinkCreated={handleLinkCreated} />
          </div>

          {/* Recent Links */}
          <div className="bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-6">Recent Links</h2>

            {links.length === 0 ? (
              <div className="text-center py-12">
                <Link2 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500">
                  No links yet. Create your first short link above!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {links.slice(0, 10).map((link) => (
                  <div
                    key={link._id}
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <a
                          href={link.shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 font-medium hover:underline"
                        >
                          {link.shortUrl}
                        </a>
                        <button
                          onClick={() => copyToClipboard(link.shortUrl)}
                          type="button"
                          aria-label="Copy short URL"
                          className="p-1 hover:bg-gray-700 rounded"
                        >
                          <Copy className="w-4 h-4 text-gray-500" />
                        </button>
                        <ExternalLink className="w-4 h-4 text-gray-600" />
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {link.originalUrl}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 ml-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">
                          {link.clicks || 0} clicks
                        </p>
                        <p className="text-xs text-gray-500">
                          {link.uniqueVisitors || 0} unique
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-white"
                        onClick={() => setEditingLink(link)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Success Modal */}
      {createdLink && (
        <LinkReadyModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          shortUrl={createdLink.shortUrl}
          qrCode={createdLink.qrCode}
          onCreateNew={handleCreateNew}
        />
      )}

      <LinkEditModal
        isOpen={!!editingLink}
        onClose={() => setEditingLink(null)}
        onSuccess={fetchLinks}
        urlData={editingLink}
      />
    </div>
  );
}
