import { api } from '@/lib/axios';
import type { Match } from './types';

export const matchingApi = {
  getMatches: (connectionId: string) =>
    api.get<Match[]>(`/matching/connections/${connectionId}`),
};
