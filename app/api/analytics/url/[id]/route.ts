import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
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

/**
 * GET /api/analytics/url/[id] - Get detailed analytics for a URL
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
        { success: false, error: "Invalid URL ID" },
        { status: 400 }
      );
    }
    const url = await Url.findById(id);

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (!url.userId || url.userId.toString() !== String(user._id)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const daysInput = Number(searchParams.get("days") ?? "30");
    const days = Number.isFinite(daysInput)
      ? Math.min(Math.max(Math.floor(daysInput), 1), 365)
      : 30;

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
