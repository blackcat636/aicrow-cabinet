'use client';

import React from 'react';
import { PaymentModal } from '@/components/payments/PaymentModal';
import type { BalanceData } from '@/types/balance';

interface BalanceDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  balances: BalanceData[];
  onDepositSuccess?: () => void;
}

export const BalanceDepositModal: React.FC<BalanceDepositModalProps> = ({
  onDepositSuccess,
  ...rest
}) => (
  <PaymentModal purpose="deposit" onSuccess={onDepositSuccess} {...rest} />
);
