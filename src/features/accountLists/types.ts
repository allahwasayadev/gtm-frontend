export interface Account {
  id: string;
  accountName: string;
}

export interface AccountList {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  accounts?: Account[];
  _count?: { accounts: number };
}

export interface UpdateAccountsDto {
  accounts: Array<{ accountName: string }>;
}
