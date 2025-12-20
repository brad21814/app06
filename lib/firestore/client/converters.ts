import {
    QueryDocumentSnapshot,
    SnapshotOptions,
    DocumentData,
    FirestoreDataConverter,
    Timestamp
} from 'firebase/firestore';
import {
    User,
    Account,
    Team,
    TeamMember,
    ActivityLog,
    Invitation,
    PasswordResetToken,
    Schedule,
    Theme,
    Connection,
    AnalyticsSnapshot
} from '@/types/firestore';

const createConverter = <T>(): FirestoreDataConverter<T> => ({
    toFirestore(modelObject: T): DocumentData {
        // Remove id from the object when saving to Firestore as it is stored as the document ID
        const { id, ...data } = modelObject as any;
        return data;
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions
    ): T {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            ...data,
        } as T;
    },
});

export const userConverter = createConverter<User>();
export const accountConverter = createConverter<Account>();
export const teamConverter = createConverter<Team>();
export const teamMemberConverter = createConverter<TeamMember>();
export const activityLogConverter = createConverter<ActivityLog>();
export const invitationConverter = createConverter<Invitation>();
export const passwordResetTokenConverter = createConverter<PasswordResetToken>();
export const scheduleConverter = createConverter<Schedule>();
export const themeConverter = createConverter<Theme>();
export const connectionConverter = createConverter<Connection>();
export const analyticsConverter = createConverter<AnalyticsSnapshot>();
