'use server';

import { z } from 'zod';
import {
  getUsersCollection,
  getTeamsCollection,
  getTeamMembersCollection,
  getActivityLogsCollection,
  getInvitationsCollection,
  getPasswordResetTokensCollection,
  getUserDoc,
  getTeamDoc,
  getInvitationsCollection as getInvitesCol, // Alias to avoid conflict if needed
} from '@/lib/firestore/admin/collections';
import {
  Timestamp
} from 'firebase-admin/firestore';
import { db } from '@/lib/firebase/config'; // Keep for now if needed, but likely removing
import {
  User,
  Team,
  TeamMember,
  ActivityLog,
  ActivityType,
  Invitation,
  PasswordResetToken,
} from '@/types/firestore';
import { setSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createCheckoutSession } from '@/lib/payments/stripe';
import { getUser, getUserWithTeam } from '@/lib/firestore/admin/queries';
import {
  validatedAction,
  validatedActionWithUser
} from '@/lib/auth/middleware';
import { emailService } from '@/lib/email';
import { randomBytes } from 'crypto';
import { adminAuth, adminDb } from '@/lib/firebase/server';

async function logActivity(
  teamId: string | null | undefined,
  userId: string,
  type: ActivityType,
  ipAddress?: string
) {
  if (!teamId) {
    return;
  }
  const newActivity: Omit<ActivityLog, 'id'> = {
    teamId,
    userId,
    action: type,
    timestamp: Timestamp.now() as any,
    ipAddress: ipAddress || ''
  };
  await getActivityLogsCollection().add(newActivity as any);
}

// Migrated to /api/auth/sign-in
// Migrated to /api/auth/sign-up
// Migrated to /api/auth/sign-out
// Migrated to /api/auth/forgot-password
// Migrated to /api/auth/reset-password

const updatePasswordSchema = z.object({
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100)
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user) => {
    const { newPassword, confirmPassword } = data;

    if (confirmPassword !== newPassword) {
      return {
        newPassword,
        confirmPassword,
        error: 'New password and confirmation password do not match.'
      };
    }

    const userWithTeam = await getUserWithTeam(user.id);

    await Promise.all([
      adminAuth.updateUser(user.id, { password: newPassword }),
      logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_PASSWORD)
    ]);

    return {
      success: 'Password updated successfully.'
    };
  }
);

const deleteAccountSchema = z.object({});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (_, __, user) => {
    const userWithTeam = await getUserWithTeam(user.id);

    await logActivity(
      userWithTeam?.teamId,
      user.id,
      ActivityType.DELETE_ACCOUNT
    );

    // Soft delete
    await getUserDoc(user.id).update({
      deletedAt: Timestamp.now() as any,
      email: `${user.email}-${user.id}-deleted`
    });

    if (userWithTeam?.teamId) {
      const snapshot = await getTeamMembersCollection()
        .where('userId', '==', user.id)
        .where('teamId', '==', userWithTeam.teamId)
        .get();

      const batch = adminDb.batch(); // or loop deletes
      // For simplicity loop:
      const deletePromises = snapshot.docs.map(d => d.ref.delete());
      await Promise.all(deletePromises);
    }

    (await cookies()).delete('session');
    redirect('/sign-in');
  }
);

const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address')
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { name, email } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    try {
      await Promise.all([
        getUserDoc(user.id).update({ name, email }),
        adminAuth.updateUser(user.id, { email }),
        logActivity(userWithTeam?.teamId, user.id, ActivityType.UPDATE_ACCOUNT)
      ]);
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        return { error: 'Email is already in use by another account.' };
      }
      return { error: 'Failed to update account.' };
    }

    return { name, success: 'Account updated successfully.' };
  }
);

const removeTeamMemberSchema = z.object({
  memberId: z.string() // Changed to string
});

export const removeTeamMember = validatedActionWithUser(
  removeTeamMemberSchema,
  async (data, _, user) => {
    const { memberId } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    // Verify member belongs to team
    const memberDoc = await getTeamMembersCollection().doc(memberId).get();
    if (!memberDoc.exists || memberDoc.data()?.teamId !== userWithTeam.teamId) {
      return { error: 'Member not found or not in your team' };
    }

    await getTeamMembersCollection().doc(memberId).delete();

    await logActivity(
      userWithTeam.teamId,
      user.id,
      ActivityType.REMOVE_TEAM_MEMBER
    );

    return { success: 'Team member removed successfully' };
  }
);

const inviteTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['member', 'owner'])
});

export const inviteTeamMember = validatedActionWithUser(
  inviteTeamMemberSchema,
  async (data, _, user) => {
    const { email, role } = data;
    const userWithTeam = await getUserWithTeam(user.id);

    if (!userWithTeam?.teamId) {
      return { error: 'User is not part of a team' };
    }

    // Check if user already exists and is in team
    const userSnap = await getUsersCollection()
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!userSnap.empty) {
      const existingUser = userSnap.docs[0].data();
      const memberSnap = await getTeamMembersCollection()
        .where('userId', '==', existingUser.id)
        .where('teamId', '==', userWithTeam.teamId)
        .limit(1)
        .get();

      if (!memberSnap.empty) {
        return { error: 'User is already a member of this team' };
      }
    }

    // Check for existing invitation
    const inviteSnap = await getInvitationsCollection()
      .where('email', '==', email)
      .where('teamId', '==', userWithTeam.teamId)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!inviteSnap.empty) {
      return { error: 'An invitation has already been sent to this email' };
    }

    // Get Account ID from Team
    const teamDoc = await getTeamDoc(userWithTeam.teamId).get();
    if (!teamDoc.exists) {
      return { error: 'Team data not found' };
    }
    const teamData = teamDoc.data();

    if (!teamData) {
      return { error: 'Team data is empty' };
    }

    // Create a new invitation
    const newInviteRef = getInvitationsCollection().doc();
    const newInvite: Invitation = {
      id: newInviteRef.id,
      teamId: userWithTeam.teamId,
      accountId: teamData.accountId,
      email,
      role,
      invitedBy: user.id,
      createdAt: Timestamp.now() as any,
      status: 'pending'
    };
    await newInviteRef.set(newInvite);

    await logActivity(
      userWithTeam.teamId,
      user.id,
      ActivityType.INVITE_TEAM_MEMBER
    );

    // Send invitation email
    const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL}/sign-up?inviteId=${newInviteRef.id}`;
    await emailService.sendInviteEmail(email, user.name || user.email, inviteLink);

    return { success: 'Invitation sent successfully' };
  }
);
