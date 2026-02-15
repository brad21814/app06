import { ConnectionsGraph } from '@/components/dashboard/connections-graph';

export default function ConnectionsPage() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">My Connection Network</h1>
            <ConnectionsGraph />
        </div>
    );
}
