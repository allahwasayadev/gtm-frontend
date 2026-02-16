export interface Invite {
  id: string;
  invitedEmail: string;
  invitedName: string | null;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
}

export interface InviteValidation {
  valid: boolean;
  status: string;
  inviterName?: string;
  inviterCompany?: string | null;
  invitedEmail?: string;
  message?: string;
}

export interface SendInviteDto {
  email: string;
  name?: string;
}

export interface SendInviteResponse {
  alreadyUser?: boolean;
  alreadyConnected?: boolean;
  alreadyInvited?: boolean;
  invite?: Invite;
  connection?: unknown;
  message: string;
}

export interface AcceptInviteResponse {
  message: string;
  inviterName: string;
  inviterCompany: string | null;
}
