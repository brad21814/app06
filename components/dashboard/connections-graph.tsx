'use client';

import { useEffect, useState, useMemo } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getConnectionGraphData, GraphData } from '@/lib/actions/connections';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Custom Node Component
const CustomNode = ({ data, type }: any) => {
    const size = type === 'self' ? 80 : 60;
    const isSelf = type === 'self';

    return (
        <div
            className={`flex flex-col items-center justify-center p-2 rounded-full border-2 
                ${isSelf ? 'border-blue-500 bg-white shadow-lg' : 'border-gray-200 bg-gray-50 shadow-sm'}
            `}
            style={{ width: size, height: size }}
        >
            <Avatar className="w-full h-full">
                <AvatarImage src={data.image} alt={data.label} />
                <AvatarFallback className={isSelf ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}>
                    {data.label.charAt(0)}
                </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-6 whitespace-nowrap text-xs font-medium bg-white/80 px-2 py-0.5 rounded-full border border-gray-100">
                {data.label}
            </div>
        </div>
    );
};

const nodeTypes = {
    self: CustomNode,
    partner: CustomNode
};

export function ConnectionsGraph() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadGraph = async () => {
            try {
                const data = await getConnectionGraphData();
                setNodes(data.nodes);
                setEdges(data.edges.map(e => ({
                    ...e,
                    type: 'default',
                    markerEnd: { type: MarkerType.ArrowClosed },
                    style: { strokeWidth: Math.max(1, (e.data?.weight || 1) * 2), stroke: '#94a3b8' }
                })));
            } catch (error) {
                console.error("Failed to load connection graph:", error);
            } finally {
                setLoading(false);
            }
        };

        loadGraph();
    }, [setNodes, setEdges]);

    // Default Viewport?

    if (loading) {
        return <div className="w-full h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">Loading visual network...</div>;
    }

    if (nodes.length <= 1) { // Only self node
        return (
            <div className="w-full h-[300px] flex flex-col items-center justify-center bg-gray-50 rounded-lg text-gray-400 border border-dashed">
                <p>No connections to visualize yet.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-[600px] border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-right"
                minZoom={0.5}
                maxZoom={2}
            >
                <Background color="#f1f5f9" gap={20} size={1} />
                <Controls />
            </ReactFlow>
        </div>
    );
}
