'use client';

import React from 'react';
import { Copy, Loader2 } from 'lucide-react';
import type { CryptapiNetworkInfo, CryptapiTickerInfo } from '@/types/deposit';

interface CryptoPaymentPanelLabels {
  back: string;
  selectNetwork: string;
  selectCoin: string;
  loadingNetworks: string;
  loadingWallet: string;
  address: string;
  minAmount: string;
  copyAddress: string;
  note?: string;
}

interface CryptoPaymentPanelProps {
  labels: CryptoPaymentPanelLabels;
  networks: CryptapiNetworkInfo[];
  networksLoading: boolean;
  networksError: string | null;
  selectedChain: CryptapiNetworkInfo | null;
  selectedTicker: CryptapiTickerInfo | null;
  walletLoading: boolean;
  walletError: string | null;
  depositAddress: string | null;
  qrUrl: string | null;
  walletMessage: string | null;
  minUsd: number | null;
  onBack: () => void;
  onSelectChain: (chain: CryptapiNetworkInfo) => void;
  onSelectTicker: (ticker: CryptapiTickerInfo) => void;
  onCopyAddress: () => void;
}

export const CryptoPaymentPanel: React.FC<CryptoPaymentPanelProps> = ({
  labels,
  networks,
  networksLoading,
  networksError,
  selectedChain,
  selectedTicker,
  walletLoading,
  walletError,
  depositAddress,
  qrUrl,
  walletMessage,
  minUsd,
  onBack,
  onSelectChain,
  onSelectTicker,
  onCopyAddress
}) => {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-[var(--color-main)] font-medium"
      >
        ← {labels.back}
      </button>

      {networksLoading && (
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          {labels.loadingNetworks}
        </div>
      )}
      {networksError && <p className="text-sm text-red-400">{networksError}</p>}

      {!selectedChain && !networksLoading && networks.length > 0 && (
        <div>
          <p className="text-sm text-gray-400 mb-2">{labels.selectNetwork}</p>
          <div className="flex flex-wrap gap-2">
            {networks.map((n) => (
              <button
                key={n.chain}
                type="button"
                onClick={() => onSelectChain(n)}
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
          <p className="text-sm text-gray-400 mb-2">{labels.selectCoin}</p>
          <div className="flex flex-wrap gap-2">
            {selectedChain.tickers.map((tk) => (
              <button
                key={tk.ticker}
                type="button"
                onClick={() => onSelectTicker(tk)}
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
          {labels.loadingWallet}
        </div>
      )}
      {walletError && <p className="text-sm text-red-400">{walletError}</p>}

      {selectedTicker && depositAddress && !walletLoading && (
        <div className="space-y-3 rounded-[10px] border border-gray-700 bg-black/30 p-4">
          {qrUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrUrl} alt="QR code for crypto payment address" className="mx-auto w-[160px] h-[160px] rounded-lg" />
          )}
          <div>
            <p className="text-xs text-gray-500 mb-1">{labels.address}</p>
            <p className="text-sm text-white break-all font-mono">{depositAddress}</p>
          </div>
          {minUsd != null && (
            <p className="text-xs text-gray-500">
              {labels.minAmount}: ${minUsd}
            </p>
          )}
          {walletMessage && <p className="text-sm text-gray-400">{walletMessage}</p>}
          <button
            type="button"
            onClick={() => void onCopyAddress()}
            className="flex items-center gap-2 text-[var(--color-main)] text-sm font-medium"
          >
            <Copy className="h-4 w-4" />
            {labels.copyAddress}
          </button>
          {labels.note ? <p className="text-xs text-gray-500">{labels.note}</p> : null}
        </div>
      )}
    </div>
  );
};
