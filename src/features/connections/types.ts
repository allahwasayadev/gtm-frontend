import type { User } from '../auth/types';

export interface Connection {
  id: string;
  status: string;
  createdAt: string;
  isMuted: boolean;
  otherUser: User;
  isSender: boolean;
}

export interface CreateConnectionDto {
  receiverEmail: string;
}
