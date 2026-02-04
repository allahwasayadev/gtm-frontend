import type { User } from '../auth/types';

export interface Connection {
  id: string;
  status: string;
  createdAt: string;
  otherUser: User;
  isSender: boolean;
}

export interface CreateConnectionDto {
  receiverEmail: string;
}
