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

// Fallback CORS origins when API is unavailable (from env only)
const FALLBACK_CORS =
  process.env.SSO_CORS_ORIGINS?.split(',')
    .map((o) => o.trim())
    .filter(Boolean) || [];

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
 */
export async function isRedirectUriAllowed(
  redirectUri: string,
  service?: string
): Promise<boolean> {
  return isRedirectUriAllowedFromApi(redirectUri, service);
}

export type { SSOConfig };
