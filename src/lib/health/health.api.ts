import { api } from '../axios';
import type { HealthStatus } from './types';

export async function fetchHealth(): Promise<HealthStatus> {
  const response = await api.get<HealthStatus>('/health');
  return response.data;
}
