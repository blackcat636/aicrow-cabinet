/**
 * Parse subscription action responses (purchase, convert trial, upgrade, renew, invoice create).
 * Backend may use camelCase or snake_case.
 */

export type SubscriptionRequiresPaymentPayload = {
  invoiceId: string;
  amount: number;
  currency: string;
  paymentMethods: string[];
};

export type ParsedSubscriptionAction =
  | { kind: 'requires_payment'; payload: SubscriptionRequiresPaymentPayload }
  | { kind: 'completed'; data: unknown };

function toUpperList(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => String(x).trim().toUpperCase()).filter(Boolean);
}

export function parseSubscriptionActionData(data: unknown): ParsedSubscriptionAction {
  if (!data || typeof data !== 'object') {
    return { kind: 'completed', data };
  }
  const o = data as Record<string, unknown>;
  const requiresPayment = o.requiresPayment === true || o.requires_payment === true;
  const invoiceId =
    typeof o.invoiceId === 'string'
      ? o.invoiceId
      : typeof o.invoice_id === 'string'
        ? o.invoice_id
        : undefined;

  if (requiresPayment && invoiceId) {
    const pmRaw = o.paymentMethods ?? o.payment_methods;
    let paymentMethods = toUpperList(pmRaw);
    if (paymentMethods.length === 0) {
      paymentMethods = ['STRIPE', 'CRYPTAPI'];
    }
    const amount =
      typeof o.amount === 'number' && !Number.isNaN(o.amount)
        ? o.amount
        : Number(o.amount) || 0;
    const currency =
      typeof o.currency === 'string' && o.currency.trim()
        ? o.currency.trim()
        : 'USD';

    return {
      kind: 'requires_payment',
      payload: { invoiceId, amount, currency, paymentMethods }
    };
  }

  return { kind: 'completed', data };
}

/** Normalize invoice status from GET /balance/invoices/:id (or nested data). */
export function normalizeBalanceInvoiceStatus(
  data: Record<string, unknown> | undefined | null
): string {
  if (!data) return '';
  const s = data.status ?? data.invoice_status ?? data.invoiceStatus;
  return String(s ?? '')
    .trim()
    .toUpperCase();
}
