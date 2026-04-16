import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { nanoid } from "nanoid";
import Url, { IUrl } from "@/model/urlModel";
import dbConnect from "@/lib/dbConnect";
import { generateQRCode } from "@/lib/qrcode";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { isValidSlugSegment, normalizeSlugSegment } from "@/lib/api/slug";
import { getDefaultUrlExpiryDate, parseExpiryInput } from "@/lib/api/urlExpiry";
import { isDuplicateKeyError } from "@/lib/api/errors";
import { normalizeHttpUrl } from "@/lib/api/urlValidation";
import { getOwnedCampaignById } from "@/lib/api/ownership";
import type { IInfluencer } from "@/model/campaignModel";
import { userUrlCreateSchema } from "@/lib/api/schemas";
import { getFirstZodErrorMessage } from "@/lib/api/validation";
import { ZodError } from "zod";

interface ApiResponse {
  success: boolean;
  message: string;
  data?: IUrl;
  error?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    await dbConnect();

    const authResult = await getAuthenticatedUser();
    if ("error" in authResult) {
      const message =
        authResult.status === 404
          ? "User not found"
          : authResult.status === 403
            ? "Account is disabled"
            : "Authentication required";
      const error =
        authResult.status === 404
          ? "User account not found"
          : authResult.status === 403
            ? "Your account is disabled"
            : "Please sign in to create links";

      return NextResponse.json(
        {
          success: false,
          message,
          error,
        },
        { status: authResult.status }
      );
    }

    const user = authResult.user;

    const body = userUrlCreateSchema.parse(await request.json());
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

    const normalizedUrl = normalizeHttpUrl(url);
    if (!normalizedUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid URL format",
          error: "Please provide a valid http(s) URL",
        },
        { status: 400 }
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

      const ownedCampaignResult = await getOwnedCampaignById(
        campaignId,
        String(user._id)
      );
      if ("error" in ownedCampaignResult) {
        const message =
          ownedCampaignResult.status === 404 ? "Campaign not found" : "Unauthorized";
        const error =
          ownedCampaignResult.status === 404
            ? "Invalid campaign ID"
            : "You don't have access to this campaign";

        return NextResponse.json(
          {
            success: false,
            message,
            error,
          },
          { status: ownedCampaignResult.status }
        );
      }

      campaign = ownedCampaignResult.campaign;

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
        (inf: IInfluencer) =>
          normalizeSlugSegment(inf.influencerId) === normalizedInfluencerId
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

    const parsedExpiry = parseExpiryInput(expiresAt);
    if (parsedExpiry.kind === "invalid") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid expiration date",
          error: parsedExpiry.error,
        },
        { status: 400 }
      );
    }

    const resolvedExpiresAt =
      parsedExpiry.kind === "valid"
        ? parsedExpiry.date
        : await getDefaultUrlExpiryDate();

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
    const newLink = new Url({
      originalUrl: normalizedUrl,
      urlCode,
      customAlias: normalizedAlias || undefined,
      userId: user._id,
      campaignId: campaign?._id,
      influencerId: normalizedInfluencerId || undefined,
      clickDetails: [],
      expiresAt: resolvedExpiresAt,
      status: "active",
    });
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
        (inf: IInfluencer) =>
          normalizeSlugSegment(inf.influencerId) === normalizedInfluencerId
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
    console.error("URL creation error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request",
          error: getFirstZodErrorMessage(error),
        },
        { status: 400 }
      );
    }

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
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
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

    const authResult = await getAuthenticatedUser("_id");
    if ("error" in authResult) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error,
        },
        { status: authResult.status }
      );
    }

    const user = authResult.user;

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
