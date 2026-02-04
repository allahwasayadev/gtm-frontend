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
        className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
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
        className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
        data-testid="backend-status-loading"
      >
        <p className="text-zinc-600 dark:text-zinc-400">Checking backend…</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30"
      data-testid="backend-status-ok"
    >
      <p className="font-medium text-emerald-800 dark:text-emerald-200">
        Backend connected
      </p>
      <p className="text-sm text-emerald-700 dark:text-emerald-300">
        {health.service} v{health.version}
      </p>
    </div>
  );
}
