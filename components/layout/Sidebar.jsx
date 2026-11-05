'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Zap, LayoutDashboard, Users, CalendarCheck, LogOut } from 'lucide-react';
import { apiRequest } from '@/lib/clientApi';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads Management', icon: Users },
  { href: '/consultations', label: 'Consultations', icon: CalendarCheck },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    apiRequest('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  async function logout() {
    setLoggingOut(true);
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  const initials = (user?.name || 'AA')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-neutral-200 bg-white md:flex">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF4D00] text-white">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide">ASTEX AI</p>
            <p className="text-xs text-neutral-500">Automating the Future</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active ? 'bg-[#FF4D00] text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name || 'Loading...'}</p>
              <p className="truncate text-xs capitalize text-neutral-500">{user?.role || ''}</p>
            </div>
          </div>
          <button
            onClick={logout}
            disabled={loggingOut}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF4D00] text-white">
            <Zap className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold">ASTEX AI</span>
        </div>
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={`rounded-lg p-2 transition ${active ? 'bg-[#FF4D00] text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
              >
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}
          <button onClick={logout} className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100" aria-label="Logout">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>
    </>
  );
}
