'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useHasToken } from '@/lib/auth';
import Spinner from '@/components/ui/Spinner';

export default function Home() {
  const router = useRouter();
  const hasToken = useHasToken();
  useEffect(() => {
    if (hasToken !== null) router.replace(hasToken ? '/dashboard' : '/login');
  }, [hasToken, router]);
  return <Spinner className="min-h-screen" />;
}
