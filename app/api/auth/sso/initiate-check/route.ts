import { NextRequest, NextResponse } from 'next/server';
import { createSSOCode, generateState } from '@/lib/sso';
import { isRedirectUriAllowed } from '@/lib/ssoConfig';
import { decodeToken, type TokenPayload } from '@/lib/auth-utils';

export const runtime = 'edge';

const LOG_PREFIX = '[SSO Initiate-Check]';

/**
 * GET /api/auth/sso/initiate-check?redirect_uri=...&service=...&state=...
 * Checks if user is authenticated and redirect_uri is allowed.
 * - 200 + redirectUrl: user logged in, redirect to callback with code
 * - 401 + loginUrl: user not authenticated, redirect to login
 * - 400: invalid redirect_uri
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const redirectUri = url.searchParams.get('redirect_uri');
  const service = url.searchParams.get('service') || undefined;
  const state = url.searchParams.get('state') || generateState();

  console.log(`${LOG_PREFIX} Request:`, { redirectUri, service, state: state?.slice(0, 8) + '...' });

  if (!redirectUri) {
    console.warn(`${LOG_PREFIX} Missing redirect_uri`);
    return NextResponse.json(
      { status: 400, message: 'redirect_uri is required' },
      { status: 400 }
    );
  }

  try {
    const allowed = await isRedirectUriAllowed(redirectUri, service);
    console.log(`${LOG_PREFIX} redirect_uri allowed:`, allowed);

    if (!allowed) {
      return NextResponse.json(
        { status: 400, message: 'Redirect URI not allowed or service not configured' },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error(`${LOG_PREFIX} isRedirectUriAllowed failed:`, err);
    return NextResponse.json(
      { status: 500, message: 'Failed to validate redirect URI' },
      { status: 500 }
    );
  }

  const accessToken = request.cookies.get('access_token')?.value;
  const origin = url.origin;

  if (!accessToken) {
    console.log(`${LOG_PREFIX} No access_token cookie, redirecting to login`);
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('redirect_uri', redirectUri);
    if (service) loginUrl.searchParams.set('service', service);
    loginUrl.searchParams.set('state', state);

    return NextResponse.json({
      status: 401,
      data: { loginUrl: loginUrl.toString() }
    });
  }

  let decoded: TokenPayload | null = null;
  try {
    decoded = decodeToken(accessToken);
    const exp = decoded?.exp;
    const now = Math.floor(Date.now() / 1000);
    if (!exp || exp <= now) {
      console.log(`${LOG_PREFIX} access_token expired (exp=${exp}, now=${now})`);
      const loginUrl = new URL('/login', origin);
      loginUrl.searchParams.set('redirect_uri', redirectUri);
      if (service) loginUrl.searchParams.set('service', service);
      loginUrl.searchParams.set('state', state);

      return NextResponse.json({
        status: 401,
        data: { loginUrl: loginUrl.toString() }
      });
    }
  } catch (decodeErr) {
    console.warn(`${LOG_PREFIX} access_token decode failed:`, decodeErr);
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('redirect_uri', redirectUri);
    if (service) loginUrl.searchParams.set('service', service);
    loginUrl.searchParams.set('state', state);

    return NextResponse.json({
      status: 401,
      data: { loginUrl: loginUrl.toString() }
    });
  }

  try {
    const userId = decoded?.sub != null
      ? (typeof decoded.sub === 'string' ? parseInt(decoded.sub, 10) : decoded.sub)
      : undefined;
    const code = await createSSOCode(accessToken, redirectUri, service, userId);

    const redirectUrl = new URL(redirectUri);
    redirectUrl.searchParams.set('code', code);
    redirectUrl.searchParams.set('state', state);

    console.log(`${LOG_PREFIX} Success: redirecting to callback`);
    return NextResponse.json({
      status: 200,
      data: { redirectUrl: redirectUrl.toString() }
    });
  } catch (err) {
    console.error(`${LOG_PREFIX} createSSOCode failed:`, err);
    return NextResponse.json(
      { status: 500, message: 'Failed to create SSO code' },
      { status: 500 }
    );
  }
}
