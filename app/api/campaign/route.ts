import { NextRequest, NextResponse } from "next/server";
import Campaign from "@/model/campaignModel";
import Url from "@/model/urlModel";
import dbConnect from "@/lib/dbConnect";
import { nanoid } from "nanoid";
import { generateQRCode } from "@/lib/qrcode";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { isValidSlugSegment, normalizeSlugSegment } from "@/lib/api/slug";
import { getDefaultUrlExpiryDate } from "@/lib/api/urlExpiry";
import { normalizeHttpUrl } from "@/lib/api/urlValidation";
import { isDuplicateKeyError } from "@/lib/api/errors";
import type { IInfluencer } from "@/model/campaignModel";

type PreparedInfluencer = {
  influencerId: string;
  name: string;
  customSlug?: string;
  urlCode: string;
};

/**
 * POST /api/campaign - Create a new campaign
 */
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const authResult = await getAuthenticatedUser();
    if ("error" in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const user = authResult.user;

    const body = await request.json();
    const { name, description, destinationUrl, influencers } = body;

    // Validate required fields
    if (!name || !destinationUrl) {
      return NextResponse.json(
        { success: false, error: "Name and destination URL are required" },
        { status: 400 }
      );
    }

    const normalizedDestinationUrl = normalizeHttpUrl(destinationUrl);
    if (!normalizedDestinationUrl) {
      return NextResponse.json(
        { success: false, error: "Invalid destination URL. Provide a valid http(s) URL" },
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

      for (const item of influencers as Partial<IInfluencer>[]) {
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

    const preparedInfluencers: PreparedInfluencer[] = [];
    if (normalizedInfluencers.length) {
      const generatedCodes = new Set<string>();

      for (const influencer of normalizedInfluencers) {
        const influencerSlug = influencer.customSlug || nanoid(7);
        const urlCode = `i-${influencer.influencerId}-${influencerSlug}`;

        if (generatedCodes.has(urlCode)) {
          return NextResponse.json(
            {
              success: false,
              error: `Generated duplicate code for influencer ${influencer.influencerId}`,
            },
            { status: 409 }
          );
        }

        generatedCodes.add(urlCode);
        preparedInfluencers.push({
          ...influencer,
          urlCode,
        });
      }

      const existingCode = await Url.findOne({
        $or: preparedInfluencers.flatMap((influencer) => [
          { urlCode: influencer.urlCode },
          { customAlias: influencer.urlCode },
        ]),
      }).select("urlCode customAlias");

      if (existingCode) {
        const conflictingCode = existingCode.customAlias || existingCode.urlCode;
        return NextResponse.json(
          {
            success: false,
            error: `Generated campaign code conflict: ${conflictingCode}`,
          },
          { status: 409 }
        );
      }
    }

    // Create campaign
    const campaign = new Campaign({
      name,
      description: description || "",
      userId: user._id,
      destinationUrl: normalizedDestinationUrl,
      influencers: [],
      status: "active",
    });

    await campaign.save();

    // Generate influencer links if provided
    if (preparedInfluencers.length) {
      const defaultExpiryDate = await getDefaultUrlExpiryDate();

      for (const inf of preparedInfluencers) {

        const url = new Url({
          originalUrl: normalizedDestinationUrl,
          urlCode: inf.urlCode,
          userId: user._id,
          campaignId: campaign._id,
          influencerId: inf.influencerId,
          clickDetails: [],
          expiresAt: new Date(defaultExpiryDate),
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
    user.campaigns.push(campaign._id);
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

    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        {
          success: false,
          error: "Campaign contains conflicting influencer link codes",
        },
        { status: 409 }
      );
    }

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

    const authResult = await getAuthenticatedUser("_id");
    if ("error" in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const user = authResult.user;

    // Get all campaigns for this user
    const campaigns = await Campaign.find({ userId: user._id }).sort({
      createdAt: -1,
    });

    const campaignIds = campaigns.map((campaign) => campaign._id);
    const campaignMetrics = campaignIds.length
      ? await Url.aggregate<{
          _id: string;
          totalClicks: number;
          totalUniqueVisitors: number;
        }>([
          {
            $match: {
              campaignId: { $in: campaignIds },
            },
          },
          {
            $group: {
              _id: "$campaignId",
              totalClicks: { $sum: { $ifNull: ["$clicks", 0] } },
              totalUniqueVisitors: {
                $sum: { $ifNull: ["$uniqueVisitors", 0] },
              },
            },
          },
        ])
      : [];

    const metricsByCampaignId = new Map(
      campaignMetrics.map((metric) => [String(metric._id), metric])
    );

    const campaignsWithMetrics = campaigns.map((campaign) => {
      const campaignObj = campaign.toObject();
      const metric = metricsByCampaignId.get(String(campaign._id));

      return {
        ...campaignObj,
        totalClicks: metric?.totalClicks ?? 0,
        totalUniqueVisitors: metric?.totalUniqueVisitors ?? 0,
      };
    });

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
