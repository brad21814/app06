import {
    QueryDocumentSnapshot,
    FirestoreDataConverter,
    DocumentData
} from 'firebase-admin/firestore';
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

const createConverter = <T>(): FirestoreDataConverter<T> => ({
    toFirestore(modelObject: T): DocumentData {
        const { id, ...data } = modelObject as any;
        return data;
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot
    ): T {
        const data = snapshot.data();
        return {
            id: snapshot.id,
            ...data,
        } as T;
    },
});

export const userConverter = createConverter<User>();
export const teamConverter = createConverter<Team>();
export const teamMemberConverter = createConverter<TeamMember>();
export const activityLogConverter = createConverter<ActivityLog>();
export const invitationConverter = createConverter<Invitation>();
export const passwordResetTokenConverter = createConverter<PasswordResetToken>();
export const analyticsConverter = createConverter<AnalyticsSnapshot>();
export const connectionConverter = createConverter<Connection>();
export const relationshipConverter = createConverter<Relationship>();
export const summaryConverter = createConverter<Summary>();
