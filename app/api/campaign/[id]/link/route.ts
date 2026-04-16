import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Url from '@/model/urlModel';
import dbConnect from '@/lib/dbConnect';
import { nanoid } from 'nanoid';
import { generateQRCode } from '@/lib/qrcode';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { isValidSlugSegment, normalizeSlugSegment } from '@/lib/api/slug';
import { getOwnedCampaignById } from '@/lib/api/ownership';
import { getDefaultUrlExpiryDate } from '@/lib/api/urlExpiry';
import { isDuplicateKeyError } from '@/lib/api/errors';
import type { IInfluencer } from '@/model/campaignModel';

/**
 * POST /api/campaign/[id]/link - Generate a new influencer link for a campaign
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();

        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid campaign ID' },
                { status: 400 }
            );
        }

        const authResult = await getAuthenticatedUser();
        if ('error' in authResult) {
            return NextResponse.json(
                { success: false, error: authResult.error },
                { status: authResult.status }
            );
        }

        const user = authResult.user;

        const ownedCampaignResult = await getOwnedCampaignById(id, String(user._id));
        if ('error' in ownedCampaignResult) {
            return NextResponse.json(
                { success: false, error: ownedCampaignResult.error },
                { status: ownedCampaignResult.status }
            );
        }

        const { campaign } = ownedCampaignResult;

        const body = await request.json();
        const { influencerId, name, customSlug } = body;

        if (!influencerId) {
            return NextResponse.json(
                { success: false, error: 'Influencer ID is required' },
                { status: 400 }
            );
        }

        const normalizedInfluencerId = normalizeSlugSegment(String(influencerId));
        if (!isValidSlugSegment(normalizedInfluencerId)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Influencer ID can only contain letters, numbers, and hyphens'
                },
                { status: 400 }
            );
        }

        const normalizedCustomSlug = customSlug
            ? normalizeSlugSegment(String(customSlug))
            : undefined;

        if (normalizedCustomSlug && !isValidSlugSegment(normalizedCustomSlug)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Custom slug can only contain letters, numbers, and hyphens'
                },
                { status: 400 }
            );
        }

        // Check if influencer ID already exists in this campaign
        const existingInfluencer = campaign.influencers.find(
            (inf: IInfluencer) => normalizeSlugSegment(inf.influencerId) === normalizedInfluencerId
        );

        if (existingInfluencer) {
            return NextResponse.json(
                { success: false, error: 'Influencer ID already exists in this campaign' },
                { status: 400 }
            );
        }

        // Generate URL
        const influencerSlug = normalizedCustomSlug || nanoid(7);
        const urlCode = `i-${normalizedInfluencerId}-${influencerSlug}`;

        const existingCode = await Url.findOne({
            $or: [{ urlCode }, { customAlias: urlCode }],
        }).select('_id');
        if (existingCode) {
            return NextResponse.json(
                { success: false, error: 'A generated campaign link already exists with this slug' },
                { status: 409 }
            );
        }

        const url = new Url({
            originalUrl: campaign.destinationUrl,
            urlCode,
            userId: user._id,
            campaignId: campaign._id,
            influencerId: normalizedInfluencerId,
            clickDetails: [],
            expiresAt: await getDefaultUrlExpiryDate(),
            status: 'active',
        });

        await url.save();

        // Generate QR code
        try {
            const qrCode = await generateQRCode(url.shortUrl || '');
            url.qrCode = qrCode;
            await url.save();
        } catch (error) {
            console.error('QR code generation failed:', error);
        }

        // Add to campaign
        campaign.influencers.push({
            influencerId: normalizedInfluencerId,
            name: String(name || normalizedInfluencerId).trim(),
            customSlug: normalizedCustomSlug,
            urlId: url._id,
        });

        await campaign.save();

        // Add to user's URLs
        if (!user.urls) {
            user.urls = [];
        }
        user.urls.push(url._id);
        await user.save();

        return NextResponse.json(
            {
                success: true,
                data: {
                    influencerId: normalizedInfluencerId,
                    name: String(name || normalizedInfluencerId).trim(),
                    shortUrl: url.shortUrl,
                    qrCode: url.qrCode,
                    urlId: url._id,
                },
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error('Error generating influencer link:', error);

        if (isDuplicateKeyError(error)) {
            return NextResponse.json(
                { success: false, error: 'A generated campaign link already exists with this slug' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to generate link'
            },
            { status: 500 }
        );
    }
}
