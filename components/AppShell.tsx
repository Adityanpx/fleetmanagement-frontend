'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  LayoutDashboard, Truck, Receipt, Building2, Bus, BarChart3, LogOut, X, Plus, LayoutGrid,
} from 'lucide-react';
import { clearToken } from '@/lib/auth';
import { cn } from '@/lib/format';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/trips', label: 'Trips', icon: Truck },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
];
const manage = [
  { href: '/vehicles', label: 'Vehicles', icon: Bus },
  { href: '/companies', label: 'Companies', icon: Building2 },
];

const isActive = (path: string, href: string) => path === href || path.startsWith(href + '/');

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-[0_4px_12px_-2px_rgb(99_102_241/0.5)]">
        <Truck size={16} strokeWidth={2.4} />
      </span>
      {!compact && <span className="text-[17px] font-bold tracking-tight">Bulker<span className="text-indigo-600">Track</span></span>}
    </div>
  );
}

function NavGroup({ title, items, onNavigate }: { title?: string; items: typeof nav; onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <div>
      {title && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{title}</p>}
      <nav className="flex flex-col gap-0.5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(path, href);
          return (
            <Link key={href} href={href} onClick={onNavigate}
              className={cn('group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors lg:py-2',
                active ? 'text-indigo-700' : 'text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900')}>
              {active && (
                <motion.span layoutId="nav-active" className="absolute inset-0 rounded-xl bg-indigo-50 ring-1 ring-inset ring-indigo-100"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
              )}
              <Icon size={18} className={cn('relative transition-transform group-hover:scale-110', active ? 'text-indigo-600' : 'text-zinc-400 group-hover:text-zinc-600')} />
              <span className="relative">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [more, setMore] = useState(false);
  const router = useRouter();
  const path = usePathname();
  const logout = () => { clearToken(); router.replace('/login'); };
  const moreActive = manage.some((m) => isActive(path, m.href)) || isActive(path, '/reports');

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-zinc-200/80 bg-white/80 px-3 py-5 backdrop-blur-xl lg:flex">
        <Logo className="mb-7 px-3" />
        <div className="space-y-6">
          <NavGroup items={nav} />
          <NavGroup title="Manage" items={manage} />
        </div>
        <div className="mt-auto rounded-2xl border border-zinc-200/80 bg-linear-to-br from-zinc-50 to-white p-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-900 text-sm font-semibold text-white">O</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Owner</p>
              <p className="text-xs text-zinc-500">Fleet admin</p>
            </div>
            <button type="button" onClick={logout} aria-label="Logout" title="Logout" className="icon-btn"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200/70 bg-white/80 px-4 py-2.5 backdrop-blur-xl lg:hidden">
        <Logo />
        <button type="button" onClick={logout} aria-label="Logout" className="icon-btn"><LogOut size={18} /></button>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200/70 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-md items-end justify-around px-2 pt-1.5">
          <TabLink href="/dashboard" label="Home" icon={LayoutDashboard} active={isActive(path, '/dashboard')} />
          <TabLink href="/trips" label="Trips" icon={Truck} active={isActive(path, '/trips') && path !== '/trips/new'} />
          <Link href="/trips/new" aria-label="New trip"
            className="-mt-5 mb-1 grid h-14 w-14 place-items-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-[0_8px_20px_-4px_rgb(99_102_241/0.6)] transition active:scale-90">
            <Plus size={24} strokeWidth={2.4} />
          </Link>
          <TabLink href="/expenses" label="Expenses" icon={Receipt} active={isActive(path, '/expenses')} />
          <button type="button" onClick={() => setMore(true)}
            className={cn('flex w-16 flex-col items-center gap-0.5 pb-2 pt-1 text-[11px] font-medium', moreActive ? 'text-indigo-600' : 'text-zinc-500')}>
            <LayoutGrid size={20} /> More
          </button>
        </div>
      </nav>

      {/* Mobile "More" sheet */}
      <AnimatePresence>
        {more && (
          <motion.div className="fixed inset-0 z-40 bg-zinc-950/40 backdrop-blur-[2px] lg:hidden" onClick={() => setMore(false)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-pop"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 420, damping: 38 }}
              onClick={(e) => e.stopPropagation()}>
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-200" />
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="font-semibold">More</span>
                <button type="button" onClick={() => setMore(false)} aria-label="Close" className="icon-btn"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[{ href: '/reports', label: 'Reports', icon: BarChart3 }, ...manage].map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} onClick={() => setMore(false)}
                    className={cn('flex items-center gap-3 rounded-2xl border p-3.5 text-sm font-medium transition active:scale-[0.98]',
                      isActive(path, href) ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-zinc-200 text-zinc-700')}>
                    <Icon size={18} /> {label}
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof Truck; active: boolean }) {
  return (
    <Link href={href} className={cn('relative flex w-16 flex-col items-center gap-0.5 pb-2 pt-1 text-[11px] font-medium transition-colors',
      active ? 'text-indigo-600' : 'text-zinc-500')}>
      {active && <motion.span layoutId="tab-active" className="absolute -top-1.5 h-0.5 w-8 rounded-full bg-indigo-600" />}
      <Icon size={20} />
      {label}
    </Link>
  );
}
