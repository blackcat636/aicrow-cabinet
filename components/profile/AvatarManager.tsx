"use client";

import React, { useState } from "react";
import {
  DICEBEAR_STYLES,
  DicebearStyle,
  makeDicebearId,
  getDicebearUrl
} from "@/lib/avatars";
import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';

interface AvatarManagerProps {
  current: string | null | undefined;
  onSelect: (value: string | null) => Promise<void> | void;
}

export function AvatarManager({ current, onSelect }: AvatarManagerProps) {
  const t = useTranslations('avatarManager');
  const [saving, setSaving] = useState(false);
  const [genStyle, setGenStyle] = useState<DicebearStyle>("adventurer");
  const [genSeed, setGenSeed] = useState<string>("user");
  const sampleSeedsBase = [
    "alpha","bravo","charlie","delta","echo","foxtrot","golf","hotel","india","juliet","kilo","lima","mike","november","oscar","papa","quebec","romeo","sierra","tango","uniform","victor","whiskey","xray","yankee","zulu"
  ];

  return (
    <div className="w-full">
      {/* Generated (DiceBear) tab */}
      {
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('style') || 'Style'}</label>
              <select
                className="w-full bg-gray-800 text-gray-100 border border-gray-700 rounded-md p-2"
                value={genStyle}
                onChange={(e) => setGenStyle(e.target.value as DicebearStyle)}
              >
                {DICEBEAR_STYLES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t('seed') || 'Seed'}</label>
              <input
                type="text"
                className="w-full bg-gray-800 text-gray-100 border border-gray-700 rounded-md p-2"
                value={genSeed}
                onChange={(e) => setGenSeed(e.target.value)}
                placeholder={t('typeUniqueSeed') || 'Type a unique seed'}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <img
              src={getDicebearUrl(genStyle, genSeed || "user")}
              alt="Generated avatar preview"
              className="w-24 h-24 rounded-full object-cover bg-gray-800"
            />
            <div className="text-xs text-gray-400">{t('generatedByDiceBear') || 'Avatar is generated on-the-fly by DiceBear API.'}</div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={() => setGenSeed(Math.random().toString(36).slice(2, 10))}>
              {t('randomize') || 'Randomize'}
            </Button>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-2">{t('quickPicks') || 'Quick picks'}</div>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
              {sampleSeedsBase.map((seed) => (
                <button
                  key={seed}
                  type="button"
                  onClick={() => setGenSeed(seed)}
                  className={`rounded-lg p-1 border ${genSeed===seed? 'border-purple-500 ring-1 ring-purple-500/50':'border-gray-700 hover:border-gray-500'}`}
                  aria-label={t('pickSeed', { seed }) || `Pick ${seed}`}
                  title={seed}
                >
                  <img src={getDicebearUrl(genStyle, seed)} alt={seed} className="w-10 h-10 rounded-md" />
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={async () => {
                const id = makeDicebearId(genStyle, genSeed || "user");
                setSaving(true);
                try {
                  await onSelect(id);
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? (t('saving') || 'Saving...') : (t('useGenerated') || 'Use generated')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => onSelect(null)}>
              {t('removeAvatar') || 'Remove avatar'}
            </Button>
          </div>
        </div>
      }
    </div>
  );
}
