import { CollectionReference, DocumentReference } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/server';
import {
    userConverter,
    teamConverter,
    teamMemberConverter,
    activityLogConverter,
    invitationConverter,
    passwordResetTokenConverter,
    analyticsConverter,
    connectionConverter,
    relationshipConverter,
    summaryConverter
} from './converters';
import {
    User,
    Team,
    TeamMember,
    ActivityLog,
    Invitation,
    PasswordResetToken,
    AnalyticsSnapshot,
    Connection,
    Relationship,
    Summary
} from '@/types/firestore';

export const getUsersCollection = (): CollectionReference<User> =>
    adminDb.collection('users').withConverter(userConverter);

export const getUserDoc = (userId: string): DocumentReference<User> =>
    adminDb.collection('users').doc(userId).withConverter(userConverter);

export const getTeamsCollection = (): CollectionReference<Team> =>
    adminDb.collection('teams').withConverter(teamConverter);

export const getTeamDoc = (teamId: string): DocumentReference<Team> =>
    adminDb.collection('teams').doc(teamId).withConverter(teamConverter);

export const getTeamMembersCollection = (): CollectionReference<TeamMember> =>
    adminDb.collection('team_members').withConverter(teamMemberConverter);

export const getActivityLogsCollection = (): CollectionReference<ActivityLog> =>
    adminDb.collection('activity_logs').withConverter(activityLogConverter);

export const getInvitationsCollection = (): CollectionReference<Invitation> =>
    adminDb.collection('invitations').withConverter(invitationConverter);

export const getPasswordResetTokensCollection = (): CollectionReference<PasswordResetToken> =>
    adminDb.collection('password_reset_tokens').withConverter(passwordResetTokenConverter);

export const getAnalyticsCollection = (): CollectionReference<AnalyticsSnapshot> =>
    adminDb.collection('analytics').withConverter(analyticsConverter);

export const getConnectionsCollection = (): CollectionReference<Connection> =>
    adminDb.collection('connections').withConverter(connectionConverter);

export const getRelationshipsCollection = (): CollectionReference<Relationship> =>
    adminDb.collection('relationships').withConverter(relationshipConverter);

export const getSummariesCollection = (): CollectionReference<Summary> =>
    adminDb.collection('summaries').withConverter(summaryConverter);

export const getSummaryDoc = (summaryId: string): DocumentReference<Summary> =>
    adminDb.collection('summaries').doc(summaryId).withConverter(summaryConverter);
