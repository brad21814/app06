import { collection, CollectionReference, doc, DocumentReference } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
    userConverter,
    teamConverter,
    teamMemberConverter,
    activityLogConverter,
    invitationConverter,
    passwordResetTokenConverter,
    scheduleConverter,
    themeConverter,
    connectionConverter,
    accountConverter,
    analyticsConverter
} from './converters';
import {
    User,
    Team,
    TeamMember,
    ActivityLog,
    Invitation,
    PasswordResetToken,
    Schedule,
    Theme,
    Connection,
    Account,
    AnalyticsSnapshot
} from '@/types/firestore';

export const getUsersCollection = (): CollectionReference<User> =>
    collection(db, 'users').withConverter(userConverter);

export const getUserDoc = (userId: string): DocumentReference<User> =>
    doc(db, 'users', userId).withConverter(userConverter);

export const getTeamsCollection = (): CollectionReference<Team> =>
    collection(db, 'teams').withConverter(teamConverter);

export const getTeamDoc = (teamId: string): DocumentReference<Team> =>
    doc(db, 'teams', teamId).withConverter(teamConverter);

export const getAccountsCollection = (): CollectionReference<Account> =>
    collection(db, 'accounts').withConverter(accountConverter);

export const getTeamMembersCollection = (): CollectionReference<TeamMember> =>
    collection(db, 'team_members').withConverter(teamMemberConverter);

export const getActivityLogsCollection = (): CollectionReference<ActivityLog> =>
    collection(db, 'activity_logs').withConverter(activityLogConverter);

export const getInvitationsCollection = (): CollectionReference<Invitation> =>
    collection(db, 'invitations').withConverter(invitationConverter);

export const getPasswordResetTokensCollection = (): CollectionReference<PasswordResetToken> =>
    collection(db, 'password_reset_tokens').withConverter(passwordResetTokenConverter);

export const getSchedulesCollection = (): CollectionReference<Schedule> =>
    collection(db, 'schedules').withConverter(scheduleConverter);

export const getThemesCollection = (): CollectionReference<Theme> =>
    collection(db, 'themes').withConverter(themeConverter);

export const getConnectionsCollection = (): CollectionReference<Connection> =>
    collection(db, 'connections').withConverter(connectionConverter);

export const getAnalyticsCollection = (): CollectionReference<AnalyticsSnapshot> =>
    collection(db, 'analytics').withConverter(analyticsConverter);
