const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface HealthStatus {
  status: 'ok';
  service: string;
  timestamp: string;
  version: string;
}

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`, {
    next: { revalidate: 10 },
  });
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}
