/**
 * CORS: allowed origins for SSO exchange (cross-origin requests from external services)
 */
export const SSO_CORS_ORIGINS: string[] = [
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'https://contentzavod.example.com',
  ...(process.env.SSO_CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) || [])
];

/**
 * SSO External Services Registry
 * Service name -> allowed redirect URIs (whitelist)
 */
export const SSO_SERVICES: Record<string, string[]> = {
  ExternalClient: [
    'http://localhost:3001/callback',
    'http://localhost:3001/',
    'http://127.0.0.1:3001/callback',
    'http://127.0.0.1:3001/'
  ],
  ContentZavod: [
    'https://contentzavod.example.com/callback'
  ]
};

/**
 * Check if redirect_uri is allowed for the given service (or any service if service is empty)
 */
export function isRedirectUriAllowed(
  redirectUri: string,
  service?: string
): boolean {
  const normalize = (u: string) => u.replace(/\/$/, '') || u;
  const normalized = normalize(redirectUri);

  if (service) {
    const uris = SSO_SERVICES[service];
    if (!uris) return false;
    return uris.some(
      (u) => normalized === normalize(u) || normalized.startsWith(normalize(u) + '/')
    );
  }

  for (const uris of Object.values(SSO_SERVICES)) {
    if (uris.some((u) => normalized === normalize(u) || normalized.startsWith(normalize(u) + '/'))) {
      return true;
    }
  }
  return false;
}
