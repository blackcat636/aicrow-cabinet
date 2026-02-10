/**
 * SSO config fetcher - loads allowed redirect URIs and CORS origins from backend API.
 * No hardcoded whitelist; all data comes from external URL.
 */

import { API_CONFIG } from '@/config/api';

export interface SSOConfig {
  /** Service name -> allowed redirect URIs */
  services?: Record<string, string[]>;
  /** Flat list of allowed redirect URIs (used if services not provided) */
  redirectUris?: string[];
  /** Allowed CORS origins for exchange endpoint */
  corsOrigins: string[];
}

const SSO_CONFIG_URL =
  process.env.SSO_CONFIG_URL ||
  `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.SSO_CONFIG}`;

const CACHE_TTL_MS = 60 * 1000; // 1 minute
let cachedConfig: SSOConfig | null = null;
let cacheExpiry = 0;

/**
 * Fetches SSO config from backend API.
 * Expected response: { services?: Record<string, string[]>, redirectUris?: string[], corsOrigins: string[] }
 */
export async function getSSOConfig(): Promise<SSOConfig> {
  const now = Date.now();
  if (cachedConfig && cacheExpiry > now) {
    console.log('[SSO Config] Using cached config');
    return cachedConfig;
  }

  console.log('[SSO Config] Fetching from:', SSO_CONFIG_URL);
  try {
    const res = await fetch(SSO_CONFIG_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });

    if (!res.ok) {
      console.error('[SSO Config] Fetch failed:', res.status, res.statusText);
      throw new Error(`SSO config fetch failed: ${res.status}`);
    }

    const data = (await res.json()) as SSOConfig;
    if (!data?.corsOrigins || !Array.isArray(data.corsOrigins)) {
      console.error('[SSO Config] Invalid response: corsOrigins required');
      throw new Error('Invalid SSO config: corsOrigins required');
    }

    cachedConfig = {
      services: data.services ?? {},
      redirectUris: Array.isArray(data.redirectUris) ? data.redirectUris : [],
      corsOrigins: data.corsOrigins
    };
    cacheExpiry = now + CACHE_TTL_MS;
    console.log('[SSO Config] Loaded:', {
      servicesCount: Object.keys(cachedConfig.services ?? {}).length,
      redirectUrisCount: (cachedConfig.redirectUris ?? []).length,
      corsOriginsCount: cachedConfig.corsOrigins.length
    });
    return cachedConfig;
  } catch (err) {
    console.error('[SSO Config] Fetch failed:', err);
    throw err;
  }
}

/**
 * Check if URI is localhost (for dev fallback).
 */
function isLocalhostUri(uri: string): boolean {
  try {
    const url = new URL(uri);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

/**
 * Check if redirect_uri is allowed (from backend config).
 * In development, when backend config is unavailable, allows localhost URIs from SSO_REDIRECT_URIS env or any localhost.
 */
export async function isRedirectUriAllowedFromApi(
  redirectUri: string,
  service?: string
): Promise<boolean> {
  let config: SSOConfig;
  try {
    config = await getSSOConfig();
  } catch (err) {
    // Fallback when backend is unavailable (e.g. local dev without backend)
    const envUris = process.env.SSO_REDIRECT_URIS?.split(',').map((u) => u.trim()).filter(Boolean);
    if (envUris?.length) {
      const normalized = redirectUri.replace(/\/$/, '') || redirectUri;
      const allowed = envUris.some(
        (u) => {
          const n = u.replace(/\/$/, '') || u;
          return normalized === n || normalized.startsWith(n + '/');
        }
      );
      console.log('[SSO Config] API unavailable, using SSO_REDIRECT_URIS:', { redirectUri, allowed });
      return allowed;
    }
    if (process.env.NODE_ENV === 'development' && isLocalhostUri(redirectUri)) {
      console.log('[SSO Config] API unavailable, dev fallback: allowing localhost:', redirectUri);
      return true;
    }
    throw err;
  }

  const normalize = (u: string) => u.replace(/\/$/, '') || u;
  const normalized = normalize(redirectUri);

  if (config.services && Object.keys(config.services).length > 0) {
    if (service) {
      const uris = config.services[service];
      if (!uris) {
        console.log('[SSO Config] Service not found:', service);
        return false;
      }
      const allowed = uris.some(
        (u) =>
          normalized === normalize(u) || normalized.startsWith(normalize(u) + '/')
      );
      console.log('[SSO Config] Check service:', { service, redirectUri, allowed });
      return allowed;
    }
    for (const [svc, uris] of Object.entries(config.services)) {
      if (
        uris.some(
          (u) =>
            normalized === normalize(u) ||
            normalized.startsWith(normalize(u) + '/')
        )
      ) {
        console.log('[SSO Config] Check redirectUri (services):', {
          redirectUri,
          matchedService: svc,
          allowed: true
        });
        return true;
      }
    }
  }

  if (config.redirectUris && config.redirectUris.length > 0) {
    const allowed = config.redirectUris.some(
      (u) =>
        normalized === normalize(u) || normalized.startsWith(normalize(u) + '/')
    );
    console.log('[SSO Config] Check redirectUri (redirectUris):', {
      redirectUri,
      allowed
    });
    return allowed;
  }

  console.log('[SSO Config] No matching redirectUri:', redirectUri);
  return false;
}

/**
 * Alias for compatibility with code that expects isRedirectUriAllowed.
 */
export const isRedirectUriAllowed = isRedirectUriAllowedFromApi;

/**
 * Returns allowed CORS origins from backend config.
 * Fallback: SSO_CORS_ORIGINS env or localhost in dev.
 */
export async function getCorsOrigins(): Promise<string[]> {
  try {
    const config = await getSSOConfig();
    return config.corsOrigins ?? [];
  } catch (err) {
    const envOrigins = process.env.SSO_CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean);
    if (envOrigins?.length) {
      console.log('[SSO Config] API unavailable, using SSO_CORS_ORIGINS');
      return envOrigins;
    }
    if (process.env.NODE_ENV === 'development') {
      console.log('[SSO Config] API unavailable, dev fallback: allowing localhost');
      return ['http://localhost:3000', 'http://127.0.0.1:3000'];
    }
    throw err;
  }
}
