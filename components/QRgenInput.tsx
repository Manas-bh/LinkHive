"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import arrow from "@/public/line-md_arrow-up.svg";
import clipboard from "@/public/clipboard.svg";
import qrman from "@/public/QRman.svg";

const QRgenInput = () => {
  const [placeholder, setPlaceholder] = useState("Enter your URL here");
  const [inputValue, setInputValue] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [qrCode, setQrCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputValue(text);
        setCopyStatus("Pasted!");
        setTimeout(() => setCopyStatus(""), 2000);
      } else {
        setCopyStatus("Nothing to paste");
        setTimeout(() => setCopyStatus(""), 2000);
      }
    } catch (err) {
      console.error("Failed to read clipboard: ", err);
      setCopyStatus("Failed to read clipboard");
      setTimeout(() => setCopyStatus(""), 2000);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setPlaceholder(
        window.innerWidth >= 768
          ? "https://example.com/your-long-url.com"
          : "Enter your URL here"
      );
    };

    // Set initial placeholder
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleGenerate = async () => {
    if (!inputValue.trim()) {
      setError("Please paste a URL first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: inputValue.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate QR code");
      }

      setQrCode(data.data.qrCode);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrCode) return;
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = "linkhive-qr.png";
    link.click();
  };

  return (
    <div
      className="relative flex flex-col md:flex-row 
      lg:bg-white lg:bg-opacity-[0.01] 
      w-[95vw] md:w-[80vw] lg:w-[51.76rem] 
      h-[20.8rem] mx-auto mt-[2.8rem] py-[1.75rem] 
      lg:rounded-[1.2rem] overflow-hidden
      lg:before:absolute lg:before:content-[''] lg:before:top-0 lg:before:left-0 lg:before:w-full lg:before:h-[1px]
      lg:before:bg-gradient-to-r lg:before:from-white/50 lg:before:via-white/30 lg:before:to-transparent
      lg:after:absolute lg:after:content-[''] lg:after:bottom-0 lg:after:left-0 lg:after:w-full lg:after:h-[1px]
      lg:after:bg-gradient-to-r lg:after:from-white/50 lg:after:via-[#0064FF] lg:after:to-transparent
      lg:border-l-[1px] lg:border-l-white/70"
    >
      {/* Blur circles */}
      <div
        className="hidden lg:block w-[800px] h-[800px] rounded-full blur-[48px] absolute 
        bg-white/20 bg-gradient-radial from-white/90 via-white/50 to-transparent 
        -top-[9.6rem] left- transform -translate-x-1/2 -translate-y-1/2 z-[1]"
      />
      <div
        className="hidden lg:block w-[800px] h-[800px] rounded-full blur-[48px] absolute 
        bg-[#72A9FF]/20 bg-gradient-radial from-[#72A9FF]/90 to-transparent 
        top-[41.6rem] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1]"
      />

      <div className="flex flex-col items-center lg:items-start lg:ml-[2rem] gap-[1.75rem] relative z-[2] w-full lg:w-auto">
        <p className="text-[1.8rem]">QR Code Generator</p>
        <p className="text-[1.1rem] font-[200]">Paste your long link here</p>
        <div className="relative w-full max-w-[36.3rem] px-4 lg:px-0">
          <input
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            className="w-full lg:w-[26.7rem] h-[2.7rem] 
                bg-white/10 
                rounded-[0.5rem]
                pl-4 
                text-[1rem]
                text-white
                placeholder:text-white/50
                placeholder:text-[1rem]
                focus:outline-none
                flex items-center"
          />
          <div
            className="absolute right-6 lg:right-2 top-1/2 -translate-y-1/2"
            onClick={handlePaste}
            title="Paste from clipboard"
          >
            <Image src={clipboard} alt="clipboard" className="h-[30px]" />
          </div>
          {copyStatus && (
            <div className="absolute -bottom-6 right-6 text-sm text-green-400">
              {copyStatus}
            </div>
          )}
        </div>
        {error && (
          <p className="text-red-400 text-sm" role="alert">
            {error}
          </p>
        )}
        <button
          className="w-[14rem] h-[2.6rem] 
            rounded-[1.3rem]
            bg-gradient-to-b from-[#3C83F1] via-[#00327E] to-[#003382]
            text-[1rem] text-white font-medium 
            hover:opacity-90 transition-opacity
            flex items-center justify-center gap-2"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate my QR Code"}
          <Image src={arrow} alt="arrow" className="w-[20px] h-[20px]" />
        </button>
        {qrCode && (
          <div className="mt-6 flex flex-col items-center gap-3 w-full">
            <div className="bg-white rounded-xl p-4">
              <Image
                src={qrCode}
                alt="QR preview"
                width={160}
                height={160}
                className="w-40 h-40"
                unoptimized
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20"
              >
                Download PNG
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(qrCode);
                  setCopyStatus("Copied!");
                  setTimeout(() => setCopyStatus(""), 2000);
                }}
                className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/20"
              >
                Copy Image Data
              </button>
            </div>
          </div>
        )}
      </div>

      <div
        className="hidden lg:flex w-[15em] h-[15em] bg-[#D9D9D9] rounded-[1.35rem] 
        items-center justify-center ml-[6rem] mt-[0.6rem] relative z-[2]"
      >
        {qrCode ? (
          <Image
            src={qrCode}
            alt="QR code preview"
            width={192}
            height={192}
            className="w-[12em] h-[12em]"
            unoptimized
          />
        ) : (
          <Image src={qrman} alt="qr man" className="w-[14em] h-[14em]" />
        )}
      </div>
    </div>
  );
};

export default QRgenInput;
