import { NextRequest, NextResponse } from 'next/server';
import { getTokens } from '@/lib/auth';
import { isRedirectUriAllowed } from '@/config/sso';
import { createSSOCode, generateState } from '@/lib/sso';

export const runtime = 'edge';

function isValidRedirectUriFormat(uri: string): boolean {
  try {
    const url = new URL(uri);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * GET /api/auth/sso/initiate-check
 * Returns JSON: 401 {data: {loginUrl}} or 200 {data: {redirectUrl, code, state}}
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const redirectUri = url.searchParams.get('redirect_uri');
  const service = url.searchParams.get('service') || undefined;
  const state = url.searchParams.get('state') || generateState();

  if (!redirectUri || typeof redirectUri !== 'string' || !redirectUri.trim()) {
    return NextResponse.json(
      { status: 400, message: 'redirect_uri is required' },
      { status: 400 }
    );
  }

  if (!isValidRedirectUriFormat(redirectUri)) {
    return NextResponse.json(
      { status: 400, message: 'Invalid redirect_uri format' },
      { status: 400 }
    );
  }

  const allowed = await isRedirectUriAllowed(redirectUri, service);
  if (!allowed) {
    return NextResponse.json(
      { status: 400, message: 'Invalid redirect URI. Service not found or URI not allowed.' },
      { status: 400 }
    );
  }

  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;
  const { accessToken } = getTokens(request);
  const token = bearerToken || accessToken;

  if (!token) {
    const baseUrl = new URL(request.url).origin;
    const loginUrl = new URL('/login', baseUrl);
    loginUrl.searchParams.set('redirect_uri', redirectUri);
    loginUrl.searchParams.set('state', state);
    if (service) loginUrl.searchParams.set('service', service);
    return NextResponse.json(
      {
        status: 401,
        data: { loginUrl: loginUrl.toString() }
      },
      { status: 401 }
    );
  }

  try {
    const code = await createSSOCode(token, redirectUri, service);
    const redirectUrl = new URL(redirectUri);
    redirectUrl.searchParams.set('code', code);
    redirectUrl.searchParams.set('state', state);
    return NextResponse.json({
      status: 200,
      data: {
        redirectUrl: redirectUrl.toString(),
        code,
        state
      }
    });
  } catch (error) {
    console.error('[SSO Initiate-Check] Error:', error);
    return NextResponse.json(
      { status: 500, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
