import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import SystemSettings from "@/model/systemSettingsModel";
import { getAuthenticatedAdmin } from "@/lib/api/auth";

function parseBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value;
  }

  return undefined;
}

function parseExpiryDays(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  const normalized = Math.floor(value);
  if (normalized < 1 || normalized > 3650) {
    return undefined;
  }

  return normalized;
}

export async function GET() {
  try {
    await dbConnect();

    const authResult = await getAuthenticatedAdmin("_id email role");
    if ("error" in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    // Get or create settings
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({
        allowRegistration: true,
        maintenanceMode: false,
        defaultUrlExpiryDays: 365,
        updatedBy: authResult.email,
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: unknown) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const authResult = await getAuthenticatedAdmin("_id email role");
    if ("error" in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { allowRegistration, maintenanceMode, defaultUrlExpiryDays } = body;

    const parsedAllowRegistration =
      allowRegistration === undefined
        ? undefined
        : parseBoolean(allowRegistration);
    const parsedMaintenanceMode =
      maintenanceMode === undefined ? undefined : parseBoolean(maintenanceMode);
    const parsedDefaultUrlExpiryDays =
      defaultUrlExpiryDays === undefined
        ? undefined
        : parseExpiryDays(defaultUrlExpiryDays);

    if (allowRegistration !== undefined && parsedAllowRegistration === undefined) {
      return NextResponse.json(
        { success: false, error: "allowRegistration must be a boolean" },
        { status: 400 }
      );
    }

    if (maintenanceMode !== undefined && parsedMaintenanceMode === undefined) {
      return NextResponse.json(
        { success: false, error: "maintenanceMode must be a boolean" },
        { status: 400 }
      );
    }

    if (
      defaultUrlExpiryDays !== undefined &&
      parsedDefaultUrlExpiryDays === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "defaultUrlExpiryDays must be an integer between 1 and 3650",
        },
        { status: 400 }
      );
    }

    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings();
    }

    if (parsedAllowRegistration !== undefined)
      settings.allowRegistration = parsedAllowRegistration;
    if (parsedMaintenanceMode !== undefined)
      settings.maintenanceMode = parsedMaintenanceMode;
    if (parsedDefaultUrlExpiryDays !== undefined)
      settings.defaultUrlExpiryDays = parsedDefaultUrlExpiryDays;
    settings.updatedAt = new Date();
    settings.updatedBy = authResult.email;

    await settings.save();

    return NextResponse.json({
      success: true,
      data: settings,
      message: "Settings updated successfully",
    });
  } catch (error: unknown) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
