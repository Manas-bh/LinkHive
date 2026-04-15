import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Campaign from "@/model/campaignModel";
import Url from "@/model/urlModel";
import User from "@/model/userModel";
import dbConnect from "@/lib/dbConnect";
import { auth } from "@/auth";
import {
  aggregateClicksByDay,
  aggregateByDevice,
  aggregateByBrowser,
  aggregateByOS,
  aggregateByGeo,
  getClickCoordinates,
} from "@/lib/analytics";
import { IClickDetail } from "@/model/urlModel";

/**
 * GET /api/analytics/campaign/[id] - Get analytics for entire campaign
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid campaign ID" },
        { status: 400 }
      );
    }
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (campaign.userId.toString() !== String(user._id)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get all URLs for this campaign
    const urls = await Url.find({ campaignId: id });

    if (urls.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: {
            campaign: campaign.toObject(),
            metrics: {
              totalClicks: 0,
              totalUniqueVisitors: 0,
            },
            influencers: [],
            clicksByDay: [],
            deviceBreakdown: [],
            browserBreakdown: [],
            osBreakdown: [],
            geoBreakdown: [],
            clickCoordinates: [],
          },
        },
        { status: 200 }
      );
    }

    // Combine all click details from all URLs
    const allClicks: IClickDetail[] = [];
    urls.forEach((url) => {
      allClicks.push(...url.clickDetails);
    });

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const daysInput = Number(searchParams.get("days") ?? "30");
    const days = Number.isFinite(daysInput)
      ? Math.min(Math.max(Math.floor(daysInput), 1), 365)
      : 30;

    // Aggregate analytics across all campaign URLs
    const clicksByDay = aggregateClicksByDay(allClicks, days);
    const deviceBreakdown = aggregateByDevice(allClicks);
    const browserBreakdown = aggregateByBrowser(allClicks);
    const osBreakdown = aggregateByOS(allClicks);
    const geoBreakdown = aggregateByGeo(allClicks);
    const clickCoordinates = getClickCoordinates(allClicks);

    // Calculate total metrics
    const totalClicks = urls.reduce((sum, url) => sum + (url.clicks || 0), 0);
    const totalUniqueVisitors = urls.reduce(
      (sum, url) => sum + (url.uniqueVisitors || 0),
      0
    );

    // Get influencer-level analytics
    const influencerAnalytics = await Promise.all(
      campaign.influencers.map(async (influencer: any) => {
        if (!influencer.urlId) {
          return {
            influencerId: influencer.influencerId,
            name: influencer.name,
            clicks: 0,
            uniqueVisitors: 0,
            clicksByDay: [],
          };
        }

        const url = await Url.findById(influencer.urlId);
        if (!url) {
          return {
            influencerId: influencer.influencerId,
            name: influencer.name,
            clicks: 0,
            uniqueVisitors: 0,
            clicksByDay: [],
          };
        }

        return {
          influencerId: influencer.influencerId,
          name: influencer.name,
          clicks: url.clicks || 0,
          uniqueVisitors: url.uniqueVisitors || 0,
          shortUrl: url.shortUrl,
          clicksByDay: aggregateClicksByDay(url.clickDetails, days),
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          campaign: {
            id: campaign._id,
            name: campaign.name,
            description: campaign.description,
            destinationUrl: campaign.destinationUrl,
            status: campaign.status,
            createdAt: campaign.createdAt,
          },
          metrics: {
            totalClicks,
            totalUniqueVisitors,
          },
          influencers: influencerAnalytics,
          clicksByDay,
          deviceBreakdown,
          browserBreakdown,
          osBreakdown,
          geoBreakdown,
          clickCoordinates,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching campaign analytics:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch campaign analytics",
      },
      { status: 500 }
    );
  }
}
