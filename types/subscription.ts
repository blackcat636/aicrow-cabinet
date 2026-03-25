/**
 * Subscription plan feature from API (array of objects).
 */
export interface PlanFeature {
  id?: number;
  name?: string;
  key?: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * Subscription plan (available for purchase).
 */
export interface SubscriptionPlan {
  id: number;
  name: string;
  description?: string;
  price: number;
  currency: string;
  period: 'monthly' | 'yearly' | string;
  durationDays: number;
  trialDays?: number;
  isActive: boolean;
  isDefault: boolean;
  features: PlanFeature[];
  /** Token limit for display (e.g. 5000). May come from plan or usage. */
  tokenLimit?: number;
}

/**
 * User's subscription record (my active plan).
 */
export interface UserPlan {
  id: number;
  userId: number;
  planId: number;
  isTrial: boolean;
  trialEndDate?: string;
  paymentStatus: string;
  isActive: boolean;
  endDate?: string;
  /** Remaining tokens from usage/entitlements */
  tokensLeft?: number;
}

/**
 * Plan object as returned inside active subscription (API may use string for price).
 */
export interface PlanInActiveResponse {
  id: number;
  name: string;
  description?: string;
  price: string | number;
  period: string;
  currency: string;
  isActive: boolean;
  isDefault: boolean;
  durationDays: number;
  trialDays?: number;
  metadata?: unknown;
  createdAt?: string;
  updatedAt?: string;
  features: PlanFeature[];
}

/**
 * Flat active subscription (GET /subscription-plans/my/active).
 * API returns subscription fields at top level of data, with nested plan.
 */
export interface ActiveSubscriptionData {
  id: number;
  userId: number;
  planId: number;
  plan: PlanInActiveResponse;
  startDate?: string;
  endDate?: string | null;
  isActive: boolean;
  isAutoRenew?: boolean;
  paymentStatus: string;
  isTrial: boolean;
  trialEndDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  tokensLeft?: number;
}

/**
 * Active plan API response (GET /subscription-plans/my/active).
 */
export interface ActivePlanResponse {
  status: number;
  data: ActiveSubscriptionData;
}

/**
 * Available plans list API response (GET /subscription-plans).
 */
export interface AvailablePlansResponse {
  status: number;
  data: SubscriptionPlan[];
}

/**
 * Purchase API request body.
 */
export interface PurchasePlanRequest {
  useTrial?: boolean;
}

/**
 * Purchase API response (POST /subscription-plans/:id/purchase).
 */
export interface PurchasePlanResponse {
  status: number;
  data: {
    userPlan: UserPlan;
    plan: { id: number; name: string };
    isTrial?: boolean;
  };
  message?: string;
}

/**
 * Stripe Checkout Session response (POST /subscription-plans/:id/checkout).
 */
export interface CheckoutSessionResponse {
  status: number;
  data: {
    checkoutUrl: string;
  };
  message?: string;
}

/**
 * Request body for creating Stripe Checkout Session.
 */
export interface CreateCheckoutSessionRequest {
  useTrial?: boolean;
  successUrl?: string;
  cancelUrl?: string;
}

/** POST /subscription-plans/invoice body (alternative invoice creation). */
export type SubscriptionInvoiceAction =
  | 'purchase'
  | 'convert_trial'
  | 'upgrade'
  | 'renew';

export interface CreateSubscriptionInvoiceRequest {
  action: SubscriptionInvoiceAction;
  planId?: number;
  userPlanId?: number;
}

/** GET /subscription-plans/invoice/:invoiceId/cryptapi-address response data. */
export interface SubscriptionInvoiceCryptapiAddressData {
  deposit_address: string;
  qr_code_url?: string;
  amount?: string | number;
  target_currency?: string;
  min_amount_usd?: number;
  network?: string;
  message?: string;
}

export type SubscriptionInvoiceCryptapiAddressResponse = {
  status: number;
  data: SubscriptionInvoiceCryptapiAddressData;
  message?: string;
};

/**
 * Result of subscription actions that may require invoice payment.
 */
export type SubscriptionPurchaseResult =
  | {
      outcome: 'payment_required';
      invoiceId: string;
      amount: number;
      currency: string;
      paymentMethods: string[];
    }
  | {
      outcome: 'completed';
      status: number;
      data: unknown;
      message?: string;
    };
