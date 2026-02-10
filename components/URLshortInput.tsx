"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import arrow from "@/public/line-md_arrow-up.svg";
import clipboard from "@/public/clipboard.svg";
import LinkReadyModal from "@/components/LinkReadyModal";

const URLshortInput = () => {
  const [placeholder, setPlaceholder] = useState("Enter your URL here");
  const [inputValue, setInputValue] = useState("");
  const [copyStatus, setCopyStatus] = useState(""); // For feedback message
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [createdLink, setCreatedLink] = useState<{
    shortUrl: string;
    qrCode?: string;
  } | null>(null);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleShorten = async () => {
    if (!inputValue.trim()) {
      setError("Please paste a URL first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/public/url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: inputValue.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to shorten link");
      }

      setCreatedLink(data.data);
      setModalOpen(true);
      setInputValue("");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Handle clipboard paste
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
        window.innerWidth >= 768 // Changed from 1024 to 768 to include tablet
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

  return (
    <div
      className="relative flex flex-col items-center 
      lg:bg-white lg:bg-opacity-[0.01] 
      w-[95vw] md:w-[80vw] lg:w-[51.76vw] 
      h-[20.8rem] mx-auto mt-[2.8rem] py-[1.75rem] gap-[1.75rem] 
      lg:rounded-[1.2rem] overflow-hidden
      lg:before:absolute lg:before:content-[''] lg:before:top-0 lg:before:left-0 lg:before:w-full lg:before:h-[1px]
      lg:before:bg-gradient-to-r lg:before:from-transparent lg:before:via-white/30 lg:before:to-transparent
      lg:after:absolute lg:after:content-[''] lg:after:bottom-0 lg:after:left-0 lg:after:w-full lg:after:h-[1px]
      lg:after:bg-gradient-to-r lg:after:from-transparent lg:after:via-[#0064FF] lg:after:to-transparent"
    >
      <div
        className="hidden lg:block w-[800px] h-[800px] rounded-full blur-[48px] absolute 
        bg-white/10
        bg-gradient-radial from-white/50 via-white/30 to-transparent 
        -top-[17.6rem] left-1/2 transform -translate-x-1/2 -translate-y-1/2 
        z-[1]"
      />
      <div
        className="hidden lg:block w-[800px] h-[800px] rounded-full blur-[48px] absolute 
        bg-[#72A9FF]/20
        bg-gradient-radial from-[#72A9FF]/90 to-transparent 
        top-[40rem] left-1/2 transform -translate-x-1/2 -translate-y-1/2 
        z-[1]"
      />
      <p className="text-[1.8rem] relative z-[2]">URL shortner</p>
      <p className="text-[1.1rem] font-[200] relative z-[2]">
        Paste your long link here
      </p>
      <div className="relative w-full max-w-[36.3rem] px-4 lg:px-0 z-[2]">
        <input
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          className="w-full h-[2.7rem] 
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
          className="absolute right-6 lg:right-4 top-1/2 -translate-y-1/2 cursor-pointer"
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
        <p className="text-red-400 text-sm mt-2" role="alert">
          {error}
        </p>
      )}
      <button
        className="w-[11.35rem] h-[2.6rem] 
        rounded-[1.3rem]
        bg-gradient-to-b from-[#3C83F1] via-[#00327E] to-[#003382]
        text-[1rem] text-white font-medium 
        hover:opacity-90 transition-opacity
        flex items-center justify-center gap-2
        relative z-[2]"
        onClick={handleShorten}
        disabled={loading}
      >
        {loading ? "Creating..." : "Shorten my link"}
        <Image src={arrow} alt="arrow" className="w-[20px] h-[20px]" />
      </button>

      {createdLink && (
        <LinkReadyModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreateNew={() => {
            setModalOpen(false);
            setCreatedLink(null);
          }}
          shortUrl={createdLink.shortUrl}
          qrCode={createdLink.qrCode || ""}
        />
      )}
    </div>
  );
};

export default URLshortInput;
