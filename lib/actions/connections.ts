'use server';

import { adminDb } from '@/lib/firebase/server';
import { getUser } from '@/lib/firestore/admin/queries';
import { Connection } from '@/types/firestore';
import { Timestamp } from 'firebase-admin/firestore';

export interface GraphNode {
    id: string;
    type: 'self' | 'partner';
    data: {
        label: string;
        image?: string;
        role?: string;
    };
    position: { x: number; y: number };
}

export interface GraphEdge {
    id: string;
    source: string;
    target: string;
    animated?: boolean;
    label?: string;
    data?: {
        weight: number;
    }
}

export interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

export async function getConnectionGraphData(dateLimit?: Date): Promise<GraphData> {
    const user = await getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    const userId = user.id;
    const accountId = user.accountId;

    const connectionsRef = adminDb.collection('connections');
    const isPrivileged = user.role === 'owner' || user.role === 'admin' || user.role === 'account_admin';

    // Apply default 90-day window for privileged users if not specified
    let actualDateLimit = dateLimit;
    if (isPrivileged && !actualDateLimit) {
        actualDateLimit = new Date();
        actualDateLimit.setDate(actualDateLimit.getDate() - 90);
    }

    const relevantConnections: Connection[] = [];
    const seenIds = new Set<string>();
    const partnerStats = new Map<string, { count: number; name: string; image?: string; id: string, sumSentiment: number }>();

    if (isPrivileged && accountId) {
        // Fetch ALL completed connections for the account
        let q = connectionsRef
            .where('accountId', '==', accountId)
            .where('status', '==', 'completed');

        if (actualDateLimit) {
            q = q.where('createdAt', '>=', Timestamp.fromDate(actualDateLimit));
        }

        const querySnapshot = await q.get();
        querySnapshot.forEach(doc => {
            if (!seenIds.has(doc.id)) {
                relevantConnections.push({ id: doc.id, ...doc.data() } as Connection);
                seenIds.add(doc.id);
            }
        });

    } else {
        // Member behavior: Fetch connections where user is proposer or confirmer
        const proposerQuery = connectionsRef.where('proposerId', '==', userId).where('status', '==', 'completed').get();
        const confirmerQuery = connectionsRef.where('confirmerId', '==', userId).where('status', '==', 'completed').get();

        const [proposerSnaps, confirmerSnaps] = await Promise.all([proposerQuery, confirmerQuery]);

        const addDoc = (doc: FirebaseFirestore.QueryDocumentSnapshot) => {
            if (!seenIds.has(doc.id)) {
                relevantConnections.push({ id: doc.id, ...doc.data() } as Connection);
                seenIds.add(doc.id);
            }
        }

        proposerSnaps.forEach(addDoc);
        confirmerSnaps.forEach(addDoc);
    }

    // Collect all participant IDs
    const participantIds = new Set<string>();
    if (!isPrivileged) participantIds.add(userId); 

    for (const conn of relevantConnections) {
        if (conn.proposerId) participantIds.add(conn.proposerId);
        if (conn.confirmerId) participantIds.add(conn.confirmerId);
    }

    const userDetails = new Map<string, { name: string; image?: string }>();

    // Fetch user details for all participants
    await Promise.all(Array.from(participantIds).map(async (pid) => {
        try {
            const userDoc = await adminDb.collection('users').doc(pid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                userDetails.set(pid, {
                    name: userData?.name || 'Unknown',
                    image: userData?.photoURL
                });
            }
        } catch (e) {
            console.error(`Failed to fetch user ${pid}`, e);
        }
    }));

    // Build Graph Data
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    if (isPrivileged && accountId) {
        // --- Circular Layout for Account ---
        const allUsers = Array.from(participantIds);
        const count = allUsers.length;
        const radius = 300;

        allUsers.forEach((uid, index) => {
            const angle = (index / count) * 2 * Math.PI;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const details = userDetails.get(uid) || { name: 'Unknown' };

            nodes.push({
                id: uid,
                type: uid === userId ? 'self' : 'partner', 
                data: { label: details.name, image: details.image },
                position: { x, y }
            });
        });

        // Aggregate connections between pairs
        const pairStats = new Map<string, { weight: number, sumSentiment: number }>();
        relevantConnections.forEach(conn => {
            const pairId = [conn.proposerId, conn.confirmerId].sort().join(':::');
            const stats = pairStats.get(pairId) || { weight: 0, sumSentiment: 0 };
            stats.weight += 1;
            stats.sumSentiment += (conn.sentiment || 0);
            pairStats.set(pairId, stats);
        });

        pairStats.forEach((stats, pairId) => {
            const [u1, u2] = pairId.split(':::');
            const avgSentiment = stats.weight > 0 ? Math.round(stats.sumSentiment / stats.weight) : 0;
            edges.push({
                id: `e-${pairId}`,
                source: u1,
                target: u2,
                animated: false,
                label: `${stats.weight}x • ${avgSentiment}`,
                data: { weight: stats.weight }
            });
        });

    } else {
        // --- Radial Layout for Member (Centered on Me) ---

        // Center Node (Me)
        nodes.push({
            id: userId,
            type: 'self',
            data: { label: 'Me', image: user.photoURL || undefined },
            position: { x: 0, y: 0 }
        });

        // Calculate stats for partners
        for (const conn of relevantConnections) {
            const isProposer = conn.proposerId === userId;
            const partnerId = isProposer ? conn.confirmerId : conn.proposerId;

            if (partnerId === userId) continue;

            if (!partnerStats.has(partnerId)) {
                const details = userDetails.get(partnerId) || { name: 'Unknown' };
                partnerStats.set(partnerId, {
                    id: partnerId,
                    count: 0,
                    name: details.name,
                    image: details.image,
                    sumSentiment: 0
                });
            }

            const stats = partnerStats.get(partnerId)!;
            stats.count++;
            stats.sumSentiment += (conn.sentiment || 0);
        }

        const partners = Array.from(partnerStats.values());
        const count = partners.length;
        const radius = 250;

        partners.forEach((stats, index) => {
            const angle = (index / count) * 2 * Math.PI;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const avgSentiment = stats.count > 0 ? Math.round(stats.sumSentiment / stats.count) : 0;

            nodes.push({
                id: stats.id,
                type: 'partner',
                data: { label: stats.name, image: stats.image },
                position: { x, y }
            });

            edges.push({
                id: `e-${userId}-${stats.id}`,
                source: userId,
                target: stats.id,
                animated: true,
                label: `${stats.count}x • ${avgSentiment}`,
                data: { weight: stats.count }
            });
        });
    }

    return { nodes, edges };
}
