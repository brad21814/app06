import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    getDocs,
    addDoc,
    Timestamp,
    onSnapshot,
    Unsubscribe,
    orderBy
} from 'firebase/firestore';
import { db } from './config';

export interface UserData {
    uid: string;
    email: string;
    name?: string;
    role: 'owner' | 'admin' | 'member';
    teamId?: string;
    accountId?: string;
    photoURL?: string;
    timezone?: string;
    hasDismissedGettingStarted?: boolean;
    createdAt: Timestamp;
}

export interface Account {
    id: string;
    name: string;
    ownerId: string;
    createdAt: Timestamp;
}

export interface Team {
    id: string;
    name: string;
    accountId: string;
    createdAt: Timestamp;
}

export interface Invitation {
    id: string;
    email: string;
    teamId: string;
    accountId: string;
    role: 'admin' | 'member';
    invitedBy: string;
    status: 'pending' | 'accepted' | 'revoked';
    createdAt: Timestamp;
}

// User Operations
export const createUser = async (uid: string, data: Partial<UserData>) => {
    const userRef = doc(db, 'users', uid);
    const userData = {
        uid,
        createdAt: Timestamp.now(),
        role: 'member', // Default role
        ...data
    };
    await setDoc(userRef, userData, { merge: true });
    return userData;
};

export const getUser = async (uid: string): Promise<UserData | null> => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        return userSnap.data() as UserData;
    }
    return null;
};

export const updateUser = async (uid: string, data: Partial<UserData>) => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
};

// Account Operations
export const createAccount = async (name: string, ownerId: string) => {
    const accRef = await addDoc(collection(db, 'accounts'), {
        name,
        ownerId,
        createdAt: Timestamp.now(),
    });
    return { id: accRef.id, name, ownerId };
};

// Team Operations
export const createTeam = async (name: string, accountId: string) => {
    const teamRef = await addDoc(collection(db, 'teams'), {
        name,
        accountId,
        createdAt: Timestamp.now(),
    });
    return { id: teamRef.id, name, accountId };
};

export const addTeamMember = async (teamId: string, userId: string, role: string = 'member') => {
    const memberRef = await addDoc(collection(db, 'team_members'), {
        teamId,
        userId,
        role,
        joinedAt: Timestamp.now(),
    });
    return memberRef.id;
};

export const getTeams = async (accountId: string) => {
    const q = query(collection(db, 'teams'), where('accountId', '==', accountId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
};

// Invitation Operations
export const inviteMember = async (email: string, teamId: string, accountId: string, role: 'admin' | 'member', invitedBy: string) => {
    const inviteRef = await addDoc(collection(db, 'invitations'), {
        email,
        teamId,
        accountId,
        role,
        invitedBy,
        status: 'pending',
        createdAt: Timestamp.now(),
    });
    return { id: inviteRef.id, email, teamId, accountId, role };
};

export const getInvitation = async (inviteId: string): Promise<Invitation | null> => {
    const inviteRef = doc(db, 'invitations', inviteId);
    const inviteSnap = await getDoc(inviteRef);
    if (inviteSnap.exists()) {
        return { id: inviteSnap.id, ...inviteSnap.data() } as Invitation;
    }
    return null;
};

export const acceptInvitation = async (inviteId: string, userId: string) => {
    const inviteRef = doc(db, 'invitations', inviteId);
    await updateDoc(inviteRef, { status: 'accepted' });
    // Note: You would typically also update the user's teamId and accountId here
    // But we'll handle that in the calling logic or a transaction if needed.
};

export const getTeamInvitations = async (teamId: string) => {
    const q = query(
        collection(db, 'invitations'),
        where('teamId', '==', teamId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Invitation))
        .filter(invite => invite.status !== 'revoked');
};

export const getAccountInvitations = async (accountId: string) => {
    const q = query(
        collection(db, 'invitations'),
        where('accountId', '==', accountId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Invitation))
        .filter(invite => invite.status !== 'revoked');
};

export const subscribeToTeamInvitations = (teamId: string, callback: (invitations: Invitation[]) => void): Unsubscribe => {
    const q = query(
        collection(db, 'invitations'),
        where('teamId', '==', teamId),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const invitations = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Invitation))
            .filter(invite => invite.status !== 'revoked');
        callback(invitations);
    });
};

export const revokeInvitation = async (inviteId: string) => {
    const inviteRef = doc(db, 'invitations', inviteId);
    await updateDoc(inviteRef, { status: 'revoked' });
};
