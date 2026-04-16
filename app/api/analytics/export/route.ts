import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Url from '@/model/urlModel';
import dbConnect from '@/lib/dbConnect';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { getOwnedCampaignById, getOwnedUrlById } from '@/lib/api/ownership';
import type { IClickDetail } from '@/model/urlModel';

type ClickExportRow = IClickDetail & {
    influencerId?: string;
    shortUrl?: string;
};

function sanitizeForCsv(value: unknown): string {
    const raw = String(value ?? '');
    if (/^[=+\-@]/.test(raw)) {
        return `'${raw}`;
    }

    return raw;
}

function escapeCsvField(value: unknown): string {
    return `"${sanitizeForCsv(value).replace(/"/g, '""')}"`;
}

function toIsoDate(value: unknown): string {
    if (!value) {
        return '';
    }

    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toISOString();
}

/**
 * GET /api/analytics/export - Export analytics to CSV
 */
export async function GET(request: NextRequest) {
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

        const searchParams = request.nextUrl.searchParams;
        const urlId = searchParams.get('urlId');
        const campaignId = searchParams.get('campaignId');

        if (!urlId && !campaignId) {
            return NextResponse.json(
                { success: false, error: 'urlId or campaignId is required' },
                { status: 400 }
            );
        }

        let data: ClickExportRow[] = [];
        let filename = 'analytics.csv';

        if (urlId) {
            if (!mongoose.Types.ObjectId.isValid(urlId)) {
                return NextResponse.json(
                    { success: false, error: 'Invalid URL ID' },
                    { status: 400 }
                );
            }

            const ownedUrlResult = await getOwnedUrlById(urlId, String(user._id));
            if ('error' in ownedUrlResult) {
                return NextResponse.json(
                    { success: false, error: ownedUrlResult.error },
                    { status: ownedUrlResult.status }
                );
            }

            const { url } = ownedUrlResult;

            data = url.clickDetails;
            filename = `analytics-${url.customAlias || url.urlCode}.csv`;
        } else if (campaignId) {
            if (!mongoose.Types.ObjectId.isValid(campaignId)) {
                return NextResponse.json(
                    { success: false, error: 'Invalid campaign ID' },
                    { status: 400 }
                );
            }

            const ownedCampaignResult = await getOwnedCampaignById(campaignId, String(user._id));
            if ('error' in ownedCampaignResult) {
                return NextResponse.json(
                    { success: false, error: ownedCampaignResult.error },
                    { status: ownedCampaignResult.status }
                );
            }

            const { campaign } = ownedCampaignResult;

            // Fetch all URLs for this campaign
            const urls = await Url.find({ campaignId: campaign._id });

            // Combine click details from all URLs
            data = urls.flatMap(url =>
                url.clickDetails.map((click: IClickDetail) => ({
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

        const csvRows = data.map((click) => {
            const date = toIsoDate(click.timestamp);
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
            return [
                date,
                escapeCsvField(ip),
                escapeCsvField(country),
                escapeCsvField(city),
                escapeCsvField(device),
                escapeCsvField(browser),
                escapeCsvField(os),
                escapeCsvField(referer),
                escapeCsvField(influencerId),
                escapeCsvField(shortUrl)
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

    } catch (error: unknown) {
        console.error('Export error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to export analytics' },
            { status: 500 }
        );
    }
}
