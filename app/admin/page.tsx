"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import {
  Users,
  Link2,
  TrendingUp,
  Layers,
  Shield,
  Search,
  Bell,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalUrls: 0,
    totalClicks: 0,
    totalCampaigns: 0,
    recentUsers: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAdminStats = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/stats");
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        if (response.status === 403) {
          setError("Access Denied: You do not have admin privileges.");
          setTimeout(() => router.push("/dashboard"), 3000);
        } else {
          setError(data.error || "Failed to fetch stats");
        }
      }
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      // Check if user is admin (client-side check, API will verify strictly)
      // Note: session.user.role might not be available immediately if not in session callback
      // We'll rely on the API response to handle 403
      fetchAdminStats();
    }
  }, [status, router, fetchAdminStats]);

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await response.json();

      if (data.success) {
        fetchAdminStats(); // Refresh list
      } else {
        alert(data.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center max-w-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-red-400 mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

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
              <span className="text-white font-medium">Admin</span>
              <span className="text-gray-500">›</span>
              <span className="text-blue-400">Dashboard</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search users..."
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
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  Admin Overview
                </h1>
                <p className="text-gray-400 text-sm">
                  System-wide statistics and management
                </p>
              </div>
              <Button
                onClick={() => router.push("/admin/settings")}
                className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Total Users
                  </p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {stats.totalUsers}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    Total Links
                  </p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {stats.totalUrls}
                  </p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <Link2 className="w-8 h-8 text-purple-400" />
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
                  <p className="text-sm font-medium text-gray-400">Campaigns</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {stats.totalCampaigns}
                  </p>
                </div>
                <div className="p-3 bg-orange-500/10 rounded-xl">
                  <Layers className="w-8 h-8 text-orange-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Users Table */}
          <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Recent Users</h2>
              <button className="text-sm text-blue-400 hover:text-blue-300">
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-800/50 text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Joined</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {stats.recentUsers.map((user: any) => (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                            {user.firstName[0]}
                            {user.lastName[0]}
                          </div>
                          <span className="text-white font-medium">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.role !== "admin" && (
                            <button
                              onClick={() =>
                                handleUpdateUser(user._id, { role: "admin" })
                              }
                              className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded hover:bg-purple-500/20"
                            >
                              Make Admin
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleUpdateUser(user._id, {
                                isActive: !user.isActive,
                              })
                            }
                            className={`text-xs px-2 py-1 rounded border ${
                              user.isActive
                                ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                                : "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                            }`}
                          >
                            {user.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
