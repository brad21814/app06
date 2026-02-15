'use server';

import { adminDb } from '@/lib/firebase/server';
import { getUser } from '@/lib/firestore/admin/queries';
import { Connection } from '@/types/firestore';

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

export async function getConnectionGraphData(): Promise<GraphData> {
    const user = await getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    const userId = user.id;

    const connectionsRef = adminDb.collection('connections');
    const isOwnerOrAdmin = user.role === 'owner' || user.role === 'admin';
    let teamId: string | null = null;

    // If admin, we need the team ID to fetch all connections
    if (isOwnerOrAdmin) {
        // We can fetch the team for the user. 
        // Best way is to use `getTeamForUser` equivalent or query team members.
        // Let's query team members for this user.
        const memberQuery = await adminDb.collection('team_members').where('userId', '==', userId).limit(1).get();
        if (!memberQuery.empty) {
            teamId = memberQuery.docs[0].data().teamId;
        }
    }

    const relevantConnections: Connection[] = [];
    const seenIds = new Set();
    const partnerStats = new Map<string, { count: number; name: string; image?: string; id: string }>();

    if (isOwnerOrAdmin && teamId) {
        // Fetch ALL completed connections for the team
        const teamConnectionsQuery = await connectionsRef
            .where('teamId', '==', teamId)
            .where('status', '==', 'completed')
            .get();

        teamConnectionsQuery.forEach(doc => {
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
    if (!isOwnerOrAdmin) participantIds.add(userId); // Ensure 'me' is in list for member view logic? No, 'me' is special.

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

    if (isOwnerOrAdmin && teamId) {
        // --- Circular Layout for Team ---
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
                type: uid === userId ? 'self' : 'partner', // Highlight admin themselves? Or just 'partner' style for everyone?
                data: { label: details.name, image: details.image },
                position: { x, y }
            });
        });

        // Edges for all connections
        relevantConnections.forEach(conn => {
            const source = conn.proposerId;
            const target = conn.confirmerId;
            // Prevent duplicate edges (a-b and b-a) if any. 
            // We can just add them. ReactFlow handles multiple edges between nodes okay, usually needs distinct handles or ids.
            // Let's create a unique ID based on sorted IDs to dedupe visually if we wanted, but connections are distinct events.
            // Actually, we want to aggregate weight between pairs.

            const pairId = [source, target].sort().join('-');
            // ... Logic to aggregate weights if we want single thick lines OR just draw all lines.
            // Drawing all lines might be messy. Let's aggregate.
        });

        // Aggregate connections between pairs
        const pairWeights = new Map<string, number>();
        relevantConnections.forEach(conn => {
            const pairId = [conn.proposerId, conn.confirmerId].sort().join('-');
            pairWeights.set(pairId, (pairWeights.get(pairId) || 0) + 1);
        });

        pairWeights.forEach((weight, pairId) => {
            const [u1, u2] = pairId.split('-');
            edges.push({
                id: `e-${pairId}`,
                source: u1,
                target: u2,
                animated: false,
                label: weight > 1 ? `${weight}` : undefined,
                data: { weight }
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
                    image: details.image
                });
            }

            const stats = partnerStats.get(partnerId)!;
            stats.count++;
        }

        const partners = Array.from(partnerStats.values());
        const count = partners.length;
        const radius = 250;

        partners.forEach((stats, index) => {
            const angle = (index / count) * 2 * Math.PI;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);

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
                label: `${stats.count} connection${stats.count > 1 ? 's' : ''}`,
                data: { weight: stats.count }
            });
        });
    }

    return { nodes, edges };
}
