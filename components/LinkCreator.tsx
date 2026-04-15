"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LinkCreatorProps {
  onLinkCreated?: (link: any) => void;
}

export default function LinkCreator({ onLinkCreated }: LinkCreatorProps) {
  const [url, setUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          customAlias: customAlias || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create link");
      }

      setUrl("");
      setCustomAlias("");

      if (onLinkCreated) {
        onLinkCreated(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create link");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Link Creation Form */}
      <div className="bg-gray-900 rounded-xl shadow-lg p-6 md:p-8 border border-gray-800">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Destination URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Destination
            </label>
            <Input
              type="url"
              placeholder="http://example.com/my-long-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="h-12 text-base bg-gray-800 border-gray-700 text-white placeholder-gray-500"
            />
          </div>

          {/* Custom Alias */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Custom back half{" "}
              <span className="text-gray-500 text-xs">(optional)</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 flex items-center gap-2">
                <span className="text-gray-400">Our Domain</span>
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <span className="text-gray-500 text-xl">/</span>
              <Input
                type="text"
                placeholder="Example : python class"
                value={customAlias}
                onChange={(e) =>
                  setCustomAlias(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                  )
                }
                className="flex-1 h-12 text-base bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setUrl("");
                setCustomAlias("");
                setError("");
              }}
              className="flex-1 h-12 text-gray-300 border-gray-700 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !url}
              className="flex-1 h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "Creating..." : "Shorten My Link →"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
