import * as jose from 'jose';
import { decodeToken } from './auth-utils';

const CODE_EXPIRY_SEC = 600; // 10 min
const SERVICE_TOKEN_EXPIRY_SEC = 90 * 24 * 60 * 60; // 90 days

function getSecret(): Uint8Array {
  const secret = process.env.SSO_SECRET || process.env.NEXTAUTH_SECRET;
  if (secret) {
    return new TextEncoder().encode(secret);
  }
  if (process.env.NODE_ENV === 'development') {
    return new TextEncoder().encode('dev-sso-secret-change-in-production');
  }
  throw new Error('SSO_SECRET or NEXTAUTH_SECRET must be set for SSO');
}

export interface CodePayload {
  userId: number;
  redirectUri: string;
  service?: string;
  exp: number;
  iat: number;
}

export async function createSSOCode(
  accessToken: string,
  redirectUri: string,
  service?: string,
  userIdOverride?: number
): Promise<string> {
  let userId: number | string | undefined = userIdOverride;
  if (userId === undefined) {
    const decoded = decodeToken(accessToken);
    userId = decoded?.sub;
  }
  if (userId === undefined || userId === null) {
    throw new Error('Invalid access token');
  }
  const secret = getSecret();
  const jwt = await new jose.SignJWT({
    redirect_uri: redirectUri,
    service: service || null
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${CODE_EXPIRY_SEC}s`)
    .sign(secret);
  return jwt;
}

function normalizeUri(u: string): string {
  try {
    const url = new URL(u);
    url.hash = '';
    let p = url.pathname;
    if (p.endsWith('/') && p.length > 1) p = p.slice(0, -1);
    return `${url.origin}${p}${url.search}`;
  } catch {
    return u;
  }
}

export async function verifySSOCode(
  code: string,
  redirectUri: string
): Promise<CodePayload> {
  const secret = getSecret();
  const { payload } = await jose.jwtVerify(code, secret);
  const codeRedirectUri = payload.redirect_uri as string;
  if (normalizeUri(codeRedirectUri) !== normalizeUri(redirectUri)) {
    throw new Error('redirect_uri mismatch');
  }
  const sub = payload.sub;
  if (!sub) throw new Error('Invalid code');
  return {
    userId: parseInt(sub, 10),
    redirectUri: codeRedirectUri,
    service: payload.service as string | undefined,
    exp: payload.exp as number,
    iat: payload.iat as number
  };
}

export async function createServiceToken(userId: number, service?: string): Promise<string> {
  const secret = getSecret();
  return new jose.SignJWT({
    type: 'service',
    service: service || null
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${SERVICE_TOKEN_EXPIRY_SEC}s`)
    .sign(secret);
}

export function generateState(): string {
  const array = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}
