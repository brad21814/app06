import { NextResponse } from 'next/server';
import { getInvitationsCollection, getUserDoc } from '@/lib/firestore/admin/collections';
import { Invitation } from '@/types/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import { emailService } from '@/lib/email';

export async function POST(request: Request) {
    console.log('POST /api/invite');
    try {
        const body = await request.json();
        const { email, role, teamId, accountId, invitedBy } = body;

        if (!email || !teamId || !accountId || !invitedBy) {
            return NextResponse.json({ message: 'Missing required fields', success: false }, { status: 400 });
        }

        // Get inviter details
        const inviterDoc = await getUserDoc(invitedBy).get();
        const inviterData = inviterDoc.data();
        const inviterName = inviterData?.name || 'A team member';

        const invitationsRef = getInvitationsCollection();

        const newInvite: Omit<Invitation, 'id'> = {
            email,
            teamId,
            accountId,
            role: role || 'member',
            invitedBy,
            status: 'pending',
            createdAt: Timestamp.now() as unknown as any,
        };

        const docRef = await invitationsRef.add(newInvite as Invitation);

        // Construct invite link
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const inviteLink = `${baseUrl}/sign-up?inviteId=${docRef.id}`;

        // Send email
        await emailService.sendInviteEmail(email, inviterName, inviteLink);

        return NextResponse.json({ message: 'Invitation sent successfully', success: true });
    } catch (error) {
        console.error('Error inviting member:', error);
        return NextResponse.json({ message: 'Failed to send invitation', success: false }, { status: 500 });
    }
}
