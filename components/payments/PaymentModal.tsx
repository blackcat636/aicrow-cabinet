'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { balanceApi } from '@/lib/apiBalance';
import { subscriptionApi } from '@/lib/apiSubscription';
import { API_CONFIG } from '@/config/api';
import { MAX_INVOICE_MINOR_UNITS } from '@/lib/balanceStripeCheckout';
import { useAuth } from '@/contexts/AuthContext';
import { BalanceDepositStripeCardForm } from '@/components/balance/BalanceDepositStripeCardForm';
import { CryptoPaymentPanel } from '@/components/payments/CryptoPaymentPanel';
import { fetchBalanceInvoiceStatusOnce } from '@/lib/pollBalanceInvoice';
import type { BalanceData } from '@/types/balance';
import type { CryptapiNetworkInfo, CryptapiTickerInfo } from '@/types/deposit';

/** Supported fiat for POST /balance/payment-methods/stripe/create-payment-intent */
const STRIPE_FIAT_CODES = ['USD', 'UAH', 'EUR', 'GBP', 'CAD', 'AUD'] as const;

function getCurrencyDecimals(balances: BalanceData[], code: string): number {
  const b = balances.find((x) => x.currency.code.toUpperCase() === code.toUpperCase());
  const p = b?.currency.precision;
  const n = p != null ? parseInt(String(p), 10) : NaN;
  if (Number.isNaN(n)) return 2;
  return Math.min(8, Math.max(0, n));
}

function majorToMinorUnits(major: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(major * factor + Number.EPSILON);
}

function maxMajorUnitsForBackend(decimals: number): number {
  return MAX_INVOICE_MINOR_UNITS / 10 ** decimals;
}

type PaymentView =
  | 'menu'
  | 'deposit_stripe_amount'
  | 'deposit_stripe_card'
  | 'invoice_stripe_card'
  | 'invoice_verifying'
  | 'crypto';

export type PaymentModalProps =
  | {
      purpose: 'deposit';
      isOpen: boolean;
      onClose: () => void;
      balances: BalanceData[];
      onSuccess?: () => void;
    }
  | {
      purpose: 'invoice';
      isOpen: boolean;
      onClose: () => void;
      invoiceId: string;
      amount: number;
      currency: string;
      paymentMethods?: string[];
      onPaid: () => void;
    };

