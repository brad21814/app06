import { NextResponse } from 'next/server';
import { getInvitationsCollection, getUserDoc, getAccountDoc } from '@/lib/firestore/admin/collections';
import { Invitation, Account } from '@/types/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import { emailService } from '@/lib/email';

export async function POST(request: Request) {
    console.log('POST /api/invite');
    try {
        const body = await request.json();
        const { email, name, role, teamIds, accountId, invitedBy } = body;

        if (!email || !teamIds || !teamIds.length || !accountId || !invitedBy) {
            return NextResponse.json({ message: 'Missing required fields', success: false }, { status: 400 });
        }

        // Hard Limit check
        const accountDoc = await getAccountDoc(accountId).get();
        if (accountDoc.exists) {
            const accountData = accountDoc.data() as Account;
            if (accountData.subscriptionStatus === 'trialing' && (accountData.userCount || 0) >= 9) {
                return NextResponse.json({ 
                    message: 'Trial user limit reached. Please upgrade your subscription to invite more members.', 
                    success: false,
                    limitReached: true
                }, { status: 403 });
            }
        }

        // Get inviter details
        const inviterDoc = await getUserDoc(invitedBy).get();
        const inviterData = inviterDoc.data();
        const inviterName = inviterData?.name || 'A team member';

        const invitationsRef = getInvitationsCollection();

        const newInvite: Omit<Invitation, 'id'> = {
            email,
            name: name || '',
            teamIds, // Updated to array
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
        await emailService.sendInviteEmail(email, inviterName, inviteLink, name);

        return NextResponse.json({ message: 'Invitation sent successfully', success: true });
    } catch (error) {
        console.error('Error inviting member:', error);
        return NextResponse.json({ message: 'Failed to send invitation', success: false }, { status: 500 });
    }
}
