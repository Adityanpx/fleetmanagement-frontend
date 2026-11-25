'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { ArrowRight, Eye, EyeOff, Lock, User, TrendingUp, Fuel, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { setToken } from '@/lib/auth';
import { Logo } from '@/components/AppShell';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { token } = await api.post('/auth/login', { username, password });
      setToken(token);
      toast.success('Welcome back');
      router.replace('/dashboard');
    } catch (err) {
      toast.error((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-zinc-950 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.06)_1px,transparent_1px)] [background-size:22px_22px]" />

        <Logo className="relative [&_span:last-child]:text-white" />

        <div className="relative my-auto">
          <RouteArt />
          <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-10 max-w-md text-4xl font-semibold leading-tight tracking-tight">
            Every trip, every litre, every rupee — <span className="bg-linear-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">in one place.</span>
          </motion.h2>
          <motion.ul initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1, delayChildren: 0.4 } } }}
            className="mt-8 space-y-3 text-sm text-zinc-300">
            {[
              [TrendingUp, 'Live profit on every trip'],
              [Fuel, 'Diesel, tolls and repairs tracked automatically'],
              [ShieldCheck, 'Never miss an insurance or permit renewal'],
            ].map(([Icon, text]) => {
              const I = Icon as typeof TrendingUp;
              return (
                <motion.li key={text as string} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 ring-1 ring-white/10"><I size={15} /></span>{text as string}
                </motion.li>
              );
            })}
          </motion.ul>
        </div>
        <p className="relative text-xs text-zinc-500">Fleet & trip manager for bulker owners</p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center px-5 py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm">
          <Logo className="mb-10 lg:hidden" />
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-zinc-500">Sign in to manage your fleet.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="label" htmlFor="username">Username</label>
              <div className="relative">
                <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input id="username" className="input pl-9" required autoComplete="username" autoCapitalize="none"
                  value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input id="password" type={show ? 'text' : 'password'} className="input pl-9 pr-10" required autoComplete="current-password"
                  value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button className="btn-primary group w-full py-3" disabled={loading}>
              {loading ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Signing in…</>
              ) : (
                <>Sign in <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

/** A little animated route: two depots joined by a moving dashed road and a truck that drives along it. */
function RouteArt() {
  return (
    <div className="relative h-40 w-full max-w-md">
      <svg viewBox="0 0 400 160" className="h-full w-full" fill="none">
        <path id="road" d="M30 120 C 120 120, 120 40, 200 40 S 300 120, 370 60" stroke="rgb(255 255 255 / 0.12)" strokeWidth="10" strokeLinecap="round" />
        <path d="M30 120 C 120 120, 120 40, 200 40 S 300 120, 370 60" stroke="rgb(165 180 252)" strokeWidth="2" strokeDasharray="6 8" className="animate-dash" />
        <circle cx="30" cy="120" r="9" fill="#6366f1" stroke="#18181b" strokeWidth="3" />
        <circle cx="370" cy="60" r="9" fill="#10b981" stroke="#18181b" strokeWidth="3" />
        <circle r="7" fill="#fff">
          <animateMotion dur="5s" repeatCount="indefinite" rotate="auto" path="M30 120 C 120 120, 120 40, 200 40 S 300 120, 370 60" />
        </circle>
      </svg>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}
        className="absolute -top-12 right-0 rounded-xl bg-white/10 px-3 py-2 text-xs ring-1 ring-white/15 backdrop-blur">
        <p className="text-zinc-400">Trip profit</p>
        <p className="text-base font-semibold text-emerald-300">+ ₹36,100</p>
      </motion.div>
    </div>
  );
}
