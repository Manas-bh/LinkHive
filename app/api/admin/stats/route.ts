import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/dbConnect";
import User from "@/model/userModel";
import Url from "@/model/urlModel";
import Campaign from "@/model/campaignModel";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin access required" },
        { status: 403 }
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
  } catch (error: any) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
