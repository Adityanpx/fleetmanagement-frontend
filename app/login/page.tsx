'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { setToken } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { token } = await api.post('/auth/login', { username, password });
      setToken(token);
      router.replace('/dashboard');
    } catch (err) {
      toast.error((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-6">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold tracking-tight">Bulker<span className="text-blue-600">Track</span></div>
          <p className="mt-1 text-sm text-zinc-500">Sign in to your account</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label" htmlFor="username">Username</label>
            <input id="username" className="input" required autoComplete="username" autoCapitalize="none"
              value={username} onChange={(e) => setUsername(e.target.value)} autoFocus /></div>
          <div><label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" className="input" required autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <button className="btn-primary w-full py-2.5" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </div>
    </div>
  );
}
