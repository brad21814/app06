'use client';

import { useEffect, useState } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    MarkerType,
    Handle,
    Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { getConnectionGraphData } from '@/lib/actions/connections';
import { UserAvatar } from '@/components/ui/user-avatar';

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
            <Handle type="target" position={Position.Top} className="opacity-0" />
            <UserAvatar 
                user={{ name: data.label, photoURL: data.image }} 
                className="w-full h-full border-0" 
            />
            <div className="absolute -bottom-6 whitespace-nowrap text-xs font-medium bg-white/80 px-2 py-0.5 rounded-full border border-gray-100">
                {data.label}
            </div>
            <Handle type="source" position={Position.Bottom} className="opacity-0" />
        </div>
    );
};

const nodeTypes = {
    self: CustomNode,
    partner: CustomNode
};

interface ConnectionsGraphProps {
    dateLimit?: Date;
}

export function ConnectionsGraph({ dateLimit }: ConnectionsGraphProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadGraph = async () => {
            setLoading(true);
            try {
                const data = await getConnectionGraphData(dateLimit);
                setNodes(data.nodes);
                setEdges(data.edges.map(e => ({
                    ...e,
                    type: 'default',
                    markerEnd: { type: MarkerType.ArrowClosed },
                    style: { strokeWidth: Math.max(1, (e.data?.weight || 1) * 2), stroke: '#94a3b8' },
                    labelStyle: { fill: '#64748b', fontWeight: 600, fontSize: 10 },
                    labelBgStyle: { fill: '#f8fafc', fillOpacity: 0.8 },
                    labelBgPadding: [4, 2],
                    labelBgBorderRadius: 4
                })));
            } catch (error) {
                console.error("Failed to load connection graph:", error);
            } finally {
                setLoading(false);
            }
        };

        loadGraph();
    }, [setNodes, setEdges, dateLimit]);

    return (
        <div className="space-y-4">
            {loading ? (
                <div className="w-full h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">Loading visual network...</div>
            ) : nodes.length <= 1 ? (
                <div className="w-full h-[300px] flex flex-col items-center justify-center bg-gray-50 rounded-lg text-gray-400 border border-dashed">
                    <p>No connections to visualize in this range.</p>
                </div>
            ) : (
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
            )}
        </div>
    );
}
