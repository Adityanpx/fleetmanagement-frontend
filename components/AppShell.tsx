'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Truck, Receipt, Building2, Users, Bus, BarChart3, LogOut, Menu, X,
} from 'lucide-react';
import { clearToken } from '@/lib/auth';
import { cn } from '@/lib/format';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/trips', label: 'Trips', icon: Truck },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/drivers', label: 'Drivers', icon: Users },
  { href: '/vehicles', label: 'Vehicles', icon: Bus },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
];

function Logo({ className }: { className?: string }) {
  return <div className={cn('font-bold tracking-tight', className)}>Bulker<span className="text-blue-600">Track</span></div>;
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = path === href || path.startsWith(href + '/');
        return (
          <Link key={href} href={href} onClick={onNavigate}
            className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition lg:py-2',
              active ? 'bg-blue-50 text-blue-700' : 'text-zinc-600 hover:bg-zinc-100')}>
            <Icon size={18} /> {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const logout = () => { clearToken(); router.replace('/login'); };

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-zinc-200 bg-white px-3 py-5 lg:flex lg:flex-col">
        <Logo className="px-3 pb-6 text-lg" />
        <NavLinks />
        <button type="button" onClick={logout} className="btn-ghost mt-auto justify-start"><LogOut size={18} /> Logout</button>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-4 py-2 backdrop-blur lg:hidden">
        <Logo className="text-base" />
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="icon-btn h-10 w-10 text-zinc-700"><Menu size={20} /></button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute right-0 top-0 flex h-full w-64 flex-col bg-white px-3 py-5 shadow-pop" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between px-3">
              <span className="font-bold">Menu</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="icon-btn -mr-2"><X size={18} /></button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <button type="button" onClick={logout} className="btn-ghost mt-6 w-full justify-start"><LogOut size={18} /> Logout</button>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
