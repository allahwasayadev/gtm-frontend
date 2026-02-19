export type PartnerRelationshipType = 'OEM' | 'RESELLER';
export type MatchType = 'exact' | 'auto' | 'suggested' | 'accepted';

export interface Match {
  accountName: string;
  yourAccountName: string;
  theirAccountName: string;
  yourAccountId: string;
  theirAccountId: string;
  matchConfidence: number;
  matchType: MatchType;
}

export interface ConnectionMatchesResponse {
  resolved: Match[];
  suggested: Match[];
}

export interface SetMatchDecisionDto {
  yourAccountId: string;
  theirAccountId: string;
  decision: 'accepted' | 'rejected';
}

export interface AccountMatchesMap {
  [accountId: string]: Array<{
    partnerName: string;
    partnerCompany: string | null;
    partnerRelationshipType: PartnerRelationshipType;
    matchConfidence: number;
    theirAccountName: string;
    matchType: MatchType;
  }>;
}
