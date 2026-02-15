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

    // Fetch connections where user is proposer or confirmer
    const proposerQuery = connectionsRef.where('proposerId', '==', userId).get();
    const confirmerQuery = connectionsRef.where('confirmerId', '==', userId).get();

    const [proposerSnaps, confirmerSnaps] = await Promise.all([proposerQuery, confirmerQuery]);

    const relevantConnections: Connection[] = [];
    const seenIds = new Set();

    const addDoc = (doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        if (!seenIds.has(doc.id)) {
            const data = doc.data() as Connection;
            // Only include completed or scheduled connections? 
            // "historical connections" implies past. 
            // user request: "historical connections". 
            // let's include 'completed'.
            if (data.status === 'completed') {
                relevantConnections.push({ id: doc.id, ...data });
                seenIds.add(doc.id);
            }
        }
    }

    proposerSnaps.forEach(addDoc);
    confirmerSnaps.forEach(addDoc);

    const partnerStats = new Map<string, { count: number; name: string }>();

    // We need to fetch user names if not in connection doc.
    // The `Connection` type in `types/firestore` has `participants` FIELD absent.
    // BUT in the page code, it used `connection.participants`.
    // If the data in Firestore has `participants`, we can use it. 
    // Let's assume it does based on the page code. 
    // If not, we fall back to fetching users.
    // Actually, `types/firestore.ts` doesn't have it, so TS will complain if I cast to `Connection`.
    // I will cast to `any` for the data to check for `participants`.

    for (const conn of relevantConnections) {
        const data = conn as any;
        const isProposer = conn.proposerId === userId;
        const partnerId = isProposer ? conn.confirmerId : conn.proposerId;

        if (partnerId === userId) continue;

        let partnerName = 'Unknown';
        if (data.participants && Array.isArray(data.participants)) {
            const p = data.participants.find((p: any) => p.id === partnerId);
            if (p) partnerName = p.name;
        }

        if (!partnerStats.has(partnerId)) {
            partnerStats.set(partnerId, { count: 0, name: partnerName });
        }

        const stats = partnerStats.get(partnerId)!;
        stats.count++;
        if (partnerName !== 'Unknown' && stats.name === 'Unknown') {
            stats.name = partnerName;
        }
    }

    // Now build graph
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Center Node (Me)
    nodes.push({
        id: userId,
        type: 'self',
        data: { label: 'Me', image: user.photoURL || undefined },
        position: { x: 0, y: 0 }
    });

    // Partner Nodes (Radial Layout)
    const partners = Array.from(partnerStats.entries());
    const count = partners.length;
    const radius = 250;

    partners.forEach(([partnerId, stats], index) => {
        const angle = (index / count) * 2 * Math.PI;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);

        nodes.push({
            id: partnerId,
            type: 'partner',
            data: { label: stats.name },
            position: { x, y }
        });

        edges.push({
            id: `e-${userId}-${partnerId}`,
            source: userId,
            target: partnerId,
            animated: true,
            label: `${stats.count} connection${stats.count > 1 ? 's' : ''}`,
            data: { weight: stats.count }
        });
    });

    return { nodes, edges };
}
