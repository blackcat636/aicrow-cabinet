export const DEFAULT_AVATARS = [
  'blue-1',
  'purple-1'
] as const;

export type DefaultAvatarName = typeof DEFAULT_AVATARS[number];

export function isDefaultAvatar(name: string | null | undefined): name is DefaultAvatarName {
  if (!name) return false;
  return (DEFAULT_AVATARS as readonly string[]).includes(name);
}

export function getDefaultAvatarUrl(name: DefaultAvatarName): string {
  return `/avatars/default/${name}.svg`;
}

export const DICEBEAR_STYLES = [
  'adventurer',
  'adventurer-neutral',
  'big-ears',
  'big-ears-neutral',
  'big-smile',
  'bottts',
  'croodles',
  'fun-emoji',
  'identicon',
  'lorelei',
  'micah',
  'notionists',
  'open-peeps',
  'pixel-art',
  'pixel-art-neutral',
] as const;

export type DicebearStyle = typeof DICEBEAR_STYLES[number];

export function isDicebearId(value: string | null | undefined): boolean {
  if (!value) return false;
  if (!value.startsWith('dicebear:')) return false;
  const parts = value.split(':');
  if (parts.length !== 3) return false;
  const style = parts[1] as DicebearStyle;
  return (DICEBEAR_STYLES as readonly string[]).includes(style);
}

export function getDicebearUrl(style: DicebearStyle, seed: string): string {
  const s = encodeURIComponent(seed);
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${s}`;
}

export function getDicebearUrlFromId(id: string): string {
  const [, style, seed] = id.split(':');
  return getDicebearUrl(style as DicebearStyle, seed);
}

export function makeDicebearId(style: DicebearStyle, seed: string): string {
  return `dicebear:${style}:${seed}`;
}

export function getAvatarUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  if (isDefaultAvatar(value)) return getDefaultAvatarUrl(value);
  if (isDicebearId(value)) return getDicebearUrlFromId(value);
  return value;
}
