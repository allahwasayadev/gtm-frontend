'use client';

import { useState, useRef, useEffect } from 'react';

interface AccountMatchTooltipProps {
  children: React.ReactNode;
  partners: Array<{ partnerName: string }>;
}

export function AccountMatchTooltip({
  children,
  partners,
}: AccountMatchTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible((v) => !v)}
    >
      <div className="cursor-pointer underline decoration-dotted decoration-indigo-400 underline-offset-2">
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-50 left-0 bottom-full mb-2">
          <div className="bg-gray-900 text-white rounded-lg shadow-xl px-3 py-2.5 text-sm whitespace-nowrap">
            <div className="text-xs text-gray-400 font-medium mb-1.5">
              Matched Partners
            </div>
            {partners.map((partner, idx) => (
              <div key={idx} className="flex items-center gap-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className="font-medium">{partner.partnerName}</span>
              </div>
            ))}
          </div>
          <div className="absolute left-4 top-full -mt-1">
            <div className="w-2 h-2 bg-gray-900 transform rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}
