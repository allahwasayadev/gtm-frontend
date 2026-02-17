'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Users, CheckCircle2 } from 'lucide-react';

interface PartnerMatch {
  partnerName: string;
  partnerCompany: string | null;
  matchConfidence?: number;
  theirAccountName?: string;
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
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; below: boolean }>({ top: 0, left: 0, below: false });
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const below = rect.top < 140;
    setTooltipPos({
      top: below ? rect.bottom + 10 : rect.top - 10,
      left: rect.left,
      below,
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

  if (!partners || partners.length === 0) {
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
      <div className="cursor-pointer underline decoration-dotted decoration-indigo-300/60 underline-offset-4 hover:decoration-indigo-400 transition-colors">
        {children}
      </div>
      {isVisible && (
        <div
          className="fixed z-50 animate-in fade-in-0 zoom-in-95 duration-150"
          style={{
            top: tooltipPos.below ? tooltipPos.top : undefined,
            bottom: tooltipPos.below ? undefined : `calc(100vh - ${tooltipPos.top}px)`,
            left: tooltipPos.left,
          }}
        >
          <div className="rounded-xl shadow-lg ring-1 ring-slate-200/60 text-sm max-w-75 sm:max-w-none overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-linear-to-r from-slate-800 to-slate-700">
              <div className="w-6 h-6 bg-emerald-500/20 rounded-md flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-emerald-300" />
              </div>
              <span className="text-xs font-semibold text-slate-200 tracking-wide uppercase">
                Matched Partners
              </span>
              <span className="ml-auto inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                {partners.length}
              </span>
            </div>
            {/* Partner List */}
            <div className="bg-white px-4 py-3 space-y-3">
              {partners.map((partner, idx) => {
                const isExact = !partner.matchConfidence || partner.matchConfidence >= 1.0;
                return (
                  <div key={idx} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-linear-to-br from-emerald-400 to-emerald-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm shadow-emerald-500/15 mt-0.5">
                      {partner.partnerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 text-sm truncate">
                          {partner.partnerName}
                        </span>
                        {isExact ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-semibold ring-1 ring-emerald-200/60 shrink-0">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Exact
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-semibold ring-1 ring-amber-200/60 shrink-0">
                            ~{Math.round(partner.matchConfidence! * 100)}%
                          </span>
                        )}
                      </div>
                      {partner.partnerCompany && (
                        <div className="text-[11px] text-slate-400 truncate">
                          {partner.partnerCompany}
                        </div>
                      )}
                      {!isExact && partner.theirAccountName && (
                        <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-50 text-[10px] text-slate-500 ring-1 ring-slate-100">
                          Their name: <span className="font-medium text-slate-700">{partner.theirAccountName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Arrow */}
          <div
            className={`absolute left-5 ${
              tooltipPos.below ? 'bottom-full -mb-1.25' : 'top-full -mt-1.25'
            }`}
          >
            <div className={`w-2.5 h-2.5 ring-1 ring-slate-200/60 transform rotate-45 ${tooltipPos.below ? 'bg-slate-800' : 'bg-white'}`} />
          </div>
        </div>
      )}
    </div>
  );
}
