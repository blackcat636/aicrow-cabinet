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

// Transaction Types
export interface TransactionMetadata {
  timestamp?: string;
  admin_email?: string;
  deposit_type?: string;
  admin_user_id?: number;
  admin_username?: string;
  [key: string]: any;
}

export interface Transaction {
  id: number;
  amount: string;
  currency: Currency;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'FEE' | string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | string;
  balance_before: string;
  balance_after: string;
  description: string;
  reference_id: string | null;
  metadata: TransactionMetadata | null;
  fee_amount: string | null;
  created_at: string;
}

export interface TransactionResponse {
  status: number;
  data: Transaction | Transaction[];
}