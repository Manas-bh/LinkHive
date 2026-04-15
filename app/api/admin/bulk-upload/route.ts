import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/model/userModel';
import Url from '@/model/urlModel';
import { nanoid } from 'nanoid';
import { generateQRCode } from '@/lib/qrcode';

function sanitizeAlias(alias: string) {
    return alias.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        await dbConnect();

        const user = await User.findOne({ email: session.user.email });
        if (!user || user.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Forbidden: Admin access required' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { urls } = body; // Array of { originalUrl, customAlias? }

        if (!Array.isArray(urls) || urls.length === 0) {
            return NextResponse.json(
                { success: false, error: 'URLs array is required' },
                { status: 400 }
            );
        }

        const results: {
            success: Array<{ originalUrl: string; shortUrl: string; customAlias?: string }>;
            failed: Array<{ url: any; error: string }>;
        } = {
            success: [],
            failed: []
        };

        for (const urlData of urls) {
            try {
                if (!urlData.originalUrl) {
                    results.failed.push({
                        url: urlData,
                        error: 'Original URL is required'
                    });
                    continue;
                }

                try {
                    new URL(urlData.originalUrl);
                } catch {
                    results.failed.push({
                        url: urlData,
                        error: 'Invalid URL format'
                    });
                    continue;
                }

                const normalizedAlias = urlData.customAlias
                    ? sanitizeAlias(urlData.customAlias)
                    : undefined;

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
                }

                const urlCode = normalizedAlias || nanoid(7);
                const newUrl = new Url({
                    originalUrl: urlData.originalUrl,
                    urlCode,
                    customAlias: normalizedAlias,
                    userId: (user as any)._id,
                    clickDetails: [],
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
                user.urls.push((newUrl as any)._id);

                results.success.push({
                    originalUrl: newUrl.originalUrl,
                    shortUrl: newUrl.shortUrl,
                    customAlias: newUrl.customAlias
                });

            } catch (error: any) {
                results.failed.push({
                    url: urlData,
                    error: error.message
                });
            }
        }

        await user.save();

        return NextResponse.json({
            success: true,
            data: results,
            message: `Successfully created ${results.success.length} URLs, ${results.failed.length} failed`
        });

    } catch (error: any) {
        console.error('Error in bulk upload:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
