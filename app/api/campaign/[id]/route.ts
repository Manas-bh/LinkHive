import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Url from '@/model/urlModel';
import dbConnect from '@/lib/dbConnect';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getOwnedCampaignById } from '@/lib/api/ownership';
import { normalizeHttpUrl } from '@/lib/api/urlValidation';
import type { IInfluencer } from '@/model/campaignModel';
import { campaignUpdateSchema } from '@/lib/api/schemas';
import { getFirstZodErrorMessage } from '@/lib/api/validation';
import { ZodError } from 'zod';

function mapCampaignStatusToUrlStatus(
    status: 'active' | 'paused' | 'completed'
): 'active' | 'paused' | 'disabled' {
    if (status === 'active') {
        return 'active';
    }

    if (status === 'paused') {
        return 'paused';
    }

    return 'disabled';
}

/**
 * GET /api/campaign/[id] - Get campaign details with influencer metrics
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();

        const authResult = await getAuthenticatedUser('_id');
        if ('error' in authResult) {
            return NextResponse.json(
                { success: false, error: authResult.error },
                { status: authResult.status }
            );
        }

        const user = authResult.user;

        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid campaign ID' },
                { status: 400 }
            );
        }

        const ownedCampaignResult = await getOwnedCampaignById(id, String(user._id));
        if ('error' in ownedCampaignResult) {
            return NextResponse.json(
                { success: false, error: ownedCampaignResult.error },
                { status: ownedCampaignResult.status }
            );
        }

        const { campaign } = ownedCampaignResult;

        const influencerUrlIds = campaign.influencers
            .map((influencer: IInfluencer) => influencer.urlId)
            .filter(Boolean);

        const influencerUrls = influencerUrlIds.length
            ? await Url.find({ _id: { $in: influencerUrlIds } })
            : [];

        const urlById = new Map(
            influencerUrls.map((url) => [String(url._id), url])
        );

        // Get detailed metrics for each influencer
        const influencersWithMetrics = campaign.influencers.map((influencer: IInfluencer) => {
            const linkedUrl = influencer.urlId
                ? urlById.get(String(influencer.urlId))
                : undefined;

            if (!linkedUrl) {
                return {
                    ...influencer,
                    clicks: 0,
                    uniqueVisitors: 0,
                    url: null,
                };
            }

            return {
                influencerId: influencer.influencerId,
                name: influencer.name,
                customSlug: influencer.customSlug,
                clicks: linkedUrl.clicks || 0,
                uniqueVisitors: linkedUrl.uniqueVisitors || 0,
                shortUrl: linkedUrl.shortUrl,
                qrCode: linkedUrl.qrCode,
                urlId: linkedUrl._id,
            };
        });

        // Calculate campaign totals
        const totalClicks = influencersWithMetrics.reduce(
            (sum, inf) => sum + inf.clicks,
            0
        );
        const totalUniqueVisitors = influencersWithMetrics.reduce(
            (sum, inf) => sum + inf.uniqueVisitors,
            0
        );

        return NextResponse.json(
            {
                success: true,
                data: {
                    ...campaign.toObject(),
                    influencers: influencersWithMetrics,
                    totalClicks,
                    totalUniqueVisitors,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching campaign:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch campaign',
            },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/campaign/[id] - Update campaign
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();

        const authResult = await getAuthenticatedUser('_id');
        if ('error' in authResult) {
            return NextResponse.json(
                { success: false, error: authResult.error },
                { status: authResult.status }
            );
        }

        const user = authResult.user;

        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid campaign ID' },
                { status: 400 }
            );
        }

        const ownedCampaignResult = await getOwnedCampaignById(id, String(user._id));
        if ('error' in ownedCampaignResult) {
            return NextResponse.json(
                { success: false, error: ownedCampaignResult.error },
                { status: ownedCampaignResult.status }
            );
        }

        const { campaign } = ownedCampaignResult;

        const body = campaignUpdateSchema.parse(await request.json());
        const { name, description, status, destinationUrl } = body;

        let normalizedDestinationUrl: string | undefined;
        if (destinationUrl !== undefined) {
            const parsedDestinationUrl = normalizeHttpUrl(String(destinationUrl));
            if (!parsedDestinationUrl) {
                return NextResponse.json(
                    { success: false, error: 'Invalid destination URL. Provide a valid http(s) URL' },
                    { status: 400 }
                );
            }

            normalizedDestinationUrl = parsedDestinationUrl;
        }

        // Update fields
        if (name) campaign.name = name;
        if (description !== undefined) campaign.description = description;
        if (status !== undefined) campaign.status = status;
        if (normalizedDestinationUrl !== undefined)
            campaign.destinationUrl = normalizedDestinationUrl;

        await campaign.save();

        const urlUpdates: Record<string, unknown> = {};
        if (normalizedDestinationUrl !== undefined) {
            urlUpdates.originalUrl = normalizedDestinationUrl;
        }

        if (status !== undefined) {
            urlUpdates.status = mapCampaignStatusToUrlStatus(status);
        }

        if (Object.keys(urlUpdates).length > 0) {
            await Url.updateMany(
                { campaignId: campaign._id },
                { $set: urlUpdates }
            );
        }

        return NextResponse.json(
            {
                success: true,
                data: campaign,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error updating campaign:', error);

        if (error instanceof ZodError) {
            return NextResponse.json(
                {
                    success: false,
                    error: getFirstZodErrorMessage(error),
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to update campaign',
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/campaign/[id] - Delete campaign and associated URLs
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();

        const authResult = await getAuthenticatedUser();
        if ('error' in authResult) {
            return NextResponse.json(
                { success: false, error: authResult.error },
                { status: authResult.status }
            );
        }

        const user = authResult.user;

        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid campaign ID' },
                { status: 400 }
            );
        }

        const ownedCampaignResult = await getOwnedCampaignById(id, String(user._id));
        if ('error' in ownedCampaignResult) {
            return NextResponse.json(
                { success: false, error: ownedCampaignResult.error },
                { status: ownedCampaignResult.status }
            );
        }

        const { campaign } = ownedCampaignResult;

        // Delete all URLs associated with this campaign
        const campaignUrls = await Url.find({ campaignId: id }).select('_id');
        const campaignUrlIds = campaignUrls.map((url) => String(url._id));
        await Url.deleteMany({ campaignId: id });

        // Delete campaign
        await campaign.deleteOne();

        // Remove campaign and URLs from user references
        let userChanged = false;
        if (user.campaigns) {
            user.campaigns = user.campaigns.filter(
                (cid) => String(cid) !== id
            );
            userChanged = true;
        }

        if (user.urls && campaignUrlIds.length) {
            user.urls = user.urls.filter(
                (uid) => !campaignUrlIds.includes(String(uid))
            );
            userChanged = true;
        }

        if (userChanged) {
            await user.save();
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Campaign deleted successfully',
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error deleting campaign:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to delete campaign',
            },
            { status: 500 }
        );
    }
}
