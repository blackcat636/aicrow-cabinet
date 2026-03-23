'use client';

import React, { FormEvent, useState } from 'react';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';
import { balanceApi } from '@/lib/apiBalance';

const cardElementStyle = {
  style: {
    base: {
      color: '#ffffff',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      '::placeholder': { color: '#9ca3af' }
    },
    invalid: { color: '#f87171' }
  }
};

interface BalanceDepositStripeCardFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onError: (message: string) => void;
  submitLabel: string;
  backLabel: string;
  onBack: () => void;
}

export const BalanceDepositStripeCardForm: React.FC<
  BalanceDepositStripeCardFormProps
> = ({ clientSecret, onSuccess, onError, submitLabel, backLabel, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) {
      onError('Card field is not ready');
      return;
    }
    setLoading(true);
    try {
      const returnUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}${window.location.pathname}${window.location.search}`
          : undefined;
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
        ...(returnUrl ? { return_url: returnUrl } : {})
      });
      if (error) {
        onError(error.message ?? 'Payment failed');
        return;
      }
      const status = paymentIntent?.status;
      if (
        status === 'succeeded' ||
        status === 'processing' ||
        status === 'requires_capture'
      ) {
        const id = paymentIntent?.id;
        if (!id) {
          onError('Missing payment intent');
          return;
        }
        await balanceApi.confirmStripePaymentIntent({ paymentIntentId: id });
        onSuccess();
        return;
      }
      if (status === 'requires_action') {
        onError('Additional authentication required');
        return;
      }
      onError(`Payment status: ${status ?? 'unknown'}`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(ev) => void handleSubmit(ev)} className="space-y-4">
      <div className="rounded-[10px] border border-gray-700 bg-black/40 p-3 min-h-[52px]">
        <CardElement
          options={{
            ...cardElementStyle,
            hidePostalCode: true,
            disableLink: true
          }}
        />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="h-11 px-4 rounded-[10px] border border-gray-600 text-white text-sm font-medium hover:bg-white/5 disabled:opacity-50"
        >
          {backLabel}
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="h-11 rounded-[10px] bg-[var(--color-main)] text-white font-semibold px-6 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitLabel}
        </button>
      </div>
    </form>
  );
};
