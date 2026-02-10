import { NextRequest, NextResponse } from 'next/server';
import { verifySSOCode, createServiceToken } from '@/lib/sso';
import { isRedirectUriAllowed, SSO_CORS_ORIGINS } from '@/config/sso';

export const runtime = 'edge';

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin =
    origin && SSO_CORS_ORIGINS.includes(origin) ? origin : SSO_CORS_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin)
  });
}

/**
 * POST /auth/sso/exchange
 * Exchange SSO code for service token (JWT, 90 days)
 * CORS-enabled for cross-origin requests from external services.
 * Body: { code: string, redirect_uri: string }
 */
const LOG_PREFIX = '[SSO Exchange]';

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    const body = await request.json();
    const code = body.code;
    const redirectUri = body.redirect_uri || body.redirectUri;

    if (!code || !redirectUri) {
      console.warn(`${LOG_PREFIX} Missing params:`, {
        code: !!code,
        redirectUri: !!redirectUri
      });
      const res = NextResponse.json(
        { error: 'code and redirect_uri are required' },
        { status: 400 }
      );
      Object.entries(getCorsHeaders(origin)).forEach(([k, v]) =>
        res.headers.set(k, v)
      );
      return res;
    }

    if (!isRedirectUriAllowed(redirectUri)) {
      console.warn(`${LOG_PREFIX} Redirect URI not allowed:`, redirectUri);
      const res = NextResponse.json(
        {
          error: 'Invalid redirect URI. Service not found or URI not allowed.'
        },
        { status: 400 }
      );
      Object.entries(getCorsHeaders(origin)).forEach(([k, v]) =>
        res.headers.set(k, v)
      );
      return res;
    }

    const payload = await verifySSOCode(code, redirectUri);
    const serviceToken = await createServiceToken(
      payload.userId,
      payload.service
    );

    const responseData = {
      status: 200,
      serviceToken,
      token: serviceToken,
      data: {
        serviceToken,
        token: serviceToken,
        userId: payload.userId,
        serviceName: payload.service
      }
    };

    const res = NextResponse.json(responseData);
    Object.entries(getCorsHeaders(origin)).forEach(([k, v]) =>
      res.headers.set(k, v)
    );
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status =
      message.includes('redirect_uri mismatch') ||
      message.includes('Invalid code')
        ? 400
        : 500;
    console.error(`${LOG_PREFIX} Error:`, {
      message,
      status,
      stack: error instanceof Error ? error.stack : undefined
    });
    const res = NextResponse.json(
      {
        error:
          status === 400 ? 'Invalid or expired code' : 'Internal server error'
      },
      { status }
    );
    Object.entries(getCorsHeaders(origin)).forEach(([k, v]) =>
      res.headers.set(k, v)
    );
    return res;
  }
}
