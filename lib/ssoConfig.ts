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
    return cachedConfig;
  }

  try {
    const res = await fetch(SSO_CONFIG_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`SSO config fetch failed: ${res.status}`);
    }

    const data = (await res.json()) as SSOConfig;
    if (!data?.corsOrigins || !Array.isArray(data.corsOrigins)) {
      throw new Error('Invalid SSO config: corsOrigins required');
    }

    cachedConfig = {
      services: data.services ?? {},
      redirectUris: Array.isArray(data.redirectUris) ? data.redirectUris : [],
      corsOrigins: data.corsOrigins
    };
    cacheExpiry = now + CACHE_TTL_MS;
    return cachedConfig;
  } catch (err) {
    console.error('[SSO Config] Fetch failed:', err);
    throw err;
  }
}

/**
 * Check if redirect_uri is allowed (from backend config).
 */
export async function isRedirectUriAllowedFromApi(
  redirectUri: string,
  service?: string
): Promise<boolean> {
  const config = await getSSOConfig();
  const normalize = (u: string) => u.replace(/\/$/, '') || u;
  const normalized = normalize(redirectUri);

  if (config.services && Object.keys(config.services).length > 0) {
    if (service) {
      const uris = config.services[service];
      if (!uris) return false;
      return uris.some(
        (u) =>
          normalized === normalize(u) || normalized.startsWith(normalize(u) + '/')
      );
    }
    for (const uris of Object.values(config.services)) {
      if (
        uris.some(
          (u) =>
            normalized === normalize(u) ||
            normalized.startsWith(normalize(u) + '/')
        )
      ) {
        return true;
      }
    }
  }

  if (config.redirectUris && config.redirectUris.length > 0) {
    return config.redirectUris.some(
      (u) =>
        normalized === normalize(u) || normalized.startsWith(normalize(u) + '/')
    );
  }

  return false;
}
