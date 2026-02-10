import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/dbConnect';
import Url from '@/model/urlModel';

// GET - Get individual URL details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        const url = await Url.findById(id);

        if (!url) {
            return NextResponse.json(
                { success: false, error: 'URL not found' },
                { status: 404 }
            );
        }

        // Check ownership
        if (url.userId?.toString() !== session.user.id) {
            return NextResponse.json(
                { success: false, error: 'Forbidden' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            data: url,
        });
    } catch (error: any) {
        console.error('Error fetching URL:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// PUT - Update URL
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { originalUrl, customAlias, password, expiresAt } = body;

        await dbConnect();

        const url = await Url.findById(id);

        if (!url) {
            return NextResponse.json(
                { success: false, error: 'URL not found' },
                { status: 404 }
            );
        }

        // Check ownership
        if (url.userId?.toString() !== session.user.id) {
            return NextResponse.json(
                { success: false, error: 'Forbidden' },
                { status: 403 }
            );
        }

        // Update fields
        if (originalUrl) url.originalUrl = originalUrl;
        if (customAlias) url.customAlias = customAlias;
        if (password !== undefined) url.password = password;
        if (expiresAt !== undefined) url.expiresAt = expiresAt ? new Date(expiresAt) : null;

        await url.save();

        return NextResponse.json({
            success: true,
            data: url,
            message: 'URL updated successfully',
        });
    } catch (error: any) {
        console.error('Error updating URL:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// DELETE - Delete URL
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        const url = await Url.findById(id);

        if (!url) {
            return NextResponse.json(
                { success: false, error: 'URL not found' },
                { status: 404 }
            );
        }

        // Check ownership
        if (url.userId?.toString() !== session.user.id) {
            return NextResponse.json(
                { success: false, error: 'Forbidden' },
                { status: 403 }
            );
        }

        await url.deleteOne();

        return NextResponse.json({
            success: true,
            message: 'URL deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting URL:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// PATCH - Update URL status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { status } = body;

        if (!['active', 'paused', 'disabled'].includes(status)) {
            return NextResponse.json(
                { success: false, error: 'Invalid status' },
                { status: 400 }
            );
        }

        await dbConnect();

        const url = await Url.findById(id);

        if (!url) {
            return NextResponse.json(
                { success: false, error: 'URL not found' },
                { status: 404 }
            );
        }

        // Check ownership
        if (url.userId?.toString() !== session.user.id) {
            return NextResponse.json(
                { success: false, error: 'Forbidden' },
                { status: 403 }
            );
        }

        url.status = status;
        await url.save();

        return NextResponse.json({
            success: true,
            data: url,
            message: `URL ${status} successfully`,
        });
    } catch (error: any) {
        console.error('Error updating URL status:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
