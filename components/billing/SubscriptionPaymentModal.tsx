'use client';

import React from 'react';
import { PaymentModal } from '@/components/payments/PaymentModal';

export interface SubscriptionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string | null;
  amount: number;
  currency: string;
  paymentMethods?: string[];
  onPaid: () => void;
}

export const SubscriptionPaymentModal: React.FC<
  SubscriptionPaymentModalProps
> = ({ invoiceId, ...rest }) => {
  if (!invoiceId) return null;
  return (
    <PaymentModal purpose="invoice" invoiceId={invoiceId} {...rest} />
  );
};
