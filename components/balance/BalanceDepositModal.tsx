'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X, Copy, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { balanceApi } from '@/lib/apiBalance';
import { MAX_INVOICE_MINOR_UNITS } from '@/lib/balanceStripeCheckout';
import { useAuth } from '@/contexts/AuthContext';
import { BalanceDepositStripeCardForm } from '@/components/balance/BalanceDepositStripeCardForm';
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

type DepositMethod = 'stripe' | 'crypto';

interface BalanceDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  balances: BalanceData[];
  onDepositSuccess?: () => void;
}

export const BalanceDepositModal: React.FC<BalanceDepositModalProps> = ({
  isOpen,
  onClose,
  balances,
  onDepositSuccess
}) => {
  const t = useTranslations('balance.deposit');
  const { user } = useAuth();
  const [method, setMethod] = useState<DepositMethod | null>(null);

  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [stripeStep, setStripeStep] = useState<'amount' | 'card'>('amount');
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const stripePromise = useMemo(() => {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
    return key ? loadStripe(key) : null;
  }, []);

  const [amountStr, setAmountStr] = useState('');
  const [currencyCode, setCurrencyCode] = useState<string>(STRIPE_FIAT_CODES[0]);

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

  const stripeCurrencyOptions = useMemo(() => [...STRIPE_FIAT_CODES], []);

  const resetState = useCallback(() => {
    setMethod(null);
    setAmountStr('');
    setStripeError(null);
    setStripeLoading(false);
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
    setCurrencyCode(STRIPE_FIAT_CODES[0]);
    setStripeStep('amount');
    setClientSecret(null);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  useEffect(() => {
    if (!isOpen || method !== 'crypto') return;
    let cancelled = false;
    (async () => {
      setNetworksLoading(true);
      setNetworksError(null);
      try {
        const res = await balanceApi.getCryptapiNetworks();
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setNetworks(list);
      } catch (e) {
        if (!cancelled) {
          setNetworksError(e instanceof Error ? e.message : t('errorLoadingNetworks'));
        }
      } finally {
        if (!cancelled) setNetworksLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, method, t]);

  useEffect(() => {
    if (!isOpen || method !== 'crypto' || !selectedTicker) return;
    let cancelled = false;
    (async () => {
      setWalletLoading(true);
      setWalletError(null);
      setDepositAddress(null);
      setQrUrl(null);
      try {
        const res = await balanceApi.getCryptapiWallet(selectedTicker.ticker);
        if (cancelled) return;
        const w = res.data;
        setDepositAddress(w.deposit_address);
        setQrUrl(w.qr_code_url ?? null);
        setWalletMessage(w.message ?? null);
        setMinUsd(typeof w.min_amount_usd === 'number' ? w.min_amount_usd : null);
      } catch (e) {
        if (!cancelled) {
          setWalletError(e instanceof Error ? e.message : t('errorLoadingWallet'));
        }
      } finally {
        if (!cancelled) setWalletLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, method, selectedTicker, t]);

  /** POST /balance/payment-methods/stripe/create-payment-intent — amount in major units. */
  const handleCreatePaymentIntent = async () => {
    if (!stripePromise) {
      setStripeError(t('stripeMissingKey'));
      return;
    }
    const raw = parseFloat(amountStr.replace(',', '.'));
    const code =
      (currencyCode.trim() || STRIPE_FIAT_CODES[0]).toUpperCase();
    const decimals = getCurrencyDecimals(balances, code);
    const minorUnits = Number.isNaN(raw) ? NaN : majorToMinorUnits(raw, decimals);
    const majorCap = maxMajorUnitsForBackend(decimals);

    if (Number.isNaN(raw) || raw <= 0) {
      setStripeError(t('enterAmount'));
      return;
    }
    if (minorUnits > MAX_INVOICE_MINOR_UNITS) {
      setStripeError(t('amountMax', { max: majorCap }));
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
        throw new Error(t('paymentFailed'));
      }
      setClientSecret(secret);
      setStripeStep('card');
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('paymentFailed');
      setStripeError(msg);
      toast.error(msg);
    } finally {
      setStripeLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast.success(t('checkoutSuccess'));
    onDepositSuccess?.();
    onClose();
  };

  const copyAddress = async () => {
    if (!depositAddress) return;
    try {
      await navigator.clipboard.writeText(depositAddress);
      toast.success(t('copied'));
    } catch {
      toast.error(t('copyFailed'));
    }
  };

  if (!isOpen) return null;

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
        <div
          className="bg-[#141519] w-full flex flex-col max-h-[90vh] overflow-hidden rounded-[calc(1rem-1px)]"
        >
          <div className="flex items-center justify-between p-5 border-b border-gray-700/50 shrink-0">
            <h2 className="text-xl font-bold text-white">{t('title')}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10"
              aria-label={t('close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto flex-1 min-h-0">
            {!method && (
              <div className="space-y-3">
                <p className="text-gray-400 text-sm mb-2">{t('chooseMethod')}</p>
                <button
                  type="button"
                  onClick={() => setMethod('stripe')}
                  className="w-full text-left p-4 rounded-[10px] border border-gray-700 bg-black/30 hover:border-[var(--color-main)] transition-colors"
                >
                  <span className="font-semibold text-white">{t('stripe')}</span>
                  <p className="text-sm text-gray-500 mt-1">{t('stripeDescription')}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('crypto')}
                  className="w-full text-left p-4 rounded-[10px] border border-gray-700 bg-black/30 hover:border-[var(--color-main)] transition-colors"
                >
                  <span className="font-semibold text-white">{t('crypto')}</span>
                  <p className="text-sm text-gray-500 mt-1">{t('cryptoDescription')}</p>
                </button>
              </div>
            )}

            {method === 'stripe' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    setMethod(null);
                    setStripeError(null);
                    setStripeStep('amount');
                    setClientSecret(null);
                  }}
                  className="text-sm text-[var(--color-main)] font-medium"
                >
                  ← {t('back')}
                </button>

                {stripeStep === 'amount' && (
                  <>
                    <p className="text-sm text-gray-500">{t('stripeCardHint')}</p>
                    {!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() && (
                      <p className="text-sm text-amber-400" role="status">
                        {t('stripeMissingKey')}
                      </p>
                    )}
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">{t('amount')}</label>
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
                      <label className="block text-sm text-gray-400 mb-1">{t('currency')}</label>
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
                      {t('preparePayment')}
                    </button>
                  </>
                )}

                {stripeStep === 'card' && clientSecret && stripePromise && (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <BalanceDepositStripeCardForm
                      clientSecret={clientSecret}
                      onSuccess={handlePaymentSuccess}
                      onError={(msg) => {
                        setStripeError(msg);
                        toast.error(msg);
                      }}
                      submitLabel={t('payWithCard')}
                      backLabel={t('backToAmount')}
                      onBack={() => {
                        setStripeStep('amount');
                        setClientSecret(null);
                        setStripeError(null);
                      }}
                    />
                  </Elements>
                )}
              </div>
            )}

            {method === 'crypto' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    setMethod(null);
                    setSelectedChain(null);
                    setSelectedTicker(null);
                  }}
                  className="text-sm text-[var(--color-main)] font-medium"
                >
                  ← {t('back')}
                </button>

                {networksLoading && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('loadingNetworks')}
                  </div>
                )}
                {networksError && <p className="text-sm text-red-400">{networksError}</p>}

                {!selectedChain && !networksLoading && networks.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">{t('cryptoSelectNetwork')}</p>
                    <div className="flex flex-wrap gap-2">
                      {networks.map((n) => (
                        <button
                          key={n.chain}
                          type="button"
                          onClick={() => {
                            setSelectedChain(n);
                            setSelectedTicker(null);
                          }}
                          className="px-3 py-2 rounded-[10px] border border-gray-700 bg-black/40 text-white text-sm hover:border-[var(--color-main)]"
                        >
                          {n.chainLabel || n.chain}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedChain && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">{t('cryptoSelectCoin')}</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedChain.tickers.map((tk) => (
                        <button
                          key={tk.ticker}
                          type="button"
                          onClick={() => setSelectedTicker(tk)}
                          className={`px-3 py-2 rounded-[10px] border text-sm ${
                            selectedTicker?.ticker === tk.ticker
                              ? 'border-[var(--color-main)] bg-purple-950/40 text-white'
                              : 'border-gray-700 bg-black/40 text-white hover:border-[var(--color-main)]'
                          }`}
                        >
                          {tk.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {walletLoading && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('loadingWallet')}
                  </div>
                )}
                {walletError && <p className="text-sm text-red-400">{walletError}</p>}

                {selectedTicker && depositAddress && !walletLoading && (
                  <div className="space-y-3 rounded-[10px] border border-gray-700 bg-black/30 p-4">
                    {qrUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrUrl} alt="" className="mx-auto w-[160px] h-[160px] rounded-lg" />
                    )}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('address')}</p>
                      <p className="text-sm text-white break-all font-mono">{depositAddress}</p>
                    </div>
                    {minUsd != null && (
                      <p className="text-xs text-gray-500">
                        {t('minAmount')}: ${minUsd}
                      </p>
                    )}
                    {walletMessage && <p className="text-sm text-gray-400">{walletMessage}</p>}
                    <button
                      type="button"
                      onClick={() => void copyAddress()}
                      className="flex items-center gap-2 text-[var(--color-main)] text-sm font-medium"
                    >
                      <Copy className="h-4 w-4" />
                      {t('copyAddress')}
                    </button>
                    <p className="text-xs text-gray-500">{t('cryptoNote')}</p>
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
