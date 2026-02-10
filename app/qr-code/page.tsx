"use client";

import Sidebar from "@/components/Sidebar";
import { Search, Bell, Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

const colorPresets = [
  "#FFFFFF", // White
  "#EF4444", // Red
  "#F97316", // Orange
  "#10B981", // Green
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Purple
  "#EC4899", // Pink
];

export default function QRCodePage() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [selectedColor, setSelectedColor] = useState("#FFFFFF");
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const generateQRCode = async () => {
    setError("");
    setSuccessMessage("");

    if (!url.trim()) {
      setError("Please enter a destination URL");
      return;
    }

    try {
      new URL(url.trim());
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: url.trim(),
          color: selectedColor === "#FFFFFF" ? "#000000" : selectedColor,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate QR code");
      }

      setQrCode(data.data.qrCode);
      setSuccessMessage("QR code generated successfully");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate QR code"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrCode) return;
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `${customAlias || "qr-code"}.png`;
    link.click();
  };

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
              <span className="text-blue-400">QR Code</span>
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
              <button className="relative p-2 bg-gray-800 rounded-lg hover:bg-gray-700">
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-1">
                Create QR Code
              </h1>
            </div>

            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-6 bg-green-500/10 border border-green-500/20 text-green-300 rounded-lg px-4 py-3">
                {successMessage}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side - Form */}
              <div className="space-y-6">
                {/* Destination */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Destination
                  </label>
                  <Input
                    type="url"
                    placeholder="http://example.com/my-long-url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                  />
                </div>

                {/* Title */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Title{" "}
                    <span className="text-gray-500 text-xs">(Optional)</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                  />
                </div>

                {/* Customization */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <h3 className="text-sm font-medium text-gray-300 mb-4">
                    Customization
                  </h3>

                  <div className="space-y-4">
                    {/* Domain & Custom Alias */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">
                        Domain 🔒
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
                          onChange={(e) => setCustomAlias(e.target.value)}
                          className="flex-1 h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                        />
                      </div>
                    </div>

                    {/* Custom back half */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">
                        Custom back half 🖊️{" "}
                        <span className="text-gray-500">(Optional)</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Example : python class"
                        className="h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Security & Protection */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-300">
                      Security & Protection
                    </h3>
                    <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Input
                      type="password"
                      placeholder="Password"
                      className="h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                    />
                    <Input
                      type="password"
                      placeholder="Confirm your password"
                      className="h-12 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={generateQRCode}
                    disabled={loading}
                    className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
                  >
                    {loading ? "Generating…" : "Generate QR Code →"}
                  </Button>
                </div>
              </div>

              {/* Right Side - Preview */}
              <div className="space-y-6">
                {/* QR Code Preview */}
                <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
                  <h3 className="text-lg font-semibold text-white mb-6 text-center">
                    Preview
                  </h3>

                  <div className="bg-white rounded-xl p-12 mb-6 flex items-center justify-center">
                    <div className="w-64 h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                      {qrCode ? (
                        <Image
                          src={qrCode}
                          alt="QR Code"
                          width={256}
                          height={256}
                          className="w-full h-full"
                          unoptimized
                        />
                      ) : (
                        <div className="text-gray-400 text-center">
                          <svg
                            className="w-24 h-24 mx-auto mb-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                            />
                          </svg>
                          <p className="text-sm">QR Code Preview</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleDownload}
                    disabled={!qrCode}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PNG
                  </Button>
                </div>

                {/* Color Chooser */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <h3 className="text-sm font-medium text-gray-300 mb-4">
                    Choose Color
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">Preset</p>

                  <div className="grid grid-cols-4 gap-3">
                    {colorPresets.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-12 h-12 rounded-xl transition-all ${
                          selectedColor === color
                            ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900"
                            : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
