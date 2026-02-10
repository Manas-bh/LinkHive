import mongoose, { Schema, HydratedDocument } from "mongoose";
import { getBaseUrl } from "@/lib/baseUrl";

// Interface for click detail tracking
export interface IClickDetail {
  ip?: string;
  timestamp?: Date;
  userAgent?: string;
  referer?: string;
  country?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  device?: string; // mobile, desktop, tablet
  browser?: string;
  os?: string;
  uniqueId?: string; // For tracking unique visitors
}

// Interface to define the document structure
export interface IUrl {
  originalUrl: string;
  shortUrl?: string;
  urlCode: string;
  customAlias?: string;
  createdAt?: Date;
  expiresAt?: Date;
  clicks?: number;
  uniqueVisitors?: number;
  clickDetails: IClickDetail[];

  // User and campaign tracking
  userId?: mongoose.Types.ObjectId;
  campaignId?: mongoose.Types.ObjectId;
  influencerId?: string;

  // Link management
  status?: "active" | "paused" | "disabled";
  qrCode?: string; // Base64 or URL to QR code image

  // Geospatial data (for latest click location)
  location?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
}

// Create the schema
const UrlSchema = new Schema<IUrl>({
  originalUrl: {
    type: String,
    required: true,
  },
  urlCode: {
    type: String,
    required: true,
    index: true,
  },
  customAlias: {
    type: String,
    unique: true,
    sparse: true, // Only enforce uniqueness if value exists
    trim: true,
    lowercase: true,
  },
  shortUrl: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  expiresAt: {
    type: Date,
    default: function () {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    },
  },
  clicks: {
    type: Number,
    default: 0,
  },
  uniqueVisitors: {
    type: Number,
    default: 0,
  },
  clickDetails: [
    {
      ip: {
        type: String,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      userAgent: String,
      referer: String,
      country: String,
      city: String,
      region: String,
      latitude: Number,
      longitude: Number,
      device: String,
      browser: String,
      os: String,
      uniqueId: String,
    },
  ],

  // User and campaign references
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },
  campaignId: {
    type: Schema.Types.ObjectId,
    ref: "Campaign",
    index: true,
  },
  influencerId: {
    type: String,
    index: true,
  },

  // Link management
  status: {
    type: String,
    enum: ["active", "paused", "disabled"],
    default: "active",
    index: true,
  },
  qrCode: {
    type: String,
  },

  // Geospatial data
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
  },
});

UrlSchema.pre("save", function (this: HydratedDocument<IUrl>, next) {
  if (!this.shortUrl) {
    const baseUrl = getBaseUrl();
    const slug = this.customAlias || this.urlCode;
    this.shortUrl = `${baseUrl}/${slug}`;
  }
  next();
});

// Add indices for better query performance
UrlSchema.index({ location: "2dsphere" }); // Geospatial index
UrlSchema.index({ userId: 1, status: 1 });
UrlSchema.index({ campaignId: 1, influencerId: 1 });

// Create and export the model
const Url = mongoose.models.Url || mongoose.model<IUrl>("Url", UrlSchema);

export default Url;
