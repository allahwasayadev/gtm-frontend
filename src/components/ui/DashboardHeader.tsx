'use client';

import { useState, useRef, useEffect, useMemo, useCallback, useId, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { accountListsApi } from '@/features/accountLists/accountLists.api';
import { getUserInitials } from '@/lib/user-initials';
import { NotificationBell } from './NotificationBell';
import { LayoutDashboard, Upload, Users, ClipboardCheck, ChevronDown, User, LogOut, Settings, ArrowLeft, Info, UsersRound, Shield, Scale } from 'lucide-react';

/**
 * Harbour top navigation.
 *
 * Which items appear, where they point and who sees them is unchanged: the
 * three public items on their own when signed out; Dashboard, Connections and
 * Matches added when signed in; Upload inserted only while the account has no
 * list; Users inserted before About only for an Admin. The account menu, the
 * bell and the sign-out action behave as before.
 */
export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasLists, setHasLists] = useState<boolean | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeMenu();
    };
    // Escape closes the menu and hands focus back to the control that opened
    // it, so keyboard users are not dropped at the top of the document.
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
        triggerRef.current?.focus();
      }
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
    const publicItems = [
      { name: 'About', href: '/about', icon: Info },
      { name: 'Privacy', href: '/privacy', icon: Shield },
      { name: 'Terms', href: '/terms', icon: Scale },
    ];
    if (!user) return publicItems;
    const base = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Connections', href: '/dashboard/connections', icon: Users },
      { name: 'Matches', href: '/dashboard/matches', icon: ClipboardCheck },
      ...publicItems,
    ];
    if (hasLists === false) {
      base.splice(1, 0, { name: 'Upload', href: '/dashboard/upload', icon: Upload });
    }
    if (user?.roles?.includes('Admin')) {
      base.splice(base.indexOf(base.find(i => i.name === 'About')!), 0, { name: 'Users', href: '/dashboard/users', icon: UsersRound });
    }
    return base;
  }, [hasLists, user]);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  const handleLogout = () => {
    closeMenu();
    logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-hairline bg-surface">
      <div className="mx-auto lg:px-14 px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-2">
          <Link href={user ? '/dashboard' : '/'} className="inline-flex shrink-0 items-center rounded-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ovrlap-logo.svg" alt="Ovrlap" className="h-12 w-auto object-contain" />
          </Link>

          <nav aria-label="Primary" className="hidden lg:flex min-w-0 shrink items-center">
            <div className="flex min-w-0 items-center gap-1 overflow-x-auto scrollbar-hide rounded-md bg-sunken p-1">
              {navItems.map(item => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`relative flex min-h-[44px] items-center gap-2 rounded-sm px-4 text-sm font-bold whitespace-nowrap transition-colors ${
                      active ? 'bg-surface text-ink shadow-e1' : 'text-ink-2 hover:text-ink hover:bg-surface/60'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 shrink-0 ${active ? 'text-accent' : ''}`} aria-hidden="true" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {user ? (
              <>
                <NotificationBell />

                <div ref={menuRef} className="relative">
                  <button
                    ref={triggerRef}
                    type="button"
                    onClick={() => setIsMenuOpen(prev => !prev)}
                    aria-expanded={isMenuOpen}
                    aria-haspopup="menu"
                    aria-controls={isMenuOpen ? menuId : undefined}
                    className={`flex min-h-[44px] items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 transition-colors ${isMenuOpen ? 'bg-surface-2' : 'hover:bg-surface-2'}`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                      {getUserInitials(user?.name, 1)}
                    </span>
                    <span className="hidden sm:block text-sm font-bold text-ink max-w-24 truncate">
                      {user?.name || 'User'}
                    </span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-ink-3 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>

                  {isMenuOpen && (
                    <div
                      id={menuId}
                      className="ovrlap-panel absolute right-0 mt-2 flex w-[min(16rem,calc(100vw-2rem))] max-h-[calc(100vh-5rem)] origin-top-right flex-col overflow-hidden rounded-lg border border-hairline bg-surface shadow-e3"
                    >
                      <div className="shrink-0 border-b border-hairline px-4 py-3">
                        <p className="text-sm font-bold text-ink truncate">{user?.name}</p>
                        <p className="text-xs text-ink-3 truncate mt-0.5">{user?.email}</p>
                        {user?.company && <p className="text-xs text-accent-ink font-bold mt-1 truncate">{user.company}</p>}
                      </div>
                      {/* The menu is bounded and scrolls inside itself, so no action
                          is lost on a short or landscape screen. */}
                      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
                        <Link href="/dashboard/profile" onClick={closeMenu} className="flex min-h-[44px] items-center gap-3 px-4 text-sm text-ink hover:bg-surface-2 transition-colors">
                          <User className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                          Your Profile
                        </Link>
                        <Link href="/dashboard/connections" onClick={closeMenu} className="flex min-h-[44px] items-center gap-3 px-4 text-sm text-ink hover:bg-surface-2 transition-colors">
                          <Settings className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                          Settings
                        </Link>
                      </div>
                      <div className="shrink-0 border-t border-hairline py-1">
                        <button type="button" onClick={handleLogout} className="flex min-h-[44px] w-full items-center gap-3 px-4 text-sm text-danger hover:bg-danger-soft transition-colors">
                          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="flex min-h-[44px] items-center rounded-sm px-4 text-sm font-bold text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors">
                  Log in
                </Link>
                <Link href="/signup" className="flex min-h-[44px] items-center rounded-sm px-4 text-sm font-bold text-white bg-accent hover:bg-accent-hover transition-colors shadow-e1">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>

        <nav aria-label="Primary" className="flex lg:hidden items-center gap-1 pb-3 -mx-1 overflow-x-auto scrollbar-hide">
          {navItems.map(item => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-sm px-3 text-sm font-bold transition-colors ${
                  active ? 'bg-accent-soft text-accent-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <item.icon className={`h-4 w-4 shrink-0 ${active ? 'text-accent' : ''}`} aria-hidden="true" />
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
        <div className="flex items-start gap-2 min-w-0">
          {backHref && (
            <Link
              href={backHref}
              aria-label="Go back"
              className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-ink-3 hover:bg-surface-2 hover:text-ink transition-colors"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Link>
          )}
          <div className="min-w-0 pt-1.5">
            <h1 className="text-[22px] sm:text-[32px] font-black tracking-[-0.02em] text-ink leading-tight">{title}</h1>
            {description && <p className="mt-1 text-[15px] text-ink-2">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 sm:gap-3">{actions}</div>}
      </div>
    </div>
  );
}
