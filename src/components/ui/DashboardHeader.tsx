'use client';

import { useState, useRef, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { accountListsApi } from '@/features/accountLists/accountLists.api';
import { getUserInitials } from '@/lib/user-initials';
import { NotificationBell } from './NotificationBell';
import { LayoutDashboard, Upload, Users, ClipboardCheck, ChevronDown, User, LogOut, Settings, ArrowLeft, Info } from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasLists, setHasLists] = useState<boolean | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeMenu();
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen, closeMenu]);

  useEffect(() => {
    if (!user) return;
    accountListsApi.getAll()
      .then(res => setHasLists(res.data.length > 0))
      .catch(() => setHasLists(false));
  }, [user]);

  const navItems = useMemo(() => {
    const base = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Connections', href: '/dashboard/connections', icon: Users },
      { name: 'Matches', href: '/dashboard/matches', icon: ClipboardCheck },
      { name: 'About', href: '/about', icon: Info },
    ];
    if (hasLists === false) {
      base.splice(1, 0, { name: 'Upload', href: '/dashboard/upload', icon: Upload });
    }
    return base;
  }, [hasLists]);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  const handleLogout = () => {
    closeMenu();
    logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto lg:px-14 px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/dashboard">
          <img src="/ovrlap-logo.png" alt="Ovrlap"className="h-12 w-auto object-contain" />
          </Link>

          <nav className="hidden md:flex items-center">
            <div className="flex items-center gap-3 rounded-full bg-slate-100/80 p-1">
              {navItems.map(item => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${active ? 'text-indigo-600' : ''}`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="flex items-center gap-2">
            <NotificationBell />

            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen(prev => !prev)}
                className={`flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 transition-all ${isMenuOpen ? 'bg-slate-100' : 'hover:bg-slate-100'}`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-violet-500 text-sm font-semibold text-white shadow-sm">
                  {getUserInitials(user?.name, 1)}
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-24 truncate">
                  {user?.name || 'User'}
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-slate-200/80 bg-white py-1 shadow-xl shadow-slate-200/50 ring-1 ring-black/5">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                    {user?.company && <p className="text-xs text-indigo-600 font-medium mt-1">{user.company}</p>}
                  </div>
                  <div className="py-1">
                    <Link href="/dashboard/profile" onClick={closeMenu} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <User className="h-4 w-4 text-slate-400" />
                      Your Profile
                    </Link>
                    <Link href="/dashboard/connections" onClick={closeMenu} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                      <Settings className="h-4 w-4 text-slate-400" />
                      Settings
                    </Link>
                  </div>
                  <div className="border-t border-slate-100 py-1">
                    <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="flex md:hidden items-center gap-1 pb-3 -mx-1 overflow-x-auto scrollbar-hide">
          {navItems.map(item => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-all ${
                  active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <item.icon className={`h-4 w-4 ${active ? 'text-indigo-600' : ''}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, backHref, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          {backHref && (
            <Link href={backHref} className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
            {description && <p className="mt-1 text-sm sm:text-base text-slate-500">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 sm:gap-3">{actions}</div>}
      </div>
    </div>
  );
}
