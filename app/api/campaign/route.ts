import { NextRequest, NextResponse } from "next/server";
import Campaign from "@/model/campaignModel";
import User from "@/model/userModel";
import Url from "@/model/urlModel";
import dbConnect from "@/lib/dbConnect";
import { auth } from "@/auth";
import { nanoid } from "nanoid";
import { generateQRCode } from "@/lib/qrcode";

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
    if (influencers && Array.isArray(influencers)) {
      for (const inf of influencers) {
        if (inf.influencerId) {
          // Generate URL for influencer
          const influencerSlug = inf.customSlug || nanoid(7);
          const urlCode = `i-${inf.influencerId}-${influencerSlug}`;

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
            name: inf.name || inf.influencerId,
            customSlug: inf.customSlug,
            urlId: url._id,
          });

          // Add to user's URLs
          if (!user.urls) {
            user.urls = [];
          }
          user.urls.push(url._id);
        }
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
