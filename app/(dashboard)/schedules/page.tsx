'use client';

import { ScheduleManager } from '@/components/settings/schedule-manager';

export default function SchedulesPage() {
    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Schedules</h1>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold">Manage Schedules</h2>
                    <p className="text-gray-500">Configure how often your teams connect and what they talk about.</p>
                </div>
                <ScheduleManager />
            </div>
        </div>
    );
}
