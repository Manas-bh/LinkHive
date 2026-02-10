import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import Url, { IUrl } from "@/model/urlModel";
import User from "@/model/userModel";
import Campaign from "@/model/campaignModel";
import dbConnect from "@/lib/dbConnect";
import { auth } from "@/auth";
import { generateQRCode } from "@/lib/qrcode";

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
    if (customAlias) {
      // Sanitize: only alphanumeric and hyphens
      const sanitized = customAlias.toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (sanitized !== customAlias.toLowerCase()) {
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
      const existing = await Url.findOne({ customAlias: sanitized });
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
    if (campaignId) {
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
      if (!influencerId) {
        return NextResponse.json(
          {
            success: false,
            message: "Influencer ID required",
            error: "Influencer ID is required for campaign links",
          },
          { status: 400 }
        );
      }
    }

    // Generate URL code
    const urlCode = customAlias || nanoid(7);

    // Create URL document
    const link: Partial<IUrl> = {
      originalUrl: url,
      urlCode: urlCode,
      customAlias: customAlias || undefined,
      userId: user._id as any,
      campaignId: campaignId ? (campaign!._id as any) : undefined,
      influencerId: influencerId || undefined,
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
    if (campaign && influencerId) {
      const influencerIndex = campaign.influencers.findIndex(
        (inf: any) => inf.influencerId === influencerId
      );

      if (influencerIndex >= 0) {
        // Update existing influencer
        campaign.influencers[influencerIndex].urlId = newLink._id;
      } else {
        // Add new influencer
        campaign.influencers.push({
          influencerId,
          name: influencerId, // Can be updated later
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
