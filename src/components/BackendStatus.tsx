'use client';

import { useEffect, useState } from 'react';
import type { HealthStatus } from '@/lib/health/types';
import { fetchHealth } from '@/lib/health/health.api';

export function BackendStatus() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((e) => setError(e instanceof Error ? e.message : 'Unknown error'));
  }, []);

  if (error) {
    return (
      <div
        className="rounded-lg border border-warn bg-warn-soft p-4 text-warn dark:border-warn dark:bg-warn-bg/30 dark:text-warn"
        data-testid="backend-status-error"
      >
        <p className="font-medium">Backend unavailable</p>
        <p className="text-sm opacity-90">{error}</p>
      </div>
    );
  }

  if (!health) {
    return (
      <div
        className="rounded-lg border border-hairline bg-sunken p-4 dark:border-hairline dark:bg-surface-2/50"
        data-testid="backend-status-loading"
      >
        <p className="text-ink-2 dark:text-ink-3">Checking backend…</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-ok bg-ok-soft p-4 dark:border-ok dark:bg-ok-soft/30"
      data-testid="backend-status-ok"
    >
      <p className="font-medium text-ok dark:text-ok">
        Backend connected
      </p>
      <p className="text-sm text-ok dark:text-ok">
        {health.service} v{health.version}
      </p>
    </div>
  );
}
