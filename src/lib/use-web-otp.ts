'use client';

import { useEffect, useRef } from 'react';
import { subscribeToWebOtp } from './web-otp';

interface UseWebOtpCodeOptions {
  /**
   * Subscribe only while true.
   *
   * Callers pass false once the field holds a full code, so a wrong-code
   * response that re-enables the field does not re-attach a listener and
   * overwrite what the user has already typed.
   */
  enabled: boolean;
  onCode: (code: string) => void;
}

/**
 * Receive a code that WebOTP has collected.
 *
 * This only listens. Arming happens at the request sites — see web-otp.ts —
 * because the message can arrive before this component exists.
 */
export function useWebOtpCode({ enabled, onCode }: UseWebOtpCodeOptions): void {
  // Held in a ref so changing the handler does not resubscribe mid-flight.
  const onCodeRef = useRef(onCode);
  useEffect(() => {
    onCodeRef.current = onCode;
  }, [onCode]);

  useEffect(() => {
    if (!enabled) return;
    return subscribeToWebOtp((code) => onCodeRef.current(code));
  }, [enabled]);
}
