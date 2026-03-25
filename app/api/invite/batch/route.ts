import { NextResponse } from 'next/server';
import { getInvitationsCollection, getUserDoc, getAccountDoc } from '@/lib/firestore/admin/collections';
import { Invitation, Account } from '@/types/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import { emailService } from '@/lib/email';

export async function POST(request: Request) {
    console.log('POST /api/invite/batch');
    try {
        const body = await request.json();
        const { invitations, accountId, invitedBy } = body;

        if (!invitations || !Array.isArray(invitations) || !invitations.length || !accountId || !invitedBy) {
            return NextResponse.json({ message: 'Missing required fields', success: false }, { status: 400 });
        }

        // Hard Limit check
        const accountDoc = await getAccountDoc(accountId).get();
        if (accountDoc.exists) {
            const accountData = accountDoc.data() as Account;
            if (accountData.subscriptionStatus === 'trialing' && (accountData.userCount || 0) + invitations.length > 9) {
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
        const batchResults = [];

        // Process each invitation
        // Note: For large batches we might want to use Firestore batch writes, 
        // but here we need to get the Doc ID for the link for each one.
        for (const invite of invitations) {
            try {
                const { email, name, role, teamIds } = invite;

                if (!email || !teamIds || !teamIds.length) {
                    batchResults.push({ email, success: false, message: 'Invalid data' });
                    continue;
                }

                const newInvite: Omit<Invitation, 'id'> = {
                    email,
                    name: name || '',
                    teamIds,
                    accountId,
                    role: role || 'member',
                    invitedBy,
                    status: 'pending',
                    createdAt: Timestamp.now() as unknown as any,
                };

                const docRef = await invitationsRef.add(newInvite as Invitation);

                // Construct invite link
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                const inviteLink = `${baseUrl}/sign-up?inviteId=${docRef.id}`;

                // Send email
                await emailService.sendInviteEmail(email, inviterName, inviteLink, name);

                batchResults.push({ email, success: true });

            } catch (err: any) {
                console.error(`Failed to invite ${invite.email}`, err);
                batchResults.push({ email: invite.email, success: false, message: err.message });
            }
        }

        return NextResponse.json({
            message: 'Batch invitation process completed',
            success: true,
            results: batchResults
        });

    } catch (error) {
        console.error('Error processing batch invites:', error);
        return NextResponse.json({ message: 'Failed to process batch invitations', success: false }, { status: 500 });
    }
}
