import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import Url from "@/model/urlModel";
import dbConnect from "@/lib/dbConnect";
import { generateQRCode } from "@/lib/qrcode";
import { isValidSlugSegment, normalizeSlugSegment } from "@/lib/api/slug";
import { getDefaultUrlExpiryDate, parseExpiryInput } from "@/lib/api/urlExpiry";
import { isDuplicateKeyError } from "@/lib/api/errors";
import { normalizeHttpUrl } from "@/lib/api/urlValidation";

interface CreatePublicUrlRequest {
  url: string;
  customAlias?: string;
  expiresAt?: string | null;
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

    const normalizedUrl = normalizeHttpUrl(url);
    if (!normalizedUrl) {
      return NextResponse.json(
        { success: false, error: "Invalid URL format. Provide a valid http(s) URL" },
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

    const parsedExpiry = parseExpiryInput(expiresAt);
    if (parsedExpiry.kind === "invalid") {
      return NextResponse.json(
        { success: false, error: parsedExpiry.error },
        { status: 400 }
      );
    }

    const resolvedExpiresAt =
      parsedExpiry.kind === "valid"
        ? parsedExpiry.date
        : await getDefaultUrlExpiryDate();

    const urlCode = alias || nanoid(7);

    const link = new Url({
      originalUrl: normalizedUrl,
      urlCode,
      customAlias: alias,
      clickDetails: [],
      status: "active",
      expiresAt: resolvedExpiresAt,
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
  } catch (error: unknown) {
    console.error("Public URL error:", error);

    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { success: false, error: "Custom alias already in use" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create link",
      },
      { status: 500 }
    );
  }
}
