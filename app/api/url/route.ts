import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { nanoid } from "nanoid";
import Url, { IUrl } from "@/model/urlModel";
import User from "@/model/userModel";
import Campaign from "@/model/campaignModel";
import dbConnect from "@/lib/dbConnect";
import { auth } from "@/auth";
import { generateQRCode } from "@/lib/qrcode";

function normalizeSlugSegment(value: string) {
  return value.trim().toLowerCase();
}

function isValidSlugSegment(value: string) {
  return /^[a-z0-9-]+$/.test(value);
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: IUrl;
  error?: string;
}

interface CreateUrlRequest {
  url: string;
  customAlias?: string;
  campaignId?: string;
  influencerId?: string;
  expiresAt?: string;
}

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    await dbConnect();

    // Get authenticated user
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
          error: "Please sign in to create links",
        },
        { status: 401 }
      );
    }

    const body: CreateUrlRequest = await request.json();
    const { url, customAlias, campaignId, influencerId, expiresAt } = body;

    // Validate required URL
    if (!url) {
      return NextResponse.json(
        {
          success: false,
          message: "URL is required",
          error: "URL is required",
        },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid URL format",
          error: "Please provide a valid URL",
        },
        { status: 400 }
      );
    }

    // Find user in database
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
          error: "User account not found",
        },
        { status: 404 }
      );
    }

    // Validate custom alias if provided
    const normalizedAlias = customAlias
      ? normalizeSlugSegment(customAlias)
      : undefined;

    if (normalizedAlias) {
      if (!isValidSlugSegment(normalizedAlias)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid custom alias",
            error:
              "Custom alias can only contain letters, numbers, and hyphens",
          },
          { status: 400 }
        );
      }

      // Check if alias already exists
      const existing = await Url.findOne({
        $or: [{ customAlias: normalizedAlias }, { urlCode: normalizedAlias }],
      }).select("_id");
      if (existing) {
        return NextResponse.json(
          {
            success: false,
            message: "Custom alias already taken",
            error: "This custom alias is already in use",
          },
          { status: 409 }
        );
      }
    }

    // Validate campaign if provided
    let campaign = null;
    const normalizedInfluencerId = influencerId
      ? normalizeSlugSegment(influencerId)
      : undefined;

    if (campaignId) {
      if (!mongoose.Types.ObjectId.isValid(campaignId)) {
        return NextResponse.json(
          {
            success: false,
            message: "Campaign not found",
            error: "Invalid campaign ID",
          },
          { status: 400 }
        );
      }

      campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        return NextResponse.json(
          {
            success: false,
            message: "Campaign not found",
            error: "Invalid campaign ID",
          },
          { status: 404 }
        );
      }

      // Verify campaign belongs to user
      if (campaign.userId.toString() !== (user._id as any).toString()) {
        return NextResponse.json(
          {
            success: false,
            message: "Unauthorized",
            error: "You don't have access to this campaign",
          },
          { status: 403 }
        );
      }

      // Require influencer ID for campaign links
      if (!normalizedInfluencerId) {
        return NextResponse.json(
          {
            success: false,
            message: "Influencer ID required",
            error: "Influencer ID is required for campaign links",
          },
          { status: 400 }
        );
      }

      if (!isValidSlugSegment(normalizedInfluencerId)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid influencer ID",
            error:
              "Influencer ID can only contain letters, numbers, and hyphens",
          },
          { status: 400 }
        );
      }

      const existingInfluencer = campaign.influencers.find(
        (inf: any) =>
          normalizeSlugSegment(String(inf.influencerId)) === normalizedInfluencerId
      );

      if (existingInfluencer?.urlId) {
        return NextResponse.json(
          {
            success: false,
            message: "Influencer ID already exists",
            error: "A link for this influencer already exists in this campaign",
          },
          { status: 409 }
        );
      }
    }

    // Generate URL code
    const urlCode = normalizedAlias || nanoid(7);

    const existingCode = await Url.findOne({
      $or: [{ urlCode }, { customAlias: urlCode }],
    }).select("_id");
    if (existingCode) {
      return NextResponse.json(
        {
          success: false,
          message: "Generated URL already exists",
          error: "Please try again",
        },
        { status: 409 }
      );
    }

    // Create URL document
    const link: Partial<IUrl> = {
      originalUrl: url,
      urlCode: urlCode,
      customAlias: normalizedAlias || undefined,
      userId: user._id as any,
      campaignId: campaignId ? (campaign!._id as any) : undefined,
      influencerId: normalizedInfluencerId || undefined,
      clickDetails: [],
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      status: "active",
    };

    const newLink = new Url(link);
    await newLink.save();

    // Generate QR code
    try {
      const qrCodeData = await generateQRCode(newLink.shortUrl || "");
      newLink.qrCode = qrCodeData;
      await newLink.save();
    } catch (error) {
      console.error("QR code generation failed:", error);
      // Continue even if QR code fails
    }

    // Add to user's URLs array
    if (!user.urls) {
      user.urls = [];
    }
    user.urls.push(newLink._id);
    await user.save();

    // If campaign link, add to campaign's influencers
    if (campaign && normalizedInfluencerId) {
      const influencerIndex = campaign.influencers.findIndex(
        (inf: any) =>
          normalizeSlugSegment(String(inf.influencerId)) === normalizedInfluencerId
      );

      if (influencerIndex >= 0) {
        // Update existing influencer
        campaign.influencers[influencerIndex].urlId = newLink._id;
      } else {
        // Add new influencer
        campaign.influencers.push({
          influencerId: normalizedInfluencerId,
          name: normalizedInfluencerId,
          urlId: newLink._id,
        });
      }

      await campaign.save();
    }

    return NextResponse.json(
      {
        success: true,
        message: "Link created successfully",
        data: newLink.toObject(),
      },
      { status: 201 }
    );
  } catch (error) {
    const err = error as Error;
    console.error("URL creation error:", err);

    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: "Custom alias already taken",
          error: "This custom alias is already in use",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create link",
        error: err?.message || "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/url - Get all URLs for authenticated user
 */
export async function GET(): Promise<
  NextResponse<{ success: boolean; data?: IUrl[]; error?: string }>
> {
  try {
    await dbConnect();

    // Get authenticated user
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    // Find user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Get all URLs for this user
    const urls = await Url.find({ userId: user._id })
      .populate("campaignId", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        data: urls,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching URLs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch URLs",
      },
      { status: 500 }
    );
  }
}
