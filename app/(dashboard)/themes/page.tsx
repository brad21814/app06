'use client';

import { ThemeManager } from '@/components/settings/theme-manager';

export default function ThemesPage() {
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6">Themes</h1>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold">Manage Themes</h2>
                    <p className="text-gray-500">Create and manage discussion themes and questions for your teams.</p>
                </div>
                <ThemeManager />
            </div>
        </div>
    );
}
