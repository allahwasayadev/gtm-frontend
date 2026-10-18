'use client';

import { useState, useRef, useEffect, useLayoutEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { Users, CheckCircle2 } from 'lucide-react';

type MatchType = 'exact' | 'auto' | 'suggested' | 'accepted';

interface PartnerMatch {
  partnerName: string;
  partnerCompany: string | null;
  partnerRelationshipType: 'OEM' | 'RESELLER';
  matchConfidence?: number;
  theirAccountName?: string;
  matchType?: MatchType;
}

interface AccountMatchTooltipProps {
  children: React.ReactNode;
  partners: PartnerMatch[];
  /** Account this popover belongs to, used in its accessible name. */
  accountName?: string;
}

const PANEL_WIDTH = 300;
const EDGE = 12;
const GAP = 8;
const MIN_PANEL = 140;

/**
 * The partners behind an account's match count.
 *
 * The panel is anchored to the row that opened it — its right edge lines up
 * with the count pill — but it is measured and clamped against the viewport,
 * not against the table cell it lives in. It opens below the pill when there
 * is room and above it when there is not, re-places itself on scroll and
 * resize, and never runs off the screen.
 *
 * Opens on hover and on keyboard focus with a pointer, and on tap on touch.
 * Escape closes it and returns focus to the pill.
 */
export function AccountMatchTooltip({
  children,
  partners,
  accountName,
}: AccountMatchTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isTouchRef = useRef(false);
  const panelId = useId();

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const t = trigger.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    // Measure the panel at its natural height with any cap removed.
    panel.style.maxHeight = '';
    const natural = panel.scrollHeight;

    const roomBelow = vh - t.bottom - GAP - EDGE;
    const roomAbove = t.top - GAP - EDGE;

    let top: number;
    let maxHeight: number;
    if (natural <= roomBelow) {
      top = t.bottom + GAP;
      maxHeight = natural;
    } else if (natural <= roomAbove) {
      maxHeight = natural;
      top = t.top - GAP - natural;
    } else if (roomBelow >= roomAbove && roomBelow >= MIN_PANEL) {
      top = t.bottom + GAP;
      maxHeight = roomBelow;
    } else if (roomAbove >= MIN_PANEL) {
      maxHeight = roomAbove;
      top = t.top - GAP - maxHeight;
    } else {
      maxHeight = vh - 2 * EDGE;
      top = EDGE;
    }

    // Right edge follows the pill, then clamp into the viewport.
    let left = t.right - PANEL_WIDTH;
    if (left + PANEL_WIDTH > vw - EDGE) left = vw - EDGE - PANEL_WIDTH;
    if (left < EDGE) left = EDGE;

    // Written straight to the node. Routing a measurement through state would
    // add a render on every scroll and resize event while the panel is open.
    panel.style.top = `${Math.round(Math.max(EDGE, Math.min(top, vh - EDGE - maxHeight)))}px`;
    panel.style.left = `${Math.round(left)}px`;
    panel.style.maxHeight = `${Math.round(maxHeight)}px`;
    panel.style.visibility = 'visible';
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    place();
  }, [isOpen, place]);

  useEffect(() => {
    if (!isOpen) return;

    const onOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onViewportChange = () => place();

    // Deferred so the tap that opened it does not immediately close it.
    const raf = requestAnimationFrame(() => {
      document.addEventListener('mousedown', onOutside);
      document.addEventListener('touchstart', onOutside);
    });
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('touchstart', onOutside);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [isOpen, place]);

  if (!partners || partners.length === 0) {
    return <>{children}</>;
  }

  const label = accountName
    ? `${partners.length} partner${partners.length === 1 ? '' : 's'} also work ${accountName}`
    : `Show the ${partners.length} matched partner${partners.length === 1 ? '' : 's'}`;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={isOpen ? panelId : undefined}
        aria-label={label}
        className="inline-flex items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        onTouchStart={() => { isTouchRef.current = true; }}
        onMouseEnter={() => { if (!isTouchRef.current) setIsOpen(true); }}
        onMouseLeave={() => { if (!isTouchRef.current) setIsOpen(false); }}
        onFocus={() => { if (!isTouchRef.current) setIsOpen(true); }}
        onClick={() => {
          setIsOpen((v) => !v);
          if (isTouchRef.current) {
            window.setTimeout(() => { isTouchRef.current = false; }, 400);
          }
        }}
      >
        {children}
      </button>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label={accountName ? `Partners matching ${accountName}` : 'Matched partners'}
            // Starts off-screen and hidden; the layout effect measures it and
            // puts it in place before the first paint the user sees.
            style={{ width: PANEL_WIDTH, top: -9999, left: -9999, visibility: 'hidden' }}
            className="ovrlap-panel fixed z-50 flex flex-col overflow-hidden rounded-lg border border-hairline bg-surface shadow-e3"
          >
            <div className="flex shrink-0 items-center gap-2 border-b border-hairline bg-sunken px-4 py-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-xs bg-accent-soft">
                <Users className="h-3.5 w-3.5 text-accent-ink" aria-hidden="true" />
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.07em] text-ink-2">
                Matched partners
              </span>
              <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-xs bg-accent-soft px-1 text-xs font-bold tabular text-accent-ink">
                {partners.length}
              </span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {partners.map((partner, idx) => {
                const isSuggested = partner.matchType === 'suggested';
                return (
                  <div
                    key={idx}
                    className={`px-4 py-3 ${idx !== partners.length - 1 ? 'border-b border-hairline' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[13px] font-bold leading-tight text-ink">
                            {partner.partnerName}
                          </span>
                          <span className="shrink-0 rounded-xs bg-surface-2 px-1.5 py-0.5 text-xs font-bold uppercase tracking-wide text-ink-2">
                            {partner.partnerRelationshipType}
                          </span>
                        </div>
                        {partner.partnerCompany && (
                          <div className="mt-0.5 truncate text-xs text-ink-3">
                            {partner.partnerCompany}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0">
                        {isSuggested ? (
                          <span className="inline-flex items-center rounded-xs bg-warn-soft px-2 py-1 text-xs font-bold text-warn">
                            Suggested
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-xs bg-ok-soft px-2 py-1 text-xs font-bold text-ok">
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                            Exact
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
