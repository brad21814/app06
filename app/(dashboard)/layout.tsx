'use client';

import { Activity, Users, Shield } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { ClientAuthCheck } from '@/components/auth/client-auth-check';
import { MissingTierNotification } from '@/components/dashboard/missing-tier-notification';
import { NotificationCenter } from '@/components/dashboard/notification-center';

function Header() {
  return <SiteHeader />;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navItems = [
    { href: '/dashboard', icon: Users, label: 'Team' },
    { href: '/dashboard/activity', icon: Activity, label: 'Activity' },
    { href: '/profile/privacy', icon: Shield, label: 'Privacy' }
  ];

  return (
    <ClientAuthCheck>
      <section className="flex flex-col min-h-screen">
        <Header />
        <div className="flex flex-col flex-1 max-w-7xl mx-auto w-full">
          <div className="flex flex-1 overflow-hidden h-full justify-center">
            {/* Main content */}
            <main className="flex-1 overflow-y-auto p-4 max-w-5xl w-full">
              <NotificationCenter />
              <MissingTierNotification />
              {children}
            </main>
          </div>
        </div>
      </section>
    </ClientAuthCheck>
  );
}
