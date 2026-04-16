import { z } from "zod";

const slugRegex = /^[a-z0-9-]+$/;

const optionalSlug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(slugRegex, "Only letters, numbers, and hyphens are allowed")
  .optional();

export const publicUrlCreateSchema = z.object({
  url: z
    .string()
    .trim()
    .url("Invalid URL format")
    .refine((value) => value.startsWith("http://") || value.startsWith("https://"), {
      message: "URL must use http or https",
    }),
  customAlias: optionalSlug,
  expiresAt: z.string().trim().nullable().optional(),
});

export type PublicUrlCreateInput = z.infer<typeof publicUrlCreateSchema>;

export const userUrlCreateSchema = z.object({
  url: z
    .string()
    .trim()
    .url("Invalid URL format")
    .refine((value) => value.startsWith("http://") || value.startsWith("https://"), {
      message: "URL must use http or https",
    }),
  customAlias: optionalSlug,
  campaignId: z.string().trim().optional(),
  influencerId: optionalSlug,
  expiresAt: z.string().trim().nullable().optional(),
});

export type UserUrlCreateInput = z.infer<typeof userUrlCreateSchema>;

export const campaignCreateSchema = z.object({
  name: z.string().trim().min(1, "Campaign name is required"),
  description: z.string().optional().default(""),
  destinationUrl: z
    .string()
    .trim()
    .url("Invalid destination URL")
    .refine((value) => value.startsWith("http://") || value.startsWith("https://"), {
      message: "Destination URL must use http or https",
    }),
  influencers: z
    .array(
      z.object({
        influencerId: z
          .string()
          .trim()
          .toLowerCase()
          .regex(slugRegex, "Influencer ID can only contain letters, numbers, and hyphens"),
        name: z.string().trim().min(1).optional(),
        customSlug: optionalSlug,
      })
    )
    .optional()
    .default([]),
});

export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;

export const campaignUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["active", "paused", "completed"]).optional(),
  destinationUrl: z
    .string()
    .trim()
    .url("Invalid destination URL")
    .refine((value) => value.startsWith("http://") || value.startsWith("https://"), {
      message: "Destination URL must use http or https",
    })
    .optional(),
});

export type CampaignUpdateInput = z.infer<typeof campaignUpdateSchema>;
