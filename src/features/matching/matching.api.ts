import { api } from '@/lib/axios';
import type { Match, AccountMatchesMap } from './types';

export const matchingApi = {
  getMatches: (connectionId: string) =>
    api.get<Match[]>(`/matching/connections/${connectionId}`),
  getAllMatches: () => api.get<AccountMatchesMap>('/matching/all-matches'),
};
