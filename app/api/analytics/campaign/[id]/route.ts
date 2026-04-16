import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Url from "@/model/urlModel";
import dbConnect from "@/lib/dbConnect";
import {
  aggregateClicksByDay,
  aggregateByDevice,
  aggregateByBrowser,
  aggregateByOS,
  aggregateByGeo,
  getClickCoordinates,
} from "@/lib/analytics";
import { IClickDetail } from "@/model/urlModel";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { getOwnedCampaignById } from "@/lib/api/ownership";
import { parseBoundedInteger } from "@/lib/api/query";
import type { IInfluencer } from "@/model/campaignModel";

/**
 * GET /api/analytics/campaign/[id] - Get analytics for entire campaign
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid campaign ID" },
        { status: 400 }
      );
    }
    const ownedCampaignResult = await getOwnedCampaignById(id, String(user._id));
    if ("error" in ownedCampaignResult) {
      return NextResponse.json(
        { success: false, error: ownedCampaignResult.error },
        { status: ownedCampaignResult.status }
      );
    }

    const { campaign } = ownedCampaignResult;

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
    const allClicks: IClickDetail[] = urls.flatMap((url) => url.clickDetails);

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const days = parseBoundedInteger(searchParams.get("days"), {
      fallback: 30,
      min: 1,
      max: 365,
    });

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

    const urlById = new Map(urls.map((url) => [String(url._id), url]));

    // Get influencer-level analytics
    const influencerAnalytics = campaign.influencers.map((influencer: IInfluencer) => {
      const linkedUrl = influencer.urlId
        ? urlById.get(String(influencer.urlId))
        : undefined;

      if (!linkedUrl) {
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
        clicks: linkedUrl.clicks || 0,
        uniqueVisitors: linkedUrl.uniqueVisitors || 0,
        shortUrl: linkedUrl.shortUrl,
        clicksByDay: aggregateClicksByDay(linkedUrl.clickDetails, days),
      };
    });

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
