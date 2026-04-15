import { NextRequest } from "next/server";
import Url from "@/model/urlModel";
import dbConnect from "@/lib/dbConnect";
import { getGeolocation, getClientIp } from "@/lib/geolocation";
import { parseUserAgent, generateVisitorId } from "@/lib/userAgentParser";

export class LinkRedirectError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function resolveLinkAndTrack(code: string, request: NextRequest) {
  await dbConnect();

  const url = await Url.findOne({
    $or: [{ urlCode: code }, { customAlias: code }],
  });

  if (!url) {
    throw new LinkRedirectError(404, "Link not found");
  }

  if (url.status !== "active") {
    throw new LinkRedirectError(410, "This link has been disabled");
  }

  if (url.expiresAt && new Date(url.expiresAt) < new Date()) {
    throw new LinkRedirectError(410, "This link has expired");
  }

  const ip = getClientIp(request.headers);
  const userAgent = request.headers.get("user-agent") || "";
  const referer = request.headers.get("referer") || "";

  const { device, browser, os } = parseUserAgent(userAgent);
  const uniqueId = generateVisitorId(ip, userAgent);

  let geoData: Awaited<ReturnType<typeof getGeolocation>>;
  try {
    geoData = await Promise.race<Awaited<ReturnType<typeof getGeolocation>>>([
      getGeolocation(ip),
      new Promise<Awaited<ReturnType<typeof getGeolocation>>>((_, reject) =>
        setTimeout(() => reject(new Error("Geolocation timeout")), 2000)
      ),
    ]);
  } catch {
    geoData = {
      country: "Unknown",
      city: "Unknown",
      region: "Unknown",
      latitude: 0,
      longitude: 0,
    };
  }

  const clickPayload = {
    ip,
    timestamp: new Date(),
    userAgent,
    referer,
    country: geoData.country,
    city: geoData.city,
    region: geoData.region,
    latitude: geoData.latitude,
    longitude: geoData.longitude,
    device,
    browser,
    os,
    uniqueId,
  };

  const locationPayload =
    geoData.latitude && geoData.longitude
      ? {
          type: "Point",
          coordinates: [geoData.longitude, geoData.latitude],
        }
      : null;

  try {
    const updatePipeline: any[] = [
      {
        $set: {
          _hasUniqueId: {
            $in: [uniqueId, { $ifNull: ["$clickDetails.uniqueId", []] }],
          },
        },
      },
      {
        $set: {
          clicks: { $add: [{ $ifNull: ["$clicks", 0] }, 1] },
          uniqueVisitors: {
            $add: [
              { $ifNull: ["$uniqueVisitors", 0] },
              { $cond: ["$_hasUniqueId", 0, 1] },
            ],
          },
          clickDetails: {
            $concatArrays: [{ $ifNull: ["$clickDetails", []] }, [clickPayload]],
          },
          ...(locationPayload ? { location: locationPayload } : {}),
        },
      },
      {
        $unset: "_hasUniqueId",
      },
    ];

    await Url.updateOne({ _id: url._id }, updatePipeline);
  } catch (error) {
    console.error("Error saving analytics:", error);
  }

  return url.originalUrl;
}
