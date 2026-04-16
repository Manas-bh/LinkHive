import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/model/userModel";
import Url from "@/model/urlModel";
import Campaign from "@/model/campaignModel";
import { getAuthenticatedAdmin } from "@/lib/api/auth";

export async function GET() {
  try {
    await dbConnect();

    const authResult = await getAuthenticatedAdmin("_id role");
    if ("error" in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    // Fetch global stats
    const totalUsers = await User.countDocuments();
    const totalUrls = await Url.countDocuments();
    const totalCampaigns = await Campaign.countDocuments();

    // Aggregate total clicks across all URLs
    const clicksResult = await Url.aggregate([
      {
        $group: {
          _id: null,
          totalClicks: { $sum: "$clicks" },
        },
      },
    ]);
    const totalClicks =
      clicksResult.length > 0 ? clicksResult[0].totalClicks : 0;

    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("firstName lastName email createdAt role");

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalUrls,
        totalClicks,
        totalCampaigns,
        recentUsers,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
