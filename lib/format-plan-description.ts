/**
 * Renders plan description with line breaks.
 * - Respects real newlines from API (use with whitespace-pre-line in UI).
 * - If the API sends one line like "- A - B - C", splits on " - " into separate lines.
 */
export function formatPlanDescriptionForDisplay(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length === 0) return text;
  if (trimmed.includes('\n')) return text;
  if (!trimmed.startsWith('- ')) return text;
  const segments = trimmed.split(/\s-\s/);
  if (segments.length <= 1) return text;
  return segments.map((s, i) => (i === 0 ? s : `- ${s}`)).join('\n');
}
