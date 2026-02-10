/**
 * SSO config - delegating to backend API.
 * All allowed redirect URIs and CORS origins are fetched from external URL (SSO_CONFIG_URL).
 * No hardcoded whitelist.
 */

import {
  getSSOConfig,
  isRedirectUriAllowedFromApi,
  type SSOConfig
} from '@/lib/ssoConfig';

// Fallback when API is unavailable (from env only)
const FALLBACK_CORS =
  process.env.SSO_CORS_ORIGINS?.split(',')
    .map((o) => o.trim())
    .filter(Boolean) || [];

const FALLBACK_REDIRECT_URIS =
  process.env.SSO_REDIRECT_URIS?.split(',')
    .map((o) => o.trim())
    .filter(Boolean) || [];

function isRedirectUriInFallback(redirectUri: string, _service?: string): boolean {
  if (FALLBACK_REDIRECT_URIS.length === 0) return false;
  const normalize = (u: string) => u.replace(/\/$/, '') || u;
  const normalized = normalize(redirectUri);
  return FALLBACK_REDIRECT_URIS.some(
    (u) =>
      normalized === normalize(u) || normalized.startsWith(normalize(u) + '/')
  );
}

/**
 * Get CORS origins from API. Falls back to SSO_CORS_ORIGINS env if API fails.
 */
export async function getCorsOrigins(): Promise<string[]> {
  try {
    const config = await getSSOConfig();
    return config.corsOrigins.length > 0 ? config.corsOrigins : FALLBACK_CORS;
  } catch {
    return FALLBACK_CORS;
  }
}

/**
 * Check if redirect_uri is allowed (fetches config from backend API).
 * Falls back to SSO_REDIRECT_URIS env when API is unavailable.
 */
export async function isRedirectUriAllowed(
  redirectUri: string,
  service?: string
): Promise<boolean> {
  try {
    return await isRedirectUriAllowedFromApi(redirectUri, service);
  } catch {
    return isRedirectUriInFallback(redirectUri, service);
  }
}

export type { SSOConfig };
