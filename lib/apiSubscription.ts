import {
  AvailablePlansResponse,
  ActivePlanResponse,
  PurchasePlanRequest,
  CheckoutSessionResponse,
  CreateCheckoutSessionRequest,
  type CreateSubscriptionInvoiceRequest,
  type SubscriptionInvoiceCryptapiAddressResponse,
  type SubscriptionPurchaseResult
} from '@/types/subscription';
import { parseSubscriptionActionData } from '@/lib/subscriptionPaymentParse';
import { API_CONFIG } from '@/config/api';
import { fetchWithAuth } from '@/lib/auth';

const API_BASE_URL = API_CONFIG.BASE_URL;
const ENDPOINTS = API_CONFIG.ENDPOINTS.SUBSCRIPTION;

const getJsonMessage = async (response: Response): Promise<string> => {
  try {
    const raw = await response.text();
    const text = raw.trim();
    if (!text) return response.statusText || `Error ${response.status}`;
    try {
      const errorData = JSON.parse(text) as Record<string, unknown>;
      const message =
        typeof errorData.message === 'string'
          ? errorData.message
          : typeof (errorData as { error?: string }).error === 'string'
            ? (errorData as { error: string }).error
            : Array.isArray(errorData.errors) && errorData.errors[0] != null && typeof (errorData.errors[0] as { message?: string }).message === 'string'
              ? (errorData.errors[0] as { message: string }).message
              : errorData.data != null && typeof (errorData.data as { message?: string }).message === 'string'
                ? (errorData.data as { message: string }).message
                : null;
      if (message) return message;
    } catch {
      // not JSON
    }
    return text.length > 200 ? `${text.slice(0, 200)}…` : text;
  } catch {
    return response.statusText || `Error ${response.status}`;
  }
};

function toSubscriptionPurchaseResult(json: {
  status: number;
  data?: unknown;
  message?: string;
}): SubscriptionPurchaseResult {
  const parsed = parseSubscriptionActionData(json.data);
  if (parsed.kind === 'requires_payment') {
    const p = parsed.payload;
    return {
      outcome: 'payment_required',
      invoiceId: p.invoiceId,
      amount: p.amount,
      currency: p.currency,
      paymentMethods: p.paymentMethods
    };
  }
  return {
    outcome: 'completed',
    status: json.status,
    data: json.data,
    message: json.message
  };
}

