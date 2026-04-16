import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import {
  aggregateClicksByDay,
  aggregateByDevice,
  aggregateByBrowser,
  aggregateByOS,
  aggregateByGeo,
  getClickCoordinates,
} from "@/lib/analytics";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { getOwnedUrlById } from "@/lib/api/ownership";
import { parseBoundedInteger } from "@/lib/api/query";

/**
 * GET /api/analytics/url/[id] - Get detailed analytics for a URL
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
        { success: false, error: "Invalid URL ID" },
        { status: 400 }
      );
    }
    const ownedUrlResult = await getOwnedUrlById(id, String(user._id));
    if ("error" in ownedUrlResult) {
      return NextResponse.json(
        { success: false, error: ownedUrlResult.error },
        { status: ownedUrlResult.status }
      );
    }

    const { url } = ownedUrlResult;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const days = parseBoundedInteger(searchParams.get("days"), {
      fallback: 30,
      min: 1,
      max: 365,
    });

    // Aggregate analytics
    const clicksByDay = aggregateClicksByDay(url.clickDetails, days);
    const deviceBreakdown = aggregateByDevice(url.clickDetails);
    const browserBreakdown = aggregateByBrowser(url.clickDetails);
    const osBreakdown = aggregateByOS(url.clickDetails);
    const geoBreakdown = aggregateByGeo(url.clickDetails);
    const clickCoordinates = getClickCoordinates(url.clickDetails);

    return NextResponse.json(
      {
        success: true,
        data: {
          url: {
            shortUrl: url.shortUrl,
            originalUrl: url.originalUrl,
            customAlias: url.customAlias,
            status: url.status,
            createdAt: url.createdAt,
            qrCode: url.qrCode,
          },
          metrics: {
            totalClicks: url.clicks || 0,
            uniqueVisitors: url.uniqueVisitors || 0,
          },
          clicksByDay,
          deviceBreakdown,
          browserBreakdown,
          osBreakdown,
          geoBreakdown,
          clickCoordinates,
          recentClicks: url.clickDetails.slice(-20).reverse(), // Last 20 clicks
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch analytics",
      },
      { status: 500 }
    );
  }
}
