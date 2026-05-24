'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/store/auth.store';
import { connectSocket } from '@/lib/socket';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = useAuthStore.getState().user;

    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.profile && !(user.profile as any).hasOnboarded) {
      router.replace('/onboarding');
      return;
    }
    connectSocket(user.id);
    setReady(true);
  }, [router]);

  const user = useAuthStore(s => s.user);

  if (!ready || !user) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
