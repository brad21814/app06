'use client';

import { OnboardingChecklist } from '@/components/dashboard/checklist';

export default function DashboardPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">Dashboard</h1>
      <OnboardingChecklist />
      <h2 className="text-lg font-medium mb-4">Team Settings</h2>
      {/* 
          Team Subscription, Team Members, and Invite Team Member cards have been moved/removed 
          as per request. 
          Use /teams for Team Management.
      */}
      <p className="text-gray-500">
        Manage your team and subscription settings on the <a href="/teams" className="text-orange-600 hover:underline">Teams page</a>.
      </p>
    </section>
  );
}
