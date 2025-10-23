// Balance Types

export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  precision: string;
  is_crypto: boolean;
  is_virtual: boolean;
  exchange_rate_to_usd: string;
  icon_url: string;
  description: string;
}

export interface BalanceData {
  currency: Currency;
  balance: number;
  frozen_balance: number;
  available_balance: number;
  total_deposited: number;
  total_withdrawn: number;
}

export interface BalanceResponse {
  status: number;
  data: BalanceData[];
}

export interface BalanceStats {
  totalBalance: number;
  totalFrozen: number;
  totalAvailable: number;
  totalDeposited: number;
  totalWithdrawn: number;
  currencies: BalanceData[];
}
