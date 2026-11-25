'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useHasToken } from '@/lib/auth';
import AppShell from '@/components/AppShell';
import Spinner from '@/components/ui/Spinner';

/**
 * Auth guard for every business page. `hasToken` is null until the browser check runs,
 * so nothing protected renders (no flash) before we know the user is signed in.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hasToken = useHasToken();
  useEffect(() => { if (hasToken === false) router.replace('/login'); }, [hasToken, router]);
  if (!hasToken) return <Spinner className="min-h-screen" />;
  return <AppShell>{children}</AppShell>;
}
