import { api } from '@/lib/axios';
import type {
  Invite,
  InviteValidation,
  SendInviteDto,
  SendInviteResponse,
  AcceptInviteResponse,
} from './types';

export const invitesApi = {
  send: (data: SendInviteDto) =>
    api.post<SendInviteResponse>('/invites', data),

  getAll: () =>
    api.get<Invite[]>('/invites'),

  revoke: (id: string) =>
    api.delete(`/invites/${id}`),

  validate: (token: string) =>
    api.get<InviteValidation>(`/invites/validate/${token}`),

  accept: (token: string) =>
    api.post<AcceptInviteResponse>(`/invites/accept/${token}`),
};
