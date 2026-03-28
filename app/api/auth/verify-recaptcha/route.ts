import { NextResponse } from 'next/server';
import { verifyRecaptcha } from '@/lib/auth/recaptcha';
import { z } from 'zod';

const verifySchema = z.object({
  token: z.string(),
  action: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = verifySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { token, action } = result.data;
    const recaptcha = await verifyRecaptcha(token, action);

    if (!recaptcha.success) {
      return NextResponse.json(
        { error: recaptcha.error || 'reCAPTCHA verification failed.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, score: recaptcha.score });
  } catch (error: any) {
    console.error('Verify reCAPTCHA error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during verification.' },
      { status: 500 }
    );
  }
}
