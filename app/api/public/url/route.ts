import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import Url from "@/model/urlModel";
import dbConnect from "@/lib/dbConnect";
import { generateQRCode } from "@/lib/qrcode";

interface CreatePublicUrlRequest {
  url: string;
  customAlias?: string;
  expiresAt?: string;
}

function normalizeSlugSegment(value: string) {
  return value.trim().toLowerCase();
}

function isValidSlugSegment(value: string) {
  return /^[a-z0-9-]+$/.test(value);
}

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body: CreatePublicUrlRequest = await request.json();
    const { url, customAlias, expiresAt } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      );
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid URL format" },
        { status: 400 }
      );
    }

    let alias: string | undefined;
    if (customAlias) {
      const normalizedAlias = normalizeSlugSegment(customAlias);
      if (!isValidSlugSegment(normalizedAlias)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Custom alias can only contain letters, numbers, and hyphens",
          },
          { status: 400 }
        );
      }

      alias = normalizedAlias;

      const existing = await Url.findOne({
        $or: [{ customAlias: alias }, { urlCode: alias }],
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "Custom alias already in use" },
          { status: 409 }
        );
      }
    }

    const urlCode = alias || nanoid(7);

    const link = new Url({
      originalUrl: url,
      urlCode,
      customAlias: alias,
      clickDetails: [],
      status: "active",
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    await link.save();

    try {
      const qrCode = await generateQRCode(link.shortUrl || "");
      link.qrCode = qrCode;
      await link.save();
    } catch (error) {
      console.error("QR generation failed for public link:", error);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: link._id,
          shortUrl: link.shortUrl,
          qrCode: link.qrCode,
          expiresAt: link.expiresAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Public URL error:", error);

    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { success: false, error: "Custom alias already in use" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to create link" },
      { status: 500 }
    );
  }
}
