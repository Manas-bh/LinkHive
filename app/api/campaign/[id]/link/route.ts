import { NextRequest, NextResponse } from 'next/server';
import Campaign from '@/model/campaignModel';
import Url from '@/model/urlModel';
import User from '@/model/userModel';
import dbConnect from '@/lib/dbConnect';
import { auth } from '@/auth';
import { nanoid } from 'nanoid';
import { generateQRCode } from '@/lib/qrcode';

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

        const campaign = await Campaign.findById(id);
        if (!campaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 }
            );
        }

        // Verify ownership
        if (campaign.userId.toString() !== (user as any)._id.toString()) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { influencerId, name, customSlug } = body;

        if (!influencerId) {
            return NextResponse.json(
                { success: false, error: 'Influencer ID is required' },
                { status: 400 }
            );
        }

        // Check if influencer ID already exists in this campaign
        const existingInfluencer = campaign.influencers.find(
            (inf: any) => inf.influencerId === influencerId
        );

        if (existingInfluencer) {
            return NextResponse.json(
                { success: false, error: 'Influencer ID already exists in this campaign' },
                { status: 400 }
            );
        }

        // Generate URL
        const influencerSlug = customSlug || nanoid(7);
        const urlCode = `i-${influencerId}-${influencerSlug}`;

        const url = new Url({
            originalUrl: campaign.destinationUrl,
            urlCode,
            userId: user._id,
            campaignId: campaign._id,
            influencerId,
            clickDetails: [],
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
            influencerId,
            name: name || influencerId,
            customSlug,
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
                    influencerId,
                    name: name || influencerId,
                    shortUrl: url.shortUrl,
                    qrCode: url.qrCode,
                    urlId: url._id,
                },
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error generating influencer link:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to generate link' },
            { status: 500 }
        );
    }
}
