import { NextRequest, NextResponse } from 'next/server';
import Url from '@/model/urlModel';
import Campaign from '@/model/campaignModel';
import User from '@/model/userModel';
import dbConnect from '@/lib/dbConnect';
import { auth } from '@/auth';

/**
 * GET /api/analytics/export - Export analytics to CSV
 */
export async function GET(request: NextRequest) {
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

        const searchParams = request.nextUrl.searchParams;
        const urlId = searchParams.get('urlId');
        const campaignId = searchParams.get('campaignId');

        if (!urlId && !campaignId) {
            return NextResponse.json(
                { success: false, error: 'urlId or campaignId is required' },
                { status: 400 }
            );
        }

        let data: any[] = [];
        let filename = 'analytics.csv';

        if (urlId) {
            const url = await Url.findById(urlId);
            if (!url) {
                return NextResponse.json({ success: false, error: 'URL not found' }, { status: 404 });
            }
            if (url.userId.toString() !== (user as any)._id.toString()) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
            }
            data = url.clickDetails;
            filename = `analytics-${url.customAlias || url.urlCode}.csv`;
        } else if (campaignId) {
            const campaign = await Campaign.findById(campaignId);
            if (!campaign) {
                return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
            }
            if (campaign.userId.toString() !== (user as any)._id.toString()) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
            }

            // Fetch all URLs for this campaign
            const urls = await Url.find({ campaignId: campaign._id });

            // Combine click details from all URLs
            data = urls.flatMap(url =>
                url.clickDetails.map((click: any) => ({
                    ...click,
                    influencerId: url.influencerId, // Add influencer ID context
                    shortUrl: url.shortUrl
                }))
            );
            filename = `analytics-campaign-${campaign.name.replace(/\s+/g, '-')}.csv`;
        }

        // Generate CSV content
        const csvHeader = [
            'Date',
            'IP Address',
            'Country',
            'City',
            'Device',
            'Browser',
            'OS',
            'Referer',
            'Influencer ID',
            'Short URL'
        ].join(',') + '\n';

        const csvRows = data.map((click: any) => {
            const date = new Date(click.timestamp).toISOString();
            const ip = click.ip || '';
            const country = click.country || '';
            const city = click.city || '';
            const device = click.device || '';
            const browser = click.browser || '';
            const os = click.os || '';
            const referer = click.referer || '';
            const influencerId = click.influencerId || '';
            const shortUrl = click.shortUrl || '';

            // Escape fields that might contain commas
            const escape = (field: string) => `"${field.replace(/"/g, '""')}"`;

            return [
                date,
                escape(ip),
                escape(country),
                escape(city),
                escape(device),
                escape(browser),
                escape(os),
                escape(referer),
                escape(influencerId),
                escape(shortUrl)
            ].join(',');
        }).join('\n');

        const csvContent = csvHeader + csvRows;

        // Return CSV response
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

    } catch (error: any) {
        console.error('Export error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to export analytics' },
            { status: 500 }
        );
    }
}
