import { Timestamp } from 'firebase/firestore';

export interface User {
    id: string; // UID from Authentication
    name: string | null;
    email: string;
    role: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    deletedAt?: Timestamp | null;

    accountId?: string | null;
    hasDismissedGettingStarted?: boolean;
}

export interface Account {
    id: string;
    name: string;
    ownerId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Team {
    id: string;
    name: string;
    accountId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    stripeProductId?: string | null;
    planName?: string | null;
    subscriptionStatus?: string | null;
}

export interface TeamMember {
    id: string;
    userId: string;
    teamId: string;
    role: string;
    joinedAt: Timestamp;
    stats?: {
        totalConnections: number;
        lastConnectedAt?: Timestamp | null;
        averageSentiment?: number;
    };
}

export interface ActivityLog {
    id: string;
    teamId: string;
    userId?: string | null;
    action: string;
    timestamp: Timestamp;
    ipAddress?: string | null;
}

export interface Invitation {
    id: string;
    teamId: string;
    accountId: string;
    email: string;
    role: string;
    invitedBy: string;
    createdAt: Timestamp;
    status: string; // 'pending', 'accepted', 'revoked'
}

export interface PasswordResetToken {
    id: string;
    userId: string;
    token: string;
    expiresAt: Timestamp;
    createdAt: Timestamp;
}

export enum ActivityType {
    SIGN_UP = 'SIGN_UP',
    SIGN_IN = 'SIGN_IN',
    SIGN_OUT = 'SIGN_OUT',
    UPDATE_PASSWORD = 'UPDATE_PASSWORD',
    DELETE_ACCOUNT = 'DELETE_ACCOUNT',
    UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
    CREATE_TEAM = 'CREATE_TEAM',
    REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
    INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
    ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}

export interface Schedule {
    id: string;
    accountId: string;
    teamId: string;
    themeId: string;
    name: string;
    frequency: 'weekly' | 'bi-weekly' | 'monthly';
    start_day: string;
    duration: number; // in minutes
    participantsPerMatch: number;
    status: 'active' | 'paused';
    nextRunAt: Timestamp;
    minTimePerQuestion?: number; // in seconds, default 60
    maxTimePerQuestion?: number; // in seconds, default 180
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Theme {
    id: string;
    accountId?: string | null; // null for system defaults
    name: string;
    description: string;
    questions: string[];
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface QuestionEvent {
    question: string;
    askedAt: Timestamp;
}

export interface Connection {
    id: string;
    scheduleId: string;
    teamId: string;
    status: 'scheduling' | 'proposed' | 'scheduled' | 'completed' | 'cancelled';
    proposerId: string;
    confirmerId: string;
    proposedTimes?: Timestamp[] | null;
    confirmedTime?: Timestamp | null;
    connectRoomId?: string | null;
    connectRoomUrl?: string | null;
    transcriptId?: string | null;
    transcriptSid?: string | null;
    transcriptStatus?: 'queued' | 'processing' | 'composing' | 'completed' | 'failed' | null;
    transcriptOutputUri?: string | null;
    transcript?: any | null; // Legacy/Google Video Intelligence result object
    summary?: string | null;
    sentiment?: number | null;
    startedAt?: Timestamp | null;
    analysis?: ConnectionAnalysis | null;
    questions?: string[] | null; // Selected/Randomized questions for this session
    questionEvents?: QuestionEvent[] | null; // Log of when questions were asked
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export type TeamDataWithMembers = Team & {
    teamMembers: (TeamMember & {
        user: Pick<User, 'id' | 'name' | 'email'>;
    })[];
};

export type ConnectionWithParticipants = Connection & {
    proposer: Pick<User, 'id' | 'name' | 'email'> | null;
    confirmer: Pick<User, 'id' | 'name' | 'email'> | null;
};

export interface ConnectionAnalysis {
    summary: string;
    sentimentScore: number;
    interactionBalance: number;
    topics: string[];
    keyTakeaways: string[];
    vibeScore: string; // "Thriving", "Neutral", "Concern"
}

export interface Relationship {
    id: string; // composite key: "min(uid1, uid2)_max(uid1, uid2)"
    teamId: string;
    users: [string, string];
    connectionCount: number;
    lastConnectedAt: Timestamp;
    strengthScore: number; // 0-100 based on sentiment/frequency
    tags: string[]; // Shared topics
}

export interface AnalyticsSnapshot {
    id: string; // e.g., "team_{teamId}_{period}"
    entityType: 'team' | 'account';
    entityId: string;
    period: string; // "YYYY-MM"

    // Aggregates
    totalConnections: number;
    completedConnections: number;
    avgSentiment: number;
    participationRate: number;

    // Graph Data
    relationshipDensity: number;
    topTopics: { topic: string; count: number }[];

    updatedAt: Timestamp;
}

export interface Transcript {
    sid: string;
    connectionId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    text: string;
    dateCreated: Timestamp;
    dateUpdated: Timestamp;
    url?: string;
    duration?: number;
}
