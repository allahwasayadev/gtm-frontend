export interface Match {
  accountName: string;
  yourAccountName: string;
  theirAccountName: string;
  yourAccountId: string;
  theirAccountId: string;
  matchConfidence: number;
}

export interface AccountMatchesMap {
  [accountId: string]: Array<{
    partnerName: string;
    partnerCompany: string | null;
    matchConfidence: number;
    theirAccountName: string;
  }>;
}
