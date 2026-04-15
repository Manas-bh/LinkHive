"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import { Settings, Shield, Search, Bell, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState({
    allowRegistration: true,
    maintenanceMode: false,
    defaultUrlExpiryDays: 365,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [bulkUploadText, setBulkUploadText] = useState("");

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/settings");
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
        setError("");
        setAccessDenied(false);
      } else {
        if (response.status === 403) {
          setError("Access Denied: You do not have admin privileges.");
          setAccessDenied(true);
          setTimeout(() => router.push("/dashboard"), 3000);
        } else {
          setAccessDenied(false);
          setError(data.error || "Failed to fetch settings");
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      setAccessDenied(false);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      fetchSettings();
    }
  }, [status, router, fetchSettings]);

  const handleSaveSettings = async () => {
    setSaving(true);
    setSuccessMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json();

      if (data.success) {
        setSuccessMessage("Settings saved successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setError(data.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkUploadText.trim()) {
      setError("Please enter URLs to upload");
      return;
    }

    setUploading(true);
    setSuccessMessage("");
    setError("");

    try {
      // Parse CSV-like text (url,alias)
      const lines = bulkUploadText.trim().split("\n");
      const urls = lines
        .map((line) => {
          const [originalUrl, customAlias] = line
            .split(",")
            .map((s) => s.trim());
          return { originalUrl, customAlias: customAlias || undefined };
        })
        .filter((u) => u.originalUrl);

      const response = await fetch("/api/admin/bulk-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      const data = await response.json();

      if (data.success) {
        setSuccessMessage(
          `Uploaded ${data.data.success.length} URLs. ${data.data.failed.length} failed.`
        );
        setBulkUploadText("");
      } else {
        setError(data.error || "Failed to upload URLs");
      }
    } catch (error) {
      console.error("Error uploading URLs:", error);
      setError("Failed to upload URLs");
    } finally {
      setUploading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Settings...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center max-w-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-red-400 mb-6">{error}</p>
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
              <span className="text-blue-400">Settings</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-64"
                />
              </div>
              <button
                type="button"
                aria-label="Notifications"
                className="relative p-2 bg-gray-800 rounded-lg hover:bg-gray-700"
              >
                <Bell className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-1">
                System Settings
              </h1>
              <p className="text-gray-400 text-sm">
                Configure system-wide settings and bulk operations
              </p>
            </div>

            {/* Messages */}
            {successMessage && (
              <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <p className="text-green-400">{successMessage}</p>
              </div>
            )}
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {/* Settings Form */}
            <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">
                  General Settings
                </h2>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium mb-1">
                      Allow Registration
                    </h3>
                    <p className="text-sm text-gray-400">
                      Enable new users to register
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allowRegistration}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          allowRegistration: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium mb-1">
                      Maintenance Mode
                    </h3>
                    <p className="text-sm text-gray-400">
                      Put the site in maintenance mode
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          maintenanceMode: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    Default URL Expiry (days)
                  </label>
                  <input
                    type="number"
                    value={settings.defaultUrlExpiryDays}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultUrlExpiryDays: parseInt(e.target.value) || 365,
                      })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    min="1"
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    Number of days before URLs expire by default
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </div>

            {/* Bulk Upload */}
            <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Upload className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">
                  Bulk URL Upload
                </h2>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  URLs (one per line)
                </label>
                <textarea
                  value={bulkUploadText}
                  onChange={(e) => setBulkUploadText(e.target.value)}
                  placeholder="https://example.com,custom-alias&#10;https://another.com"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
                  rows={10}
                />
                <p className="text-sm text-gray-400 mt-2">
                  Format:{" "}
                  <code className="bg-gray-800 px-2 py-1 rounded">
                    url,alias
                  </code>{" "}
                  (alias is optional)
                </p>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleBulkUpload}
                  disabled={uploading}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : "Upload URLs"}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
