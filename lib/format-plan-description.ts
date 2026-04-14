import { routing } from '@/i18n/routing';
import { resolveLocalizedApiField } from '@/lib/resolve-localized-api-field';

/**
 * Renders plan description with line breaks.
 * - Respects real newlines from API (use with whitespace-pre-line in UI).
 * - If the API sends one line like "- A - B - C", splits on " - " into separate lines.
 * - Resolves API locale maps { en, uk, ... } when `locale` is set (default: app defaultLocale).
 * - Coerces other non-string values so callers never hit .trim on wrong types.
 */
function toDescriptionString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function formatPlanDescriptionForDisplay(
  text: unknown,
  locale: string = routing.defaultLocale
): string {
  const fromLocales = resolveLocalizedApiField(text, locale, {
    allowAnyLocaleFallback: false
  });
  let normalized = fromLocales;
  if (normalized === '') {
    if (text != null && typeof text === 'object') {
      return '';
    }
    if (typeof text === 'string') {
      const trimmed = text.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        return '';
      }
    }
    normalized = toDescriptionString(text);
  }
  const trimmed = normalized.trim();
  if (trimmed.length === 0) return normalized;
  if (trimmed.includes('\n')) return normalized;
  if (!trimmed.startsWith('- ')) return normalized;
  const segments = trimmed.split(/\s-\s/);
  if (segments.length <= 1) return normalized;
  return segments.map((s, i) => (i === 0 ? s : `- ${s}`)).join('\n');
}
