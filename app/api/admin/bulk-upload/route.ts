import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Url from '@/model/urlModel';
import { nanoid } from 'nanoid';
import { generateQRCode } from '@/lib/qrcode';
import { getAuthenticatedAdmin } from '@/lib/api/auth';
import { isValidSlugSegment, normalizeSlugSegment } from '@/lib/api/slug';
import { isDuplicateKeyError } from '@/lib/api/errors';
import { getDefaultUrlExpiryDate } from '@/lib/api/urlExpiry';
import { normalizeHttpUrl } from '@/lib/api/urlValidation';

type BulkUrlInput = {
    originalUrl?: unknown;
    customAlias?: unknown;
};

type BulkUploadResult = {
    success: Array<{ originalUrl: string; shortUrl: string; customAlias?: string }>;
    failed: Array<{ url: BulkUrlInput; error: string }>;
};

export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const authResult = await getAuthenticatedAdmin();
        if ('error' in authResult) {
            return NextResponse.json(
                { success: false, error: authResult.error },
                { status: authResult.status }
            );
        }

        const user = authResult.user;

        const body = await request.json();
        const { urls } = body as { urls?: BulkUrlInput[] }; // Array of { originalUrl, customAlias? }

        if (!Array.isArray(urls) || urls.length === 0) {
            return NextResponse.json(
                { success: false, error: 'URLs array is required' },
                { status: 400 }
            );
        }

        const results: BulkUploadResult = {
            success: [],
            failed: []
        };

        const seenAliases = new Set<string>();
        const defaultExpiryDate = await getDefaultUrlExpiryDate();

        for (const urlData of urls) {
            try {
                if (!urlData.originalUrl) {
                    results.failed.push({
                        url: urlData,
                        error: 'Original URL is required'
                    });
                    continue;
                }

                const normalizedOriginalUrl = normalizeHttpUrl(String(urlData.originalUrl));
                if (!normalizedOriginalUrl) {
                    results.failed.push({
                        url: urlData,
                        error: 'Invalid URL format. Provide a valid http(s) URL'
                    });
                    continue;
                }

                const rawAlias = urlData.customAlias
                    ? String(urlData.customAlias)
                    : undefined;
                const normalizedAlias = rawAlias
                    ? normalizeSlugSegment(rawAlias)
                    : undefined;

                if (normalizedAlias && !isValidSlugSegment(normalizedAlias)) {
                    results.failed.push({
                        url: urlData,
                        error: `Custom alias '${normalizedAlias}' contains invalid characters`
                    });
                    continue;
                }

                if (normalizedAlias && seenAliases.has(normalizedAlias)) {
                    results.failed.push({
                        url: urlData,
                        error: `Custom alias '${normalizedAlias}' is duplicated in payload`
                    });
                    continue;
                }

                // Check if custom alias already exists
                if (normalizedAlias) {
                    const existing = await Url.findOne({
                        $or: [{ customAlias: normalizedAlias }, { urlCode: normalizedAlias }],
                    });
                    if (existing) {
                        results.failed.push({
                            url: urlData,
                            error: `Custom alias '${normalizedAlias}' already exists`
                        });
                        continue;
                    }

                    seenAliases.add(normalizedAlias);
                }

                const urlCode = normalizedAlias || nanoid(7);
                const newUrl = new Url({
                    originalUrl: normalizedOriginalUrl,
                    urlCode,
                    customAlias: normalizedAlias,
                    userId: user._id,
                    clickDetails: [],
                    expiresAt: new Date(defaultExpiryDate),
                    status: 'active',
                });

                await newUrl.save();

                // Generate QR code asynchronously
                try {
                    const qrCode = await generateQRCode(newUrl.shortUrl || '');
                    newUrl.qrCode = qrCode;
                    await newUrl.save();
                } catch (error) {
                    console.error('QR code generation failed:', error);
                }

                // Add to user's URLs
                if (!user.urls) {
                    user.urls = [];
                }
                user.urls.push(newUrl._id);

                results.success.push({
                    originalUrl: newUrl.originalUrl,
                    shortUrl: newUrl.shortUrl,
                    customAlias: newUrl.customAlias
                });

            } catch (error: unknown) {
                if (isDuplicateKeyError(error)) {
                    results.failed.push({
                        url: urlData,
                        error: 'Custom alias already exists'
                    });
                    continue;
                }

                results.failed.push({
                    url: urlData,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        await user.save();

        return NextResponse.json({
            success: true,
            data: results,
            message: `Successfully created ${results.success.length} URLs, ${results.failed.length} failed`
        });

    } catch (error: unknown) {
        console.error('Error in bulk upload:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal Server Error'
            },
            { status: 500 }
        );
    }
}
