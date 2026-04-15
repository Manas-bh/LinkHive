import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import dbConnect from "@/lib/dbConnect";
import Url from "@/model/urlModel";
import User from "@/model/userModel";
import Campaign from "@/model/campaignModel";

function normalizeSlugSegment(value: string) {
  return value.trim().toLowerCase();
}

function isValidSlugSegment(value: string) {
  return /^[a-z0-9-]+$/.test(value);
}

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

async function getAuthorizedUserId() {
  const session = await auth();
  if (!session?.user?.email) {
    return { error: "Unauthorized", status: 401 as const };
  }

  const user = await User.findOne({ email: session.user.email }).select("_id");
  if (!user) {
    return { error: "User not found", status: 404 as const };
  }

  return { userId: String(user._id) };
}

async function getOwnedUrl(urlId: string, userId: string) {
  const url = await Url.findById(urlId);
  if (!url) {
    return { error: "URL not found", status: 404 as const };
  }

  if (!url.userId || String(url.userId) !== userId) {
    return { error: "Forbidden", status: 403 as const };
  }

  return { url };
}

function invalidIdResponse() {
  return NextResponse.json(
    { success: false, error: "Invalid URL ID" },
    { status: 400 }
  );
}

// GET - Get individual URL details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return invalidIdResponse();
    }

    await dbConnect();

    const authResult = await getAuthorizedUserId();
    if ("error" in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const ownedUrl = await getOwnedUrl(id, authResult.userId);
    if ("error" in ownedUrl) {
      return NextResponse.json(
        { success: false, error: ownedUrl.error },
        { status: ownedUrl.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: ownedUrl.url,
    });
  } catch (error) {
    console.error("Error fetching URL:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT - Update URL
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return invalidIdResponse();
    }

    const body = await request.json();
    const { originalUrl, customAlias, expiresAt } = body as {
      originalUrl?: string;
      customAlias?: string;
      expiresAt?: string | null;
    };

    await dbConnect();

    const authResult = await getAuthorizedUserId();
    if ("error" in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const ownedUrl = await getOwnedUrl(id, authResult.userId);
    if ("error" in ownedUrl) {
      return NextResponse.json(
        { success: false, error: ownedUrl.error },
        { status: ownedUrl.status }
      );
    }

    const url = ownedUrl.url;

    if (typeof originalUrl === "string") {
      try {
        new URL(originalUrl);
      } catch {
        return NextResponse.json(
          { success: false, error: "Invalid destination URL" },
          { status: 400 }
        );
      }

      url.originalUrl = originalUrl;
    }

    if (customAlias !== undefined) {
      if (!customAlias) {
        url.customAlias = undefined;
      } else {
        const normalizedAlias = normalizeSlugSegment(customAlias);

        if (!normalizedAlias) {
          url.customAlias = undefined;
        } else if (!isValidSlugSegment(normalizedAlias)) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Custom alias can only contain letters, numbers, and hyphens",
            },
            { status: 400 }
          );
        } else {
          const existing = await Url.findOne({
            $or: [{ customAlias: normalizedAlias }, { urlCode: normalizedAlias }],
            _id: { $ne: url._id },
          }).select("_id");
          if (existing) {
            return NextResponse.json(
              { success: false, error: "Custom alias already in use" },
              { status: 409 }
            );
          }

          url.customAlias = normalizedAlias;
        }
      }
    }

    if (expiresAt !== undefined) {
      url.expiresAt = expiresAt ? new Date(expiresAt) : undefined;
    }

    await url.save();

    return NextResponse.json({
      success: true,
      data: url,
      message: "URL updated successfully",
    });
  } catch (error) {
    console.error("Error updating URL:", error);

    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { success: false, error: "Custom alias already in use" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete URL
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return invalidIdResponse();
    }

    await dbConnect();

    const authResult = await getAuthorizedUserId();
    if ("error" in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const ownedUrl = await getOwnedUrl(id, authResult.userId);
    if ("error" in ownedUrl) {
      return NextResponse.json(
        { success: false, error: ownedUrl.error },
        { status: ownedUrl.status }
      );
    }

    const url = ownedUrl.url;
    await url.deleteOne();

    await Promise.all([
      User.updateOne({ _id: url.userId }, { $pull: { urls: url._id } }),
      url.campaignId
        ? Campaign.updateOne(
            { _id: url.campaignId },
            { $set: { "influencers.$[inf].urlId": null } },
            {
              arrayFilters: [{ "inf.urlId": url._id }],
            }
          )
        : Promise.resolve(),
    ]);

    return NextResponse.json({
      success: true,
      message: "URL deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting URL:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH - Update URL status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return invalidIdResponse();
    }

    const body = await request.json();
    const { status } = body as { status?: string };

    if (!status || !["active", "paused", "disabled"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    await dbConnect();

    const authResult = await getAuthorizedUserId();
    if ("error" in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const ownedUrl = await getOwnedUrl(id, authResult.userId);
    if ("error" in ownedUrl) {
      return NextResponse.json(
        { success: false, error: ownedUrl.error },
        { status: ownedUrl.status }
      );
    }

    ownedUrl.url.status = status as "active" | "paused" | "disabled";
    await ownedUrl.url.save();

    return NextResponse.json({
      success: true,
      data: ownedUrl.url,
      message: `URL ${status} successfully`,
    });
  } catch (error) {
    console.error("Error updating URL status:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
