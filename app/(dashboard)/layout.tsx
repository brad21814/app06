'use client';

import { Activity, Users, Shield } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { ClientAuthCheck } from '@/components/auth/client-auth-check';
import { useAuth } from '@/lib/firebase/auth-context';
import { MissingTierNotification } from '@/components/dashboard/missing-tier-notification';
import { NotificationCenter } from '@/components/dashboard/notification-center';
import { TrialBanner } from '@/components/dashboard/trial-banner';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Account } from '@/types/firestore';

function Header() {
  return <SiteHeader />;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userData } = useAuth();
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!userData?.accountId) {
        setIsCheckingAccess(false);
        return;
      }

      const isExemptRoute = pathname?.includes('/settings/billing') || pathname?.includes('/subscription-required');
      
      if (!isExemptRoute) {
        const docRef = doc(db, 'accounts', userData.accountId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const account = docSnap.data() as Account;
          const status = account.subscriptionStatus;
          
          if (status === 'canceled' || status === 'past_due' || 
             (status === 'trialing' && account.trialEndsAt && account.trialEndsAt.toDate() < new Date())) {
            router.push('/subscription-required');
          }
        }
      }
      setIsCheckingAccess(false);
    };

    checkAccess();
  }, [userData?.accountId, pathname, router]);

  const navItems = [
    { href: '/dashboard', icon: Users, label: 'Team' },
    { href: '/dashboard/activity', icon: Activity, label: 'Activity' },
    { href: '/profile/privacy', icon: Shield, label: 'Privacy' }
  ];

  if (isCheckingAccess) {
      return null;
  }

  return (
    <ClientAuthCheck>
      <section className="flex flex-col min-h-screen">
        <TrialBanner />
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
