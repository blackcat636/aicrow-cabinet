import { balanceApi } from '@/lib/apiBalance';
import { normalizeBalanceInvoiceStatus } from '@/lib/subscriptionPaymentParse';

export type TerminalInvoiceStatus = 'PAID' | 'EXPIRED' | 'CANCELLED';

export type InvoiceStatusPoll = TerminalInvoiceStatus | 'PENDING';

/** Single GET /balance/invoices/:id — returns terminal status or PENDING. */
export async function fetchBalanceInvoiceStatusOnce(
  invoiceId: string
): Promise<InvoiceStatusPoll> {
  const res = await balanceApi.getInvoice(invoiceId);
  const data = res.data as Record<string, unknown> | undefined;
  const st = normalizeBalanceInvoiceStatus(data);

  if (st === 'PAID') return 'PAID';
  if (st === 'EXPIRED') return 'EXPIRED';
  if (st === 'CANCELLED') return 'CANCELLED';
  return 'PENDING';
}

/**
 * Poll GET /balance/invoices/:invoiceId until PAID, EXPIRED, CANCELLED, or timeout.
 * Default: check every 30s (less load than frequent polling).
 */
export async function pollBalanceInvoiceUntilTerminal(
  invoiceId: string,
  options?: { intervalMs?: number; maxMs?: number }
): Promise<TerminalInvoiceStatus> {
  const intervalMs = options?.intervalMs ?? 30_000;
  const maxMs = options?.maxMs ?? 1_800_000;
  const deadline = Date.now() + maxMs;

  while (Date.now() < deadline) {
    const result = await fetchBalanceInvoiceStatusOnce(invoiceId);

    if (result === 'PAID') return 'PAID';
    if (result === 'EXPIRED') return 'EXPIRED';
    if (result === 'CANCELLED') return 'CANCELLED';

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error('POLL_TIMEOUT');
}
