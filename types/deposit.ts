/**
 * Balance deposit: CryptAPI (Stripe Checkout uses invoice flow in lib/balanceStripeCheckout.ts).
 */

/** GET /balance/deposit/cryptapi/networks */
export interface CryptapiTickerInfo {
  ticker: string;
  label: string;
  targetCurrency: string;
  targetCurrencyLabel: string;
}

export interface CryptapiNetworkInfo {
  chain: string;
  chainLabel: string;
  tickers: CryptapiTickerInfo[];
}

export type CryptapiNetworksResponse = {
  status: number;
  data: CryptapiNetworkInfo[];
};

/** GET /balance/deposit/cryptapi/wallet?ticker= */
export interface CryptapiWalletData {
  deposit_address: string;
  network: string;
  target_currency: string;
  base_ticker?: string;
  min_amount_usd?: number;
  wallet_id?: number;
  qr_code_url?: string;
  requires_action?: boolean;
  message?: string;
}

export type CryptapiWalletResponse = {
  status: number;
  data: CryptapiWalletData;
  message?: string;
};
