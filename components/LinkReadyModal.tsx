"use client";

import {
  X,
  Download,
  Copy,
  Check,
  Link2,
  Instagram,
  Facebook,
  Mail,
} from "lucide-react";
import { useMemo, useState } from "react";
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

  const socialShares = useMemo(
    () => [
      {
        name: "WhatsApp",
        href: `https://wa.me/?text=${encodeURIComponent(shortUrl)}`,
        icon: <span className="text-sm font-bold">WA</span>,
      },
      {
        name: "Instagram",
        href: "https://www.instagram.com/",
        icon: <Instagram className="w-4 h-4" />,
      },
      {
        name: "Facebook",
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shortUrl)}`,
        icon: <Facebook className="w-4 h-4" />,
      },
      {
        name: "X",
        href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shortUrl)}`,
        icon: <span className="text-sm font-bold">X</span>,
      },
      {
        name: "Gmail",
        href: `mailto:?body=${encodeURIComponent(shortUrl)}`,
        icon: <Mail className="w-4 h-4" />,
      },
      {
        name: "Threads",
        href: "https://www.threads.net/",
        icon: <span className="text-sm font-bold">@</span>,
      },
    ],
    [shortUrl]
  );

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

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm p-4 grid place-items-center">
      <div className="relative max-w-[470px] w-full rounded-2xl border border-white/30 bg-[#111216] p-7 shadow-[0_25px_50px_rgba(0,0,0,.6)]">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Your Short Link is Ready! 🌟
          </h2>
          <p className="text-gray-400 mt-3">
            Share it, track it, or save it - your link is ready for action!
          </p>
        </div>

        <div className="mx-auto mt-7 w-fit rounded-xl bg-white p-3">
          <Image
            src={qrCode}
            alt="QR Code"
            width={180}
            height={180}
            className="w-[180px] h-[180px]"
            unoptimized
          />
        </div>

        <div className="mt-6 text-center text-2xl text-[#4b9bff] font-medium break-all">
          {shortUrl}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={downloadQR}
            className="flex-1 rounded-lg bg-[#3579ea] text-white py-2.5 flex items-center justify-center gap-2 hover:bg-[#2a67cb]"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </button>
          <button
            onClick={copyToClipboard}
            className="rounded-lg bg-[#2f3440] text-white px-4 hover:bg-[#414857]"
            aria-label="Copy link"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onCreateNew}
            className="flex-1 rounded-lg border border-white/10 bg-[#2a2e37] py-2.5 text-white hover:bg-[#383d47] flex items-center justify-center gap-2"
          >
            <Link2 className="w-4 h-4" />
            Create new link
          </button>
          <button
            onClick={copyToClipboard}
            className="flex-1 rounded-lg bg-[#3579ea] py-2.5 text-white hover:bg-[#2a67cb]"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>

        <div className="mt-7 grid grid-cols-6 gap-2">
          {socialShares.map((social) => (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-white/10 bg-[#2b2e36] py-2 px-1 text-center text-[10px] text-gray-300 hover:bg-[#3a3f49]"
            >
              <div className="mx-auto mb-1 grid place-items-center text-white">
                {social.icon}
              </div>
              {social.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
