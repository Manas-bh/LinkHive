import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Campaign from '@/model/campaignModel';
import Url from '@/model/urlModel';
import User from '@/model/userModel';
import dbConnect from '@/lib/dbConnect';
import { auth } from '@/auth';

function isValidCampaignStatus(status: unknown): status is 'active' | 'paused' | 'completed' {
    return status === 'active' || status === 'paused' || status === 'completed';
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

        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid campaign ID' },
                { status: 400 }
            );
        }

        const campaign = await Campaign.findById(id);

        if (!campaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Verify ownership
        if (campaign.userId.toString() !== (user._id as any).toString()) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Get detailed metrics for each influencer
        const influencersWithMetrics = await Promise.all(
            campaign.influencers.map(async (influencer: any) => {
                if (!influencer.urlId) {
                    return {
                        ...influencer,
                        clicks: 0,
                        uniqueVisitors: 0,
                        url: null,
                    };
                }

                const url = await Url.findById(influencer.urlId);
                if (!url) {
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
                    clicks: url.clicks || 0,
                    uniqueVisitors: url.uniqueVisitors || 0,
                    shortUrl: url.shortUrl,
                    qrCode: url.qrCode,
                    urlId: url._id,
                };
            })
        );

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

        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid campaign ID' },
                { status: 400 }
            );
        }

        const campaign = await Campaign.findById(id);

        if (!campaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Verify ownership
        if (campaign.userId.toString() !== (user._id as any).toString()) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, description, status, destinationUrl } = body;

        if (status !== undefined && !isValidCampaignStatus(status)) {
            return NextResponse.json(
                { success: false, error: 'Invalid campaign status' },
                { status: 400 }
            );
        }

        if (destinationUrl !== undefined) {
            try {
                new URL(destinationUrl);
            } catch {
                return NextResponse.json(
                    { success: false, error: 'Invalid destination URL' },
                    { status: 400 }
                );
            }
        }

        // Update fields
        if (name) campaign.name = name;
        if (description !== undefined) campaign.description = description;
        if (status !== undefined) campaign.status = status;
        if (destinationUrl !== undefined) campaign.destinationUrl = destinationUrl;

        await campaign.save();

        return NextResponse.json(
            {
                success: true,
                data: campaign,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error updating campaign:', error);
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

        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid campaign ID' },
                { status: 400 }
            );
        }

        const campaign = await Campaign.findById(id);

        if (!campaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Verify ownership
        if (campaign.userId.toString() !== (user._id as any).toString()) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Delete all URLs associated with this campaign
        const campaignUrls = await Url.find({ campaignId: id }).select('_id');
        const campaignUrlIds = campaignUrls.map((url) => String(url._id));
        await Url.deleteMany({ campaignId: id });

        // Delete campaign
        await Campaign.findByIdAndDelete(id);

        // Remove campaign and URLs from user references
        let userChanged = false;
        if (user.campaigns) {
            user.campaigns = user.campaigns.filter(
                (cid: any) => cid.toString() !== id
            );
            userChanged = true;
        }

        if (user.urls && campaignUrlIds.length) {
            user.urls = user.urls.filter(
                (uid: any) => !campaignUrlIds.includes(uid.toString())
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
