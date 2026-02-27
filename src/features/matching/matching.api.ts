import { api } from '@/lib/axios';
import type {
  AllMatchesResponse,
  ConnectionMatchesResponse,
  SetMatchDecisionDto,
} from './types';

export const matchingApi = {
  getMatches: (connectionId: string) =>
    api.get<ConnectionMatchesResponse>(`/matching/connections/${connectionId}`),
  getAllMatches: () => api.get<AllMatchesResponse>('/matching/all-matches'),
  setMatchDecision: (connectionId: string, payload: SetMatchDecisionDto) =>
    api.post(`/matching/connections/${connectionId}/decisions`, payload),
};
