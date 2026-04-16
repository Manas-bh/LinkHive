import Campaign from "@/model/campaignModel";
import Url from "@/model/urlModel";
import type { ICampaign } from "@/model/campaignModel";
import type { IUrl } from "@/model/urlModel";
import type { HydratedDocument } from "mongoose";

type OwnershipFailure = {
  error: string;
  status: 403 | 404;
};

type OwnedUrlSuccess = {
  url: HydratedDocument<IUrl>;
};

type OwnedCampaignSuccess = {
  campaign: HydratedDocument<ICampaign>;
};

export async function getOwnedUrlById(
  urlId: string,
  userId: string
): Promise<OwnedUrlSuccess | OwnershipFailure> {
  const url = await Url.findById(urlId);
  if (!url) {
    return { error: "URL not found", status: 404 };
  }

  if (!url.userId || String(url.userId) !== userId) {
    return { error: "Unauthorized", status: 403 };
  }

  return { url };
}

export async function getOwnedCampaignById(
  campaignId: string,
  userId: string
): Promise<OwnedCampaignSuccess | OwnershipFailure> {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    return { error: "Campaign not found", status: 404 };
  }

  if (String(campaign.userId) !== userId) {
    return { error: "Unauthorized", status: 403 };
  }

  return { campaign };
}
