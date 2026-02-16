export interface Match {
  accountName: string;
  yourAccountId: string;
  theirAccountId: string;
  type: string | null;
  theirType: string | null;
  matchConfidence: number;
}

export interface AccountMatchesMap {
  [accountId: string]: Array<{ partnerName: string; partnerCompany: string | null }>;
}
