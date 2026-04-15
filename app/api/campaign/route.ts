import { NextRequest, NextResponse } from "next/server";
import Campaign from "@/model/campaignModel";
import User from "@/model/userModel";
import Url from "@/model/urlModel";
import dbConnect from "@/lib/dbConnect";
import { auth } from "@/auth";
import { nanoid } from "nanoid";
import { generateQRCode } from "@/lib/qrcode";

function isValidSlugSegment(value: string) {
  return /^[a-z0-9-]+$/.test(value);
}

function normalizeSlugSegment(value: string) {
  return value.trim().toLowerCase();
}

/**
 * POST /api/campaign - Create a new campaign
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Get authenticated user
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Find user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, destinationUrl, influencers } = body;

    // Validate required fields
    if (!name || !destinationUrl) {
      return NextResponse.json(
        { success: false, error: "Name and destination URL are required" },
        { status: 400 }
      );
    }

    // Validate destination URL
    try {
      new URL(destinationUrl);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid destination URL" },
        { status: 400 }
      );
    }

    const normalizedInfluencers: Array<{
      influencerId: string;
      name: string;
      customSlug?: string;
    }> = [];

    if (Array.isArray(influencers)) {
      const seenInfluencerIds = new Set<string>();

      for (const item of influencers) {
        if (!item?.influencerId) {
          continue;
        }

        const influencerId = normalizeSlugSegment(String(item.influencerId));
        if (!isValidSlugSegment(influencerId)) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Influencer ID can only contain letters, numbers, and hyphens",
            },
            { status: 400 }
          );
        }

        if (seenInfluencerIds.has(influencerId)) {
          return NextResponse.json(
            {
              success: false,
              error: `Duplicate influencer ID in payload: ${influencerId}`,
            },
            { status: 400 }
          );
        }
        seenInfluencerIds.add(influencerId);

        let normalizedCustomSlug: string | undefined;
        if (item.customSlug) {
          normalizedCustomSlug = normalizeSlugSegment(String(item.customSlug));
          if (!isValidSlugSegment(normalizedCustomSlug)) {
            return NextResponse.json(
              {
                success: false,
                error:
                  "Custom slug can only contain letters, numbers, and hyphens",
              },
              { status: 400 }
            );
          }
        }

        normalizedInfluencers.push({
          influencerId,
          name: String(item.name || influencerId).trim(),
          customSlug: normalizedCustomSlug,
        });
      }
    }

    // Create campaign
    const campaign = new Campaign({
      name,
      description: description || "",
      userId: user._id,
      destinationUrl,
      influencers: [],
      status: "active",
    });

    await campaign.save();

    // Generate influencer links if provided
    if (normalizedInfluencers.length) {
      for (const inf of normalizedInfluencers) {
        const influencerSlug = inf.customSlug || nanoid(7);
        const urlCode = `i-${inf.influencerId}-${influencerSlug}`;

        const existingCode = await Url.findOne({
          $or: [{ urlCode }, { customAlias: urlCode }],
        }).select("_id");
        if (existingCode) {
          return NextResponse.json(
            {
              success: false,
              error: `Generated link code conflict for influencer ${inf.influencerId}`,
            },
            { status: 409 }
          );
        }

        const url = new Url({
          originalUrl: destinationUrl,
          urlCode,
          userId: user._id,
          campaignId: campaign._id,
          influencerId: inf.influencerId,
          clickDetails: [],
          status: "active",
        });

        await url.save();

        // Generate QR code
        try {
          const qrCode = await generateQRCode(url.shortUrl || "");
          url.qrCode = qrCode;
          await url.save();
        } catch (error) {
          console.error("QR code generation failed:", error);
        }

        // Add to campaign influencers
        campaign.influencers.push({
          influencerId: inf.influencerId,
          name: inf.name,
          customSlug: inf.customSlug,
          urlId: url._id,
        });

        // Add to user's URLs
        if (!user.urls) {
          user.urls = [];
        }
        user.urls.push(url._id);
      }

      await campaign.save();
      await user.save();
    }

    // Add campaign to user's campaigns
    if (!user.campaigns) {
      user.campaigns = [];
    }
    user.campaigns.push(campaign._id as any);
    await user.save();

    return NextResponse.json(
      {
        success: true,
        data: campaign,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Campaign creation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create campaign",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/campaign - Get all campaigns for authenticated user
 */
export async function GET() {
  try {
    await dbConnect();

    // Get authenticated user
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Find user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get all campaigns for this user
    const campaigns = await Campaign.find({ userId: user._id }).sort({
      createdAt: -1,
    });

    // Calculate aggregated metrics for each campaign
    const campaignsWithMetrics = await Promise.all(
      campaigns.map(async (campaign) => {
        const campaignObj = campaign.toObject();

        // Get all URLs for this campaign
        const urls = await Url.find({ campaignId: campaign._id });

        // Calculate totals
        const totalClicks = urls.reduce(
          (sum, url) => sum + (url.clicks || 0),
          0
        );
        const totalUniqueVisitors = urls.reduce(
          (sum, url) => sum + (url.uniqueVisitors || 0),
          0
        );

        return {
          ...campaignObj,
          totalClicks,
          totalUniqueVisitors,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        data: campaignsWithMetrics,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch campaigns",
      },
      { status: 500 }
    );
  }
}
