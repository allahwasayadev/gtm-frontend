'use client';

import { useState, useRef, useEffect, useMemo, useCallback, useId, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { accountListsApi } from '@/features/accountLists/accountLists.api';
import { getUserInitials } from '@/lib/user-initials';
import { NotificationBell } from './NotificationBell';
import { BrandLockup } from './BrandLockup';
import { LEGAL_LINKS } from './SiteFooter';
import { LayoutDashboard, Upload, Users, ClipboardCheck, ChevronDown, User, LogOut, Settings, ArrowLeft, Info, UsersRound, Shield, Scale, MessageSquare } from 'lucide-react';

const PUBLIC_NAV = [
  { name: 'About', href: '/about', icon: Info },
  { name: 'Privacy', href: '/privacy', icon: Shield },
  { name: 'Terms', href: '/terms', icon: Scale },
];

const LEGAL_ICONS: Record<string, typeof Info> = {
  '/about': Info,
  '/privacy': Shield,
  '/terms': Scale,
  '/sms-opt-in': MessageSquare,
};

/**
 * Harbour top navigation.
 *
 * Signed out, the primary navigation is the public one: About, Privacy, Terms,
 * with Log in and Sign up.
 *
 * Signed in, the primary navigation holds only the app's own destinations —
 * Dashboard, Connections, Matches, plus Upload while the account has no list
 * and Users for an Admin. The legal and informational destinations moved into
 * the account menu and the footer. Every destination is preserved; previously
 * an Admin without a list saw seven tabs, which pushed the core sections into
 * a horizontal scroller.
 */
export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasLists, setHasLists] = useState<boolean | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);
  // Opening resets the roving index here rather than inside the effect, so the
  // effect never calls setState synchronously and cause a second render pass.
  const openMenu = useCallback(() => {
    setActiveIndex(0);
    setIsMenuOpen(true);
  }, []);
  const toggleMenu = useCallback(() => {
    setActiveIndex(0);
    setIsMenuOpen(prev => !prev);
  }, []);
  const closeAndRestore = useCallback(() => {
    setIsMenuOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!user) return;
    accountListsApi.getAll()
      .then(res => setHasLists(res.data.length > 0))
      .catch(() => setHasLists(false));
  }, [user]);

  /** App destinations only. Legal lives in the menu and the footer. */
  const navItems = useMemo(() => {
    if (!user) return PUBLIC_NAV;
    const base = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Connections', href: '/dashboard/connections', icon: Users },
      { name: 'Matches', href: '/dashboard/matches', icon: ClipboardCheck },
    ];
    if (hasLists === false) {
      base.splice(1, 0, { name: 'Upload', href: '/dashboard/upload', icon: Upload });
    }
    if (user?.roles?.includes('Admin')) {
      base.push({ name: 'Users', href: '/dashboard/users', icon: UsersRound });
    }
    return base;
  }, [hasLists, user]);

  /** Everything inside the account menu, in focus order. */
  const menuItems = useMemo(
    () => [
      { kind: 'link' as const, href: '/dashboard/profile', label: 'Your Profile', icon: User },
      { kind: 'link' as const, href: '/dashboard/connections', label: 'Settings', icon: Settings },
      ...LEGAL_LINKS.map(l => ({ kind: 'link' as const, href: l.href, label: l.name, icon: LEGAL_ICONS[l.href] ?? Info })),
      { kind: 'action' as const, label: 'Sign out', icon: LogOut },
    ],
    []
  );

  /**
   * Bound the menu to the space actually below the trigger.
   *
   * Measured from the live header rather than assuming its height, because the
   * header is two rows below `lg` and one row above it. Written straight to the
   * node: this is a DOM sync, and routing it through state would add a render
   * on every scroll and resize event.
   */
  const measureMenu = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    const node = menuRef.current;
    if (!rect || !node) return;
    const GAP = 8;
    const BOTTOM_GUTTER = 16;
    const available = window.innerHeight - rect.bottom - GAP - BOTTOM_GUTTER;
    node.style.maxHeight = `${Math.max(160, available)}px`;
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    measureMenu();
    itemRefs.current[0]?.focus();

    const onPointerDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) closeMenu();
    };
    const onViewportChange = () => measureMenu();

    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [isMenuOpen, closeMenu, measureMenu]);

  /** Real menu keyboard behaviour, to match the menu semantics. */
  const onMenuKeyDown = (event: React.KeyboardEvent) => {
    const last = menuItems.length - 1;
    const focusItem = (i: number) => {
      setActiveIndex(i);
      itemRefs.current[i]?.focus();
    };
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusItem(activeIndex >= last ? 0 : activeIndex + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusItem(activeIndex <= 0 ? last : activeIndex - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusItem(0);
        break;
      case 'End':
        event.preventDefault();
        focusItem(last);
        break;
      case 'Escape':
        event.preventDefault();
        closeAndRestore();
        break;
      case 'Tab':
        // Tab leaves the menu rather than cycling inside it, which is what a
        // menu button is supposed to do.
        closeMenu();
        break;
    }
  };

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  const handleLogout = () => {
    closeMenu();
    logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-hairline bg-surface">
      <div className="mx-auto px-3 min-[360px]:px-4 sm:px-6 lg:px-14">
        <div className="flex h-16 items-center justify-between gap-2">
          <BrandLockup href={user ? '/dashboard' : '/'} />

          <nav aria-label="Primary" className="hidden xl:flex min-w-0 shrink items-center">
            {/* The group scrolls inside its own box. Without this it painted past
                  its right edge and over the bell and account control once an
                  Admin without a list had five items. */}
              <div className="flex min-w-0 items-center gap-1 overflow-x-auto scrollbar-hide rounded-md bg-sunken p-1">
              {navItems.map(item => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-[44px] items-center gap-2 rounded-sm px-4 text-sm font-bold whitespace-nowrap transition-colors ${
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

                <div ref={wrapperRef} className="relative">
                  <button
                    ref={triggerRef}
                    type="button"
                    onClick={toggleMenu}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openMenu();
                      }
                    }}
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
                      role="menu"
                      aria-label="Account and site menu"
                      onKeyDown={onMenuKeyDown}
                      ref={menuRef}
                      className="ovrlap-panel absolute right-0 mt-2 flex w-[min(16rem,calc(100vw-2rem))] origin-top-right flex-col overflow-hidden rounded-lg border border-hairline bg-surface shadow-e3"
                    >
                      <div className="shrink-0 border-b border-hairline px-4 py-3">
                        <p className="text-sm font-bold text-ink truncate">{user?.name}</p>
                        <p className="text-xs text-ink-3 truncate mt-0.5">{user?.email}</p>
                        {user?.company && <p className="text-xs text-accent-ink font-bold mt-1 truncate">{user.company}</p>}
                      </div>

                      {/* Bounded against the space actually below the trigger, so
                          no action is lost on a short or landscape screen. */}
                      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
                        {menuItems.map((item, index) =>
                          item.kind === 'link' ? (
                            <Link
                              key={item.href}
                              href={item.href}
                              role="menuitem"
                              tabIndex={index === activeIndex ? 0 : -1}
                              ref={(el) => { itemRefs.current[index] = el; }}
                              onClick={closeMenu}
                              onFocus={() => setActiveIndex(index)}
                              className="flex min-h-[44px] items-center gap-3 px-4 text-sm text-ink hover:bg-surface-2 focus:bg-surface-2 focus:outline-none transition-colors"
                            >
                              <item.icon className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                              {item.label}
                            </Link>
                          ) : (
                            <button
                              key={item.label}
                              type="button"
                              role="menuitem"
                              tabIndex={index === activeIndex ? 0 : -1}
                              ref={(el) => { itemRefs.current[index] = el; }}
                              onClick={handleLogout}
                              onFocus={() => setActiveIndex(index)}
                              className="flex min-h-[44px] w-full items-center gap-3 border-t border-hairline px-4 text-sm text-danger hover:bg-danger-soft focus:bg-danger-soft focus:outline-none transition-colors"
                            >
                              <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                              {item.label}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Both actions stay reachable at 320: the pair plus the brand and
                 the row's gutters came to 328 against a 320 viewport, so the
                 padding and the gap tighten below 360 rather than anything
                 being hidden, scaled or clipped. */
              <div className="flex shrink-0 items-center gap-1 min-[360px]:gap-2">
                <Link href="/login" className="flex min-h-[44px] items-center whitespace-nowrap rounded-sm px-2.5 min-[360px]:px-4 text-sm font-bold text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors">
                  Log in
                </Link>
                <Link href="/signup" className="flex min-h-[44px] items-center whitespace-nowrap rounded-sm px-2.5 min-[360px]:px-4 text-sm font-bold text-white bg-accent hover:bg-accent-hover transition-colors shadow-e1">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>

        <nav aria-label="Primary" className="flex xl:hidden items-center gap-1 pb-3 -mx-1 overflow-x-auto scrollbar-hide">
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
