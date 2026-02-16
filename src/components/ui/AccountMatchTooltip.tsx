'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface AccountMatchTooltipProps {
  children: React.ReactNode;
  partners: Array<{ partnerName: string; partnerCompany: string | null }>;
}

export function AccountMatchTooltip({
  children,
  partners,
}: AccountMatchTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showBelow, setShowBelow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // If there's less than 80px above, show tooltip below instead
    setShowBelow(rect.top < 80);
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
      <div className="cursor-pointer underline decoration-dotted decoration-indigo-400 underline-offset-2">
        {children}
      </div>
      {isVisible && (
        <div
          className={`absolute z-50 left-0 ${
            showBelow ? 'top-full mt-2' : 'bottom-full mb-2'
          }`}
        >
          <div className="bg-gray-900 text-white rounded-lg shadow-xl px-3 py-2.5 text-sm max-w-[280px] sm:max-w-none sm:whitespace-nowrap">
            <div className="text-xs text-gray-400 font-medium mb-1.5">
              Matched Reps
            </div>
            {partners.map((partner, idx) => (
              <div key={idx} className="flex items-center gap-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className="font-medium">
                  {partner.partnerName}
                  {partner.partnerCompany && (
                    <span className="text-gray-400 font-normal"> – {partner.partnerCompany}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
          {/* Arrow */}
          <div
            className={`absolute left-4 ${
              showBelow ? 'bottom-full -mb-1' : 'top-full -mt-1'
            }`}
          >
            <div className="w-2 h-2 bg-gray-900 transform rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}
