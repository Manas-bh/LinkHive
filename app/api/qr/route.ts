import { NextRequest, NextResponse } from "next/server";
import { generateQRCode } from "@/lib/qrcode";

interface GenerateQrRequest {
  text: string;
  color?: string;
  backgroundColor?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateQrRequest = await request.json();
    const { text, color, backgroundColor } = body;

    if (!text) {
      return NextResponse.json(
        { success: false, error: "Text is required" },
        { status: 400 }
      );
    }

    const qrCode = await generateQRCode(text, {
      color: {
        dark: color || "#000000",
        light: backgroundColor || "#FFFFFF",
      },
    });

    return NextResponse.json({ success: true, data: { qrCode } });
  } catch (error: any) {
    console.error("QR generation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate QR" },
      { status: 500 }
    );
  }
}
