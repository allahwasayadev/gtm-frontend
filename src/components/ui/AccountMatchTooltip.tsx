'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
}

export function AccountMatchTooltip({
  children,
  partners,
}: AccountMatchTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; below: boolean; positionRight: boolean; }>({ top: 0, left: 0, below: false, positionRight: false });
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const tooltipWidth = 288; // w-72 = 18rem = 288px

    let left = rect.left + rect.width / 2 - tooltipWidth / 2;

    if (left < 10) left = 10;
    if (left + tooltipWidth > window.innerWidth - 10) {
      left = window.innerWidth - tooltipWidth - 10;
    }

    const below = rect.top < 200;

    setTooltipPos({
      top: below ? rect.bottom + 10 : rect.top - 10,
      left,
      below,
      positionRight: false,
    });
  }, []);

  // Close tooltip when tapping outside (mobile)
  useEffect(() => {
    if (!isVisible) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsVisible(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isVisible]);

  const confirmedPartners = partners.filter(
    (p) => p.matchType !== 'suggested'
  );
  if (!confirmedPartners || confirmedPartners.length === 0) {
    return <>{children}</>;
  }

  const handleShow = () => {
    updatePosition();
    setIsVisible(true);
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleShow}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => {
        if (!isVisible) {
          updatePosition();
        }
        setIsVisible((v) => !v);
      }}
    >
      <div className="cursor-pointer">{children}</div>
      {isVisible && (
        <div
          className="fixed z-50 animate-in fade-in-0 zoom-in-95 duration-150"
          style={{
            top: tooltipPos.below ? tooltipPos.top : undefined,
            bottom: tooltipPos.below
              ? undefined
              : `calc(100vh - ${tooltipPos.top}px)`,
            left: tooltipPos.left,
          }}
        >
          <div className="rounded-xl shadow-lg ring-1 ring-slate-200/60 text-sm w-72 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-linear-to-r from-slate-800 to-slate-700">
              <div className="w-6 h-6 bg-emerald-500/20 rounded-md flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-emerald-300" />
              </div>
              <span className="text-xs font-semibold text-slate-200 tracking-wide uppercase">
                Matched Partners
              </span>
              <span className="ml-auto inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                {confirmedPartners.length}
              </span>
            </div>
            <div className="bg-white">
              {confirmedPartners.map((partner, idx) => {
                const matchType = partner.matchType;
                const isExact = matchType === 'exact' || matchType === 'accepted';
                const isAuto = matchType === 'auto';

                return (
                  <div
                    key={idx}
                    className={`px-4 py-3 ${idx !== confirmedPartners.length - 1 ? 'border-b border-slate-100' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 text-[13px] leading-tight truncate">
                            {partner.partnerName}
                          </span>
                          <span className="text-[9px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0">
                            {partner.partnerRelationshipType}
                          </span>
                        </div>
                        {partner.partnerCompany && (
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                            {partner.partnerCompany}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0">
                        {isExact ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            Exact
                          </span>
                        ) : isAuto ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-sky-50 text-sky-600 text-[10px] font-semibold">
                            Auto
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            Exact
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div
            className={`absolute left-1/2 -translate-x-1/2 ${
              tooltipPos.below ? '-top-1.5' : '-bottom-1.5'
            }`}
          >
            <div
              className={`w-3 h-3 ring-1 ring-slate-200/60 transform rotate-45 ${tooltipPos.below ? 'bg-slate-800' : 'bg-white'}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
