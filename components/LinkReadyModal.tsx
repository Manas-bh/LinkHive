"use client";

import { X, Download, Copy, Check } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface LinkReadyModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortUrl: string;
  qrCode: string;
  onCreateNew?: () => void;
}

export default function LinkReadyModal({
  isOpen,
  onClose,
  shortUrl,
  qrCode,
  onCreateNew,
}: LinkReadyModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `qr-code-${shortUrl.split("/").pop()}.png`;
    link.click();
  };

  const socialShares = [
    {
      name: "WhatsApp",
      icon: "/icons/whatsapp.svg",
      color: "bg-green-600",
      url: `https://wa.me/?text=${encodeURIComponent(shortUrl)}`,
    },
    {
      name: "Instagram",
      icon: "/icons/instagram.svg",
      color: "bg-gradient-to-br from-purple-600 to-pink-600",
      url: "#", // Instagram doesn't support direct sharing
    },
    {
      name: "Facebook",
      icon: "/icons/facebook.svg",
      color: "bg-blue-600",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shortUrl
      )}`,
    },
    {
      name: "X",
      icon: "/icons/x.svg",
      color: "bg-black",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        shortUrl
      )}`,
    },
    {
      name: "Email",
      icon: "/icons/email.svg",
      color: "bg-gray-600",
      url: `mailto:?body=${encodeURIComponent(shortUrl)}`,
    },
    {
      name: "Threads",
      icon: "/icons/threads.svg",
      color: "bg-black",
      url: "#", // Threads doesn't have direct sharing URL yet
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full p-8 relative border border-gray-800 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Your Short Link is Ready! ⭐
          </h2>
          <p className="text-sm text-gray-400">
            Share it, track it, or save it - your link is ready for action!
          </p>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-xl p-6 mb-6 flex items-center justify-center">
          <Image
            src={qrCode}
            alt="QR Code"
            width={192}
            height={192}
            className="w-48 h-48"
            unoptimized
          />
        </div>

        {/* Short URL */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <p className="text-blue-400 font-medium text-center truncate">
            {shortUrl}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={onCreateNew}
            className="flex-1 px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create new link
          </button>
          <button
            onClick={copyToClipboard}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy link
              </>
            )}
          </button>
        </div>

        {/* Download Button */}
        <button
          onClick={downloadQR}
          className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mb-6"
        >
          <Download className="w-4 h-4" />
          Download PNG
        </button>

        {/* Social Sharing */}
        <div className="grid grid-cols-6 gap-3">
          {socialShares.map((social) => (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${social.color} w-12 h-12 rounded-xl flex items-center justify-center hover:opacity-80 transition-opacity`}
              title={social.name}
            >
              <span className="text-white text-xs font-semibold">
                {social.name.charAt(0)}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