export const subscriptionApi = {
  /** GET /subscription-plans — available plans (non-default, active). */
  getAvailablePlans: async (): Promise<AvailablePlansResponse> => {
    const url = `${API_BASE_URL}${ENDPOINTS.PLANS}`;
    const response = await fetchWithAuth(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorMessage = await getJsonMessage(response);
      const error = new Error(errorMessage || 'Failed to load plans');
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    const data = (await response.json()) as AvailablePlansResponse;
    return data;
  },

  /** GET /subscription-plans/my/active — current active subscription.
   * API returns 404 + { status: 404, message: "No active subscription found" } when user has no active plan;
   * we treat that as success and return null (UI shows "Expired / Inactive" + select plan CTA). */
  getMyActivePlan: async (): Promise<ActivePlanResponse['data'] | null> => {
    const url = `${API_BASE_URL}${ENDPOINTS.MY_ACTIVE}`;
    const response = await fetchWithAuth(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorMessage = await getJsonMessage(response);
      const error = new Error(errorMessage || 'Failed to load active plan');
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    const result = (await response.json()) as ActivePlanResponse;
    return result.data ?? null;
  },

  /** POST /subscription-plans/:id/checkout — create Stripe Checkout Session, returns checkoutUrl for redirect. */
  createCheckoutSession: async (
    planId: number,
    body: CreateCheckoutSessionRequest = {}
  ): Promise<CheckoutSessionResponse> => {
    const url = `${API_BASE_URL}${ENDPOINTS.CHECKOUT(planId)}`;
    const response = await fetchWithAuth(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorMessage = await getJsonMessage(response);
      const fallback = `Failed to create checkout session (${response.status})`;
      const error = new Error(errorMessage || fallback);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    return (await response.json()) as CheckoutSessionResponse;
  },

  /** POST /subscription-plans/:id/purchase — purchase a plan (optional useTrial). */
  purchasePlan: async (
    planId: number,
    body: PurchasePlanRequest = {}
  ): Promise<SubscriptionPurchaseResult> => {
    const url = `${API_BASE_URL}${ENDPOINTS.PURCHASE(planId)}`;
    const response = await fetchWithAuth(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const json = (await response.json()) as {
      status: number;
      data?: unknown;
      message?: string;
    };

    if (!response.ok) {
      const errorMessage =
        (typeof json.message === 'string' && json.message) ||
        `Failed to purchase plan (${response.status})`;
      const error = new Error(errorMessage);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    return toSubscriptionPurchaseResult(json);
  },

  /** POST /subscription-plans/trial/:userPlanId/convert — convert trial to paid. */
  convertTrialToPaid: async (
    userPlanId: number
  ): Promise<SubscriptionPurchaseResult> => {
    const url = `${API_BASE_URL}${ENDPOINTS.TRIAL_CONVERT(userPlanId)}`;
    const response = await fetchWithAuth(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const json = (await response.json()) as {
      status: number;
      data?: unknown;
      message?: string;
    };

    if (!response.ok) {
      const errorMessage =
        (typeof json.message === 'string' && json.message) ||
        'Failed to convert trial to paid';
      const error = new Error(errorMessage);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    return toSubscriptionPurchaseResult(json);
  },

  /** POST /subscription-plans/:planId/upgrade */
  upgradePlan: async (planId: number): Promise<SubscriptionPurchaseResult> => {
    const url = `${API_BASE_URL}${ENDPOINTS.UPGRADE(planId)}`;
    const response = await fetchWithAuth(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const json = (await response.json()) as {
      status: number;
      data?: unknown;
      message?: string;
    };

    if (!response.ok) {
      const errorMessage =
        (typeof json.message === 'string' && json.message) ||
        'Failed to upgrade plan';
      const error = new Error(errorMessage);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    return toSubscriptionPurchaseResult(json);
  },

  /** POST /subscription-plans/renew/:userPlanId */
  renewPlan: async (
    userPlanId: number
  ): Promise<SubscriptionPurchaseResult> => {
    const url = `${API_BASE_URL}${ENDPOINTS.RENEW(userPlanId)}`;
    const response = await fetchWithAuth(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const json = (await response.json()) as {
      status: number;
      data?: unknown;
      message?: string;
    };

    if (!response.ok) {
      const errorMessage =
        (typeof json.message === 'string' && json.message) ||
        'Failed to renew subscription';
      const error = new Error(errorMessage);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    return toSubscriptionPurchaseResult(json);
  },

  /** POST /subscription-plans/invoice — create subscription invoice by action. */
  createSubscriptionInvoice: async (
    body: CreateSubscriptionInvoiceRequest
  ): Promise<SubscriptionPurchaseResult> => {
    const url = `${API_BASE_URL}${ENDPOINTS.INVOICE}`;
    const response = await fetchWithAuth(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const json = (await response.json()) as {
      status: number;
      data?: unknown;
      message?: string;
    };

    if (!response.ok) {
      const errorMessage =
        (typeof json.message === 'string' && json.message) ||
        'Failed to create subscription invoice';
      const error = new Error(errorMessage);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    return toSubscriptionPurchaseResult(json);
  },

  /** GET /subscription-plans/invoice/:invoiceId */
  getSubscriptionInvoice: async (
    invoiceId: string
  ): Promise<{ status: number; data: Record<string, unknown>; message?: string }> => {
    const url = `${API_BASE_URL}${ENDPOINTS.INVOICE_BY_ID(invoiceId)}`;
    const response = await fetchWithAuth(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorMessage = await getJsonMessage(response);
      const error = new Error(errorMessage || 'Failed to load subscription invoice');
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    return (await response.json()) as {
      status: number;
      data: Record<string, unknown>;
      message?: string;
    };
  },

  /** GET /subscription-plans/invoice/:invoiceId/cryptapi-address?ticker= */
  getSubscriptionInvoiceCryptapiAddress: async (
    invoiceId: string,
    ticker: string
  ): Promise<SubscriptionInvoiceCryptapiAddressResponse> => {
    const params = new URLSearchParams({ ticker });
    const url = `${API_BASE_URL}${ENDPOINTS.INVOICE_CRYPTAPI_ADDRESS(invoiceId)}?${params.toString()}`;
    const response = await fetchWithAuth(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorMessage = await getJsonMessage(response);
      const error = new Error(errorMessage || 'Failed to load crypto deposit address');
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    return (await response.json()) as SubscriptionInvoiceCryptapiAddressResponse;
  }
};
