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
    connectionId?: string;
    partnerName: string;
    partnerCompany: string | null;
    partnerRelationshipType: PartnerRelationshipType;
    matchConfidence: number;
    theirAccountName: string;
    theirAccountId?: string;
    matchType: MatchType;
  }>;
}

export interface AllPartnersAccountMatchPartner {
  connectionId: string;
  partnerName: string;
  partnerCompany: string | null;
  partnerRole: PartnerRelationshipType;
  partnerRelationshipType: PartnerRelationshipType;
  confidence: number;
  matchConfidence: number;
  theirAccountName: string;
  theirAccountId: string;
  matchType: MatchType;
}

export interface AllPartnersAccountMatchRow {
  yourAccountId: string;
  yourAccountName: string;
  partners: AllPartnersAccountMatchPartner[];
}

export interface ConnectionMatchSummary {
  connectionId: string;
  partnerName: string;
  partnerCompany: string | null;
  partnerRole: PartnerRelationshipType;
  partnerRelationshipType: PartnerRelationshipType;
  matchCount: number;
}

export interface AllMatchesResponse {
  matchesMap: AccountMatchesMap;
  accounts: AllPartnersAccountMatchRow[];
  connectionSummaries: ConnectionMatchSummary[];
}
