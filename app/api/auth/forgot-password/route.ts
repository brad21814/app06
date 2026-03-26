import { z } from 'zod';
import { NextResponse } from 'next/server';
import { getUsersCollection, getPasswordResetTokensCollection } from '@/lib/firestore/admin/collections';
import { emailService } from '@/lib/email';
import { randomBytes } from 'crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { PasswordResetToken } from '@/types/firestore';
import { verifyRecaptcha } from '@/lib/auth/recaptcha';

const forgotPasswordSchema = z.object({
    email: z.string().email(),
    recaptchaToken: z.string().optional(),
});

export async function POST(request: Request) {
    console.log('POST /api/auth/forgot-password');
    try {
        const body = await request.json();
        const result = forgotPasswordSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid email' },
                { status: 400 }
            );
        }

        const { email, recaptchaToken } = result.data;

        // Verify reCAPTCHA
        const recaptcha = await verifyRecaptcha(recaptchaToken, 'forgot_password');
        if (!recaptcha.success) {
            return NextResponse.json(
                { error: recaptcha.error || 'reCAPTCHA verification failed.' },
                { status: 403 }
            );
        }

        const userSnapshot = await getUsersCollection()
            .where('email', '==', email)
            .limit(1)
            .get();

        if (userSnapshot.empty) {
            // Return success even if user not found to prevent enumeration
            return NextResponse.json({
                success: 'If an account exists with that email, we sent you a password reset link.'
            });
        }

        const user = userSnapshot.docs[0].data();
        const token = randomBytes(32).toString('hex');
        const expiresAt = Timestamp.fromDate(new Date(Date.now() + 1000 * 60 * 60)); // 1 hour

        const newTokenId = getPasswordResetTokensCollection().doc().id;
        const newToken: PasswordResetToken = {
            id: newTokenId,
            userId: user.id,
            token,
            expiresAt: expiresAt as any,
            createdAt: Timestamp.now() as any
        };

        await getPasswordResetTokensCollection().doc(newTokenId).set(newToken);

        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
        await emailService.sendPasswordResetEmail(email, resetLink);

        return NextResponse.json({
            success: 'If an account exists with that email, we sent you a password reset link.'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred.' },
            { status: 500 }
        );
    }
}
