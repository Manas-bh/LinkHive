import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/model/userModel';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: 'Invalid user ID' },
                { status: 400 }
            );
        }

        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        await dbConnect();

        // Verify admin
        const currentUser = await User.findOne({ email: session.user.email });
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Forbidden: Admin access required' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { role, isActive } = body;

        if (role !== undefined && role !== 'user' && role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Invalid role' },
                { status: 400 }
            );
        }

        if (isActive !== undefined && typeof isActive !== 'boolean') {
            return NextResponse.json(
                { success: false, error: 'Invalid isActive value' },
                { status: 400 }
            );
        }

        const targetUser = await User.findById(id);
        if (!targetUser) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Prevent modifying self
        if (targetUser.email === session.user.email) {
            return NextResponse.json(
                { success: false, error: 'Cannot modify your own account' },
                { status: 400 }
            );
        }

        if (role) targetUser.role = role;
        if (isActive !== undefined) targetUser.isActive = isActive;

        await targetUser.save();

        return NextResponse.json({
            success: true,
            data: targetUser,
            message: 'User updated successfully'
        });

    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
