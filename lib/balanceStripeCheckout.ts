import { balanceApi } from '@/lib/apiBalance';
import { API_CONFIG } from '@/config/api';

/** Must match backend invoice / pay validation (minor units). */
export const MAX_INVOICE_MINOR_UNITS = 1_000_000;

/** Fiat major → minor integer (e.g. USD: 2 decimals). */
export function fiatMajorToMinor(major: number, decimals = 2): number {
  return Math.round(major * 10 ** decimals + Number.EPSILON);
}

function getLocalePrefix(): string {
  if (typeof window === 'undefined' || typeof window.location?.pathname !== 'string') {
    return '';
  }
  return /^\/(uk|en|fr|es|ru)(\/|$)/.test(window.location.pathname)
    ? window.location.pathname.slice(0, 3)
    : '';
}

function majorToMinorForCap(major: number, decimals: number): number {
  return Math.round(major * 10 ** decimals + Number.EPSILON);
}

/**
 * Hosted Stripe Checkout: create invoice + pay → redirect to Stripe (no publishable key on client).
 * `amount` on POST /balance/invoices is in major units (e.g. 100 USD), same as Payment Intent examples.
 * Client caps by converting to minor and ensuring ≤ 1_000_000 minor units.
 */
export async function redirectToBalanceStripeCheckout(options: {
  amountMajor: number;
  currency: string;
  decimals: number;
  description?: string;
}): Promise<void> {
  const { amountMajor, currency, decimals, description = 'Balance top-up' } = options;
  if (!Number.isFinite(amountMajor) || amountMajor <= 0) {
    throw new Error('Invalid amount');
  }
  const minor = majorToMinorForCap(amountMajor, decimals);
  if (minor > MAX_INVOICE_MINOR_UNITS) {
    throw new Error('Invalid amount');
  }
  const currencyNormalized = (currency?.trim() || 'USD').toUpperCase();
  const localePrefix = getLocalePrefix();
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const successUrl = `${baseUrl}${localePrefix}/balance/success`;
  const cancelUrl = `${baseUrl}${localePrefix}/balance/cancel`;

  const invoicePayload = {
    amount: amountMajor,
    currency: currencyNormalized,
    paymentMethod: 'STRIPE',
    paymentDetails: { successUrl, cancelUrl },
    description
  };

  const res = await balanceApi.createInvoice(invoicePayload);
  const invoiceData = res?.data as Record<string, unknown> | undefined;
  const invoiceId = invoiceData?.invoice_id as string | undefined;
  if (!invoiceId) {
    throw new Error('No invoice_id in response');
  }

  const payRes = await balanceApi.payInvoice(invoiceId, {
    paymentMethod: 'STRIPE',
    paymentDetails: { successUrl, cancelUrl }
  });

  const payData = payRes?.data as Record<string, unknown> | undefined;
  let redirectUrl =
    (payData?.checkoutUrl as string) ??
    (payData?.url as string) ??
    (payData?.checkout_url as string) ??
    (payData?.redirect_url as string) ??
    (payData?.paymentUrl as string) ??
    (payData?.sessionUrl as string) ??
    (payData?.payment_url as string);

  if (redirectUrl && typeof window !== 'undefined') {
    if (redirectUrl.startsWith('/')) {
      redirectUrl = `${API_CONFIG.BASE_URL.replace(/\/$/, '')}${redirectUrl}`;
    }
    window.location.href = redirectUrl;
    return;
  }

  throw new Error('No checkout URL returned by payment API');
}
