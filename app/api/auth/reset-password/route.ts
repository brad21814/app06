import { z } from 'zod';
import { NextResponse } from 'next/server';
import {
    getPasswordResetTokensCollection,
    getUserDoc
} from '@/lib/firestore/admin/collections';
import { adminAuth } from '@/lib/firebase/server';
import { Timestamp } from 'firebase-admin/firestore';

const resetPasswordSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = resetPasswordSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid input' },
                { status: 400 }
            );
        }

        const { token, password, confirmPassword } = result.data;

        if (password !== confirmPassword) {
            return NextResponse.json(
                { error: 'Passwords do not match' },
                { status: 400 }
            );
        }

        const tokenSnapshot = await getPasswordResetTokensCollection()
            .where('token', '==', token)
            .limit(1)
            .get();

        if (tokenSnapshot.empty) {
            return NextResponse.json(
                { error: 'Invalid or expired password reset token' },
                { status: 400 }
            );
        }

        const resetToken = tokenSnapshot.docs[0].data();

        if (Timestamp.now().toMillis() > resetToken.expiresAt.toMillis()) {
            return NextResponse.json(
                { error: 'Invalid or expired password reset token' },
                { status: 400 }
            );
        }

        await adminAuth.updateUser(resetToken.userId, { password });

        await tokenSnapshot.docs[0].ref.delete();

        return NextResponse.json({ success: 'Password reset successfully' });

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred.' },
            { status: 500 }
        );
    }
}
