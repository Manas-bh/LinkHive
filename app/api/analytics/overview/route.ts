import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Url from "@/model/urlModel";
import {
  aggregateByBrowser,
  aggregateByDevice,
  aggregateByGeo,
  aggregateByOS,
  aggregateClicksByDay,
} from "@/lib/analytics";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { parseBoundedInteger } from "@/lib/api/query";

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const days = parseBoundedInteger(searchParams.get("days"), {
      fallback: 30,
      min: 1,
      max: 365,
    });

    const urls = await Url.find({ userId: user._id }).sort({ createdAt: -1 });

    if (!urls.length) {
      return NextResponse.json({
        success: true,
        data: {
          metrics: {
            totalLinks: 0,
            totalClicks: 0,
            totalUniqueVisitors: 0,
            activeLinks: 0,
          },
          clicksByDay: aggregateClicksByDay([], days),
          deviceBreakdown: [],
          browserBreakdown: [],
          osBreakdown: [],
          geoBreakdown: [],
          topLinks: [],
          recentLinks: [],
        },
      });
    }

    const allClicks = urls.flatMap((url) => url.clickDetails || []);

    const metrics = {
      totalLinks: urls.length,
      totalClicks: urls.reduce((sum, url) => sum + (url.clicks || 0), 0),
      totalUniqueVisitors: urls.reduce(
        (sum, url) => sum + (url.uniqueVisitors || 0),
        0
      ),
      activeLinks: urls.filter((url) => url.status === "active").length,
    };

    const clicksByDay = aggregateClicksByDay(allClicks, days);
    const deviceBreakdown = aggregateByDevice(allClicks);
    const browserBreakdown = aggregateByBrowser(allClicks);
    const osBreakdown = aggregateByOS(allClicks);
    const geoBreakdown = aggregateByGeo(allClicks);

    const topLinks = urls
      .map((url) => ({
        id: url._id,
        shortUrl: url.shortUrl,
        originalUrl: url.originalUrl,
        clicks: url.clicks || 0,
        status: url.status,
        createdAt: url.createdAt,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    const recentLinks = urls
      .map((url) => ({
        id: url._id,
        shortUrl: url.shortUrl,
        originalUrl: url.originalUrl,
        clicks: url.clicks || 0,
        createdAt: url.createdAt,
        status: url.status,
      }))
      .sort(
        (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
      )
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        clicksByDay,
        deviceBreakdown,
        browserBreakdown,
        osBreakdown,
        geoBreakdown,
        topLinks,
        recentLinks,
      },
    });
  } catch (error) {
    console.error("Error fetching overview analytics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics overview" },
      { status: 500 }
    );
  }
}