export const PaymentModal: React.FC<PaymentModalProps> = (props) => {
  const { isOpen, onClose, purpose } = props;
  const tDep = useTranslations('balance.deposit');
  const tBill = useTranslations('billing');
  const { user } = useAuth();

  const balances = purpose === 'deposit' ? props.balances : [];
  const onDepositSuccess = purpose === 'deposit' ? props.onSuccess : undefined;
  const invoiceId = purpose === 'invoice' ? props.invoiceId : '';
  const invoiceAmount = purpose === 'invoice' ? props.amount : 0;
  const invoiceCurrency = purpose === 'invoice' ? props.currency : 'USD';
  const paymentMethods =
    purpose === 'invoice' ? (props.paymentMethods ?? []) : [];
  const onInvoicePaid = purpose === 'invoice' ? props.onPaid : () => {};

  const paymentMethodsNormalized = paymentMethods.map((m) =>
    String(m).trim().toUpperCase()
  );
  const canUseStripe =
    purpose === 'deposit' ||
    paymentMethodsNormalized.length === 0 ||
    paymentMethodsNormalized.some((m) => m.includes('STRIPE'));
  const canUseCrypto =
    purpose === 'deposit' ||
    paymentMethodsNormalized.length === 0 ||
    paymentMethodsNormalized.some((m) => m.includes('CRYPT'));

  const [view, setView] = useState<PaymentView>('menu');
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amountStr, setAmountStr] = useState('');
  const [currencyCode, setCurrencyCode] = useState<string>(STRIPE_FIAT_CODES[0]);
  const [payInvoiceLoading, setPayInvoiceLoading] = useState(false);
  const [invoicePollId, setInvoicePollId] = useState<string | null>(null);
  const [manualCheckLoading, setManualCheckLoading] = useState(false);

  const [networks, setNetworks] = useState<CryptapiNetworkInfo[]>([]);
  const [networksLoading, setNetworksLoading] = useState(false);
  const [networksError, setNetworksError] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<CryptapiNetworkInfo | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<CryptapiTickerInfo | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [walletMessage, setWalletMessage] = useState<string | null>(null);
  const [minUsd, setMinUsd] = useState<number | null>(null);
  const [cryptoAmount, setCryptoAmount] = useState<string | null>(null);

  const stripePromise = useMemo(() => {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
    return key ? loadStripe(key) : null;
  }, []);

  const stripeCurrencyOptions = useMemo(() => [...STRIPE_FIAT_CODES], []);

  const resetState = useCallback(() => {
    setView('menu');
    setStripeLoading(false);
    setStripeError(null);
    setClientSecret(null);
    setAmountStr('');
    setCurrencyCode(STRIPE_FIAT_CODES[0]);
    setPayInvoiceLoading(false);
    setInvoicePollId(null);
    setManualCheckLoading(false);
    setNetworks([]);
    setNetworksLoading(false);
    setNetworksError(null);
    setSelectedChain(null);
    setSelectedTicker(null);
    setWalletLoading(false);
    setWalletError(null);
    setDepositAddress(null);
    setQrUrl(null);
    setWalletMessage(null);
    setMinUsd(null);
    setCryptoAmount(null);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  const modalTitle =
    purpose === 'deposit' ? tDep('title') : tBill('paymentModalTitle');
  const closeAria =
    purpose === 'deposit' ? tDep('close') : tBill('paymentModalCloseAria');

  const handleInvoicePollResult = useCallback(
    (result: Awaited<ReturnType<typeof fetchBalanceInvoiceStatusOnce>>) => {
      if (purpose !== 'invoice') return;
      if (result === 'PAID') {
        setInvoicePollId(null);
        toast.success(tBill('paymentSuccess'));
        onInvoicePaid();
        onClose();
        return;
      }
      if (result === 'EXPIRED') {
        setInvoicePollId(null);
        toast.error(tBill('invoiceExpired'));
        onClose();
        return;
      }
      if (result === 'CANCELLED') {
        setInvoicePollId(null);
        toast.error(tBill('invoiceCancelled'));
        onClose();
        return;
      }
    },
    [onClose, onInvoicePaid, purpose, tBill]
  );

  const runInvoiceStatusCheck = useCallback(
    async (id: string, opts?: { silentIfPending?: boolean }) => {
      try {
        const result = await fetchBalanceInvoiceStatusOnce(id);
        handleInvoicePollResult(result);
        if (result === 'PENDING' && !opts?.silentIfPending) {
          toast.info(tBill('paymentStillPending'));
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : tBill('purchaseError'));
      }
    },
    [handleInvoicePollResult, tBill]
  );

  useEffect(() => {
    if (!isOpen || !invoicePollId) return;
    let cancelled = false;
    const id = invoicePollId;

    const tick = async () => {
      if (cancelled) return;
      await runInvoiceStatusCheck(id, { silentIfPending: true });
    };

    void tick();
    const intervalId = window.setInterval(() => {
      void tick();
    }, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isOpen, invoicePollId, runInvoiceStatusCheck]);

  const manualCheckInvoice = useCallback(async () => {
    if (!invoicePollId) return;
    setManualCheckLoading(true);
    try {
      await runInvoiceStatusCheck(invoicePollId, { silentIfPending: false });
    } finally {
      setManualCheckLoading(false);
    }
  }, [invoicePollId, runInvoiceStatusCheck]);

  useEffect(() => {
    if (!isOpen || view !== 'crypto') return;
    let cancelled = false;
    (async () => {
      setNetworksLoading(true);
      setNetworksError(null);
      try {
        const res = await balanceApi.getCryptapiNetworks();
        if (cancelled) return;
        setNetworks(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        if (!cancelled) {
          setNetworksError(
            e instanceof Error
              ? e.message
              : purpose === 'deposit'
                ? tDep('errorLoadingNetworks')
                : tBill('cryptoNetworksError')
          );
        }
      } finally {
        if (!cancelled) setNetworksLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, view, purpose, tBill, tDep]);

  useEffect(() => {
    if (!isOpen || view !== 'crypto' || !selectedTicker) return;
    let cancelled = false;
    (async () => {
      setWalletLoading(true);
      setWalletError(null);
      setDepositAddress(null);
      setQrUrl(null);
      setCryptoAmount(null);
      try {
        if (purpose === 'deposit') {
          const res = await balanceApi.getCryptapiWallet(selectedTicker.ticker);
          if (cancelled) return;
          const w = res.data;
          setDepositAddress(w.deposit_address);
          setQrUrl(w.qr_code_url ?? null);
          setWalletMessage(w.message ?? null);
          setMinUsd(typeof w.min_amount_usd === 'number' ? w.min_amount_usd : null);
        } else {
          const res = await subscriptionApi.getSubscriptionInvoiceCryptapiAddress(
            invoiceId,
            selectedTicker.ticker
          );
          if (cancelled) return;
          setDepositAddress(res.data.deposit_address);
          setQrUrl(res.data.qr_code_url ?? null);
          setWalletMessage(res.data.message ?? null);
          setMinUsd(
            typeof res.data.min_amount_usd === 'number'
              ? res.data.min_amount_usd
              : null
          );
          setCryptoAmount(
            res.data.amount != null ? String(res.data.amount) : null
          );
          setInvoicePollId(invoiceId);
        }
      } catch (e) {
        if (!cancelled) {
          setWalletError(
            e instanceof Error
              ? e.message
              : purpose === 'deposit'
                ? tDep('errorLoadingWallet')
                : tBill('cryptoAddressError')
          );
        }
      } finally {
        if (!cancelled) setWalletLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    view,
    selectedTicker,
    purpose,
    invoiceId,
    tBill,
    tDep
  ]);

  const handleCreatePaymentIntent = async () => {
    if (!stripePromise) {
      setStripeError(tDep('stripeMissingKey'));
      return;
    }
    const raw = parseFloat(amountStr.replace(',', '.'));
    const code = (currencyCode.trim() || STRIPE_FIAT_CODES[0]).toUpperCase();
    const decimals = getCurrencyDecimals(balances, code);
    const minorUnits = Number.isNaN(raw) ? NaN : majorToMinorUnits(raw, decimals);
    const majorCap = maxMajorUnitsForBackend(decimals);

    if (Number.isNaN(raw) || raw <= 0) {
      setStripeError(tDep('enterAmount'));
      return;
    }
    if (minorUnits > MAX_INVOICE_MINOR_UNITS) {
      setStripeError(tDep('amountMax', { max: majorCap }));
      return;
    }
    setStripeLoading(true);
    setStripeError(null);
    try {
      const metadata = (() => {
        if (!user?.id) return undefined;
        const s = String(user.id);
        const n = Number.parseInt(s, 10);
        if (!Number.isNaN(n) && String(n) === s) return { userId: n };
        return { userId: s };
      })();
      const res = await balanceApi.createStripePaymentIntent({
        amount: raw,
        currency: code,
        metadata
      });
      const d = res.data;
      const secret = d.client_secret ?? d.clientSecret;
      if (!secret) {
        throw new Error(tDep('paymentFailed'));
      }
      setClientSecret(secret);
      setView('deposit_stripe_card');
    } catch (e) {
      const msg = e instanceof Error ? e.message : tDep('paymentFailed');
      setStripeError(msg);
      toast.error(msg);
    } finally {
      setStripeLoading(false);
    }
  };

  const handleDepositStripeSuccess = () => {
    toast.success(tDep('checkoutSuccess'));
    onDepositSuccess?.();
    onClose();
  };

  const startInvoiceStripePayment = useCallback(async () => {
    if (purpose !== 'invoice') return;
    setStripeError(null);
    setPayInvoiceLoading(true);
    try {
      const payRes = await balanceApi.payInvoice(invoiceId, {
        paymentMethod: 'STRIPE',
        paymentDetails: {}
      });
      const payData = payRes?.data as Record<string, unknown> | undefined;
      const requiresAction =
        Boolean(payData?.requires_action) || Boolean(payData?.requiresAction);
      const secret =
        (payData?.client_secret as string | undefined) ??
        (payData?.clientSecret as string | undefined);

      if (requiresAction && secret) {
        if (!stripePromise) {
          throw new Error(tBill('stripeMissingPublishableKey'));
        }
        setClientSecret(secret);
        setView('invoice_stripe_card');
        return;
      }

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

      setView('invoice_verifying');
      setInvoicePollId(invoiceId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : tBill('purchaseError');
      setStripeError(msg);
      toast.error(msg);
    } finally {
      setPayInvoiceLoading(false);
    }
  }, [invoiceId, purpose, stripePromise, tBill]);

  const copyAddress = async () => {
    if (!depositAddress) return;
    try {
      await navigator.clipboard.writeText(depositAddress);
      if (purpose === 'deposit') {
        toast.success(tDep('copied'));
      } else {
        toast.success(tBill('cryptoCopied'));
      }
    } catch {
      if (purpose === 'deposit') {
        toast.error(tDep('copyFailed'));
      } else {
        toast.error(tBill('cryptoCopyFailed'));
      }
    }
  };

  if (!isOpen) return null;
  if (purpose === 'invoice' && !invoiceId) return null;

  const cryptoLabels =
    purpose === 'deposit'
      ? {
          back: tDep('back'),
          selectNetwork: tDep('cryptoSelectNetwork'),
          selectCoin: tDep('cryptoSelectCoin'),
          loadingNetworks: tDep('loadingNetworks'),
          loadingWallet: tDep('loadingWallet'),
          address: tDep('address'),
          minAmount: tDep('minAmount'),
          copyAddress: tDep('copyAddress'),
          note: tDep('cryptoNote')
        }
      : {
          back: tBill('paymentBack'),
          selectNetwork: tBill('cryptoSelectNetwork'),
          selectCoin: tBill('cryptoSelectCoin'),
          loadingNetworks: tBill('cryptoLoadingNetworks'),
          loadingWallet: tBill('cryptoAddress'),
          address: tBill('cryptoAddress'),
          minAmount: 'Min',
          copyAddress: tBill('cryptoCopyAddress')
        };

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="p-[1px] rounded-2xl bg-[linear-gradient(90deg,#7C3AED_0%,#4C1D95_100%)] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#141519] w-full flex flex-col max-h-[90vh] overflow-hidden rounded-[calc(1rem-1px)]">
          <div className="flex items-center justify-between p-5 border-b border-gray-700/50 shrink-0">
            <h2 className="text-xl font-bold text-white">{modalTitle}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10"
              aria-label={closeAria}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto flex-1 min-h-0">
            {view === 'menu' && (
              <div className="space-y-3">
                {purpose === 'invoice' && (
                  <p className="text-sm text-gray-400">
                    {tBill('paymentRequiredAmount', {
                      amount: invoiceAmount,
                      currency: invoiceCurrency
                    })}
                  </p>
                )}
                <p className="text-gray-400 text-sm mb-2">{tDep('chooseMethod')}</p>
                {!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() &&
                  canUseStripe && (
                    <p className="text-sm text-amber-400" role="status">
                      {tDep('stripeMissingKey')}
                    </p>
                  )}
                {stripeError && <p className="text-sm text-red-400">{stripeError}</p>}
                {canUseStripe && (
                  <button
                    type="button"
                    disabled={payInvoiceLoading}
                    onClick={() => {
                      setStripeError(null);
                      if (purpose === 'deposit') {
                        setView('deposit_stripe_amount');
                      } else {
                        void startInvoiceStripePayment();
                      }
                    }}
                    className="w-full text-left p-4 rounded-[10px] border border-gray-700 bg-black/30 hover:border-[var(--color-main)] transition-colors disabled:opacity-50"
                  >
                    <span className="font-semibold text-white flex items-center gap-2">
                      {payInvoiceLoading && purpose === 'invoice' ? (
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      ) : null}
                      {tDep('stripe')}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {tDep('stripeDescription')}
                    </p>
                  </button>
                )}
                {canUseCrypto && (
                  <button
                    type="button"
                    onClick={() => {
                      setStripeError(null);
                      setView('crypto');
                    }}
                    className="w-full text-left p-4 rounded-[10px] border border-gray-700 bg-black/30 hover:border-[var(--color-main)] transition-colors"
                  >
                    <span className="font-semibold text-white">{tDep('crypto')}</span>
                    <p className="text-sm text-gray-500 mt-1">
                      {tDep('cryptoDescription')}
                    </p>
                  </button>
                )}
              </div>
            )}

            {view === 'deposit_stripe_amount' && purpose === 'deposit' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    setView('menu');
                    setStripeError(null);
                    setClientSecret(null);
                  }}
                  className="text-sm text-[var(--color-main)] font-medium"
                >
                  ← {tDep('back')}
                </button>
                <p className="text-sm text-gray-500">{tDep('stripeCardHint')}</p>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    {tDep('amount')}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className="w-full h-11 rounded-[10px] border border-gray-700 bg-black/40 px-3 text-white"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    {tDep('currency')}
                  </label>
                  <select
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value)}
                    className="w-full h-11 rounded-[10px] border border-gray-700 bg-black/40 px-3 text-white"
                  >
                    {stripeCurrencyOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                {stripeError && <p className="text-sm text-red-400">{stripeError}</p>}
                <button
                  type="button"
                  disabled={stripeLoading}
                  onClick={() => void handleCreatePaymentIntent()}
                  className="w-full h-11 rounded-[10px] bg-[var(--color-main)] text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {stripeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {tDep('preparePayment')}
                </button>
              </div>
            )}

            {view === 'deposit_stripe_card' &&
              purpose === 'deposit' &&
              clientSecret &&
              stripePromise && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <BalanceDepositStripeCardForm
                    clientSecret={clientSecret}
                    onSuccess={handleDepositStripeSuccess}
                    onError={(msg) => {
                      setStripeError(msg);
                      toast.error(msg);
                    }}
                    submitLabel={tDep('payWithCard')}
                    backLabel={tDep('backToAmount')}
                    onBack={() => {
                      setView('deposit_stripe_amount');
                      setClientSecret(null);
                      setStripeError(null);
                    }}
                  />
                </Elements>
              )}

            {view === 'invoice_stripe_card' &&
              purpose === 'invoice' &&
              clientSecret &&
              stripePromise && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">{tBill('stripeCardTitle')}</p>
                  {stripeError && (
                    <p className="text-sm text-red-400">{stripeError}</p>
                  )}
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <BalanceDepositStripeCardForm
                      clientSecret={clientSecret}
                      confirmBalanceOnSuccess={false}
                      onSuccess={() => {
                        setStripeError(null);
                        setView('invoice_verifying');
                        setInvoicePollId(invoiceId);
                      }}
                      onError={(msg) => {
                        setStripeError(msg);
                        toast.error(msg);
                      }}
                      submitLabel={tDep('payWithCard')}
                      backLabel={tDep('back')}
                      onBack={() => {
                        setView('menu');
                        setClientSecret(null);
                        setStripeError(null);
                      }}
                    />
                  </Elements>
                </div>
              )}

            {view === 'invoice_verifying' && purpose === 'invoice' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">{tBill('paymentVerifying')}</p>
                <p className="text-xs text-gray-500">{tBill('paymentAutoCheckEvery30s')}</p>
                <button
                  type="button"
                  disabled={manualCheckLoading || !invoicePollId}
                  onClick={() => void manualCheckInvoice()}
                  className="w-full h-11 rounded-[10px] border border-gray-600 text-white font-semibold hover:bg-white/5 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {manualCheckLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {tBill('paymentCheckNow')}
                </button>
              </div>
            )}

            {view === 'crypto' && (
              <div className="space-y-4">
                <CryptoPaymentPanel
                  labels={cryptoLabels}
                  networks={networks}
                  networksLoading={networksLoading}
                  networksError={networksError}
                  selectedChain={selectedChain}
                  selectedTicker={selectedTicker}
                  walletLoading={walletLoading}
                  walletError={walletError}
                  depositAddress={depositAddress}
                  qrUrl={qrUrl}
                  walletMessage={walletMessage}
                  minUsd={minUsd}
                  onBack={() => {
                    setInvoicePollId(null);
                    setView('menu');
                    setSelectedChain(null);
                    setSelectedTicker(null);
                    setWalletError(null);
                    setDepositAddress(null);
                    setQrUrl(null);
                    setWalletMessage(null);
                    setMinUsd(null);
                    setCryptoAmount(null);
                  }}
                  onSelectChain={(chain) => {
                    setSelectedChain(chain);
                    setSelectedTicker(null);
                  }}
                  onSelectTicker={(ticker) => setSelectedTicker(ticker)}
                  onCopyAddress={() => void copyAddress()}
                />
                {purpose === 'invoice' && selectedTicker && depositAddress && (
                  <p className="text-sm text-gray-300">
                    {tBill('cryptoSendAmount', {
                      amount: cryptoAmount ?? String(invoiceAmount),
                      ticker: selectedTicker.ticker
                    })}
                  </p>
                )}
                {purpose === 'invoice' && depositAddress && (
                  <p className="text-xs text-gray-500">{tBill('cryptoWaitingHint')}</p>
                )}
                {purpose === 'invoice' && depositAddress && invoicePollId && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">
                      {tBill('paymentAutoCheckEvery30s')}
                    </p>
                    <button
                      type="button"
                      disabled={manualCheckLoading}
                      onClick={() => void manualCheckInvoice()}
                      className="w-full h-11 rounded-[10px] border border-gray-600 text-white font-semibold hover:bg-white/5 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {manualCheckLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      {tBill('paymentCheckNow')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
