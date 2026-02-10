"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LinkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  urlData: any;
}

export default function LinkEditModal({
  isOpen,
  onClose,
  onSuccess,
  urlData,
}: LinkEditModalProps) {
  const [originalUrl, setOriginalUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (urlData) {
      setOriginalUrl(urlData.originalUrl || "");
      setCustomAlias(urlData.customAlias || "");
      // Password is intentionally not pre-filled for security

      if (urlData.expiresAt) {
        const date = new Date(urlData.expiresAt);
        setExpiresAt(date.toISOString().split("T")[0]);
      } else {
        setExpiresAt("");
      }
      setStatus(urlData.status || "active");
    }
  }, [urlData]);

  if (!isOpen || !urlData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/url/manage/${urlData._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalUrl,
          customAlias,
          password: password || undefined,
          expiresAt: expiresAt || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(data.error || "Failed to update link");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/url/manage/${urlData._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (data.success) {
        setStatus(newStatus);
        onSuccess?.();
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this link? This action cannot be undone."
      )
    )
      return;

    try {
      const response = await fetch(`/api/url/manage/${urlData._id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error("Failed to delete link", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-lg w-full p-8 relative border border-gray-800 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Edit Link</h2>
          <p className="text-sm text-gray-400">
            Update your link details and settings
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Destination URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Destination URL
            </label>
            <Input
              type="url"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              required
              className="h-11 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
            />
          </div>

          {/* Custom Alias */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Custom Alias (Optional)
            </label>
            <Input
              type="text"
              value={customAlias}
              onChange={(e) => setCustomAlias(e.target.value)}
              placeholder="my-custom-link"
              className="h-11 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
            />
          </div>

          {/* Password Protection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password Protection (Optional)
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Set a new password to protect this link"
              className="h-11 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
            />
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Expiration Date (Optional)
            </label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="h-11 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
            />
          </div>

          {/* Status & Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-800 mt-6">
            <div className="flex items-center gap-2">
              {status === "active" ? (
                <Button
                  type="button"
                  onClick={() => handleStatusChange("paused")}
                  variant="outline"
                  size="sm"
                  className="text-yellow-400 border-yellow-400/20 hover:bg-yellow-400/10"
                >
                  <Pause className="w-4 h-4 mr-1" /> Pause
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => handleStatusChange("active")}
                  variant="outline"
                  size="sm"
                  className="text-green-400 border-green-400/20 hover:bg-green-400/10"
                >
                  <Play className="w-4 h-4 mr-1" /> Activate
                </Button>
              )}

              <Button
                type="button"
                onClick={handleDelete}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
              >
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 h-11 bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "Save Changes" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
