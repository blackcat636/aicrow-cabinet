import { NextRequest, NextResponse } from 'next/server';
import { verifySSOCode, createServiceToken } from '@/lib/sso';
import { isRedirectUriAllowed, getCorsOrigins } from '@/lib/ssoConfig';

export const runtime = 'edge';

async function getCorsHeaders(origin: string | null): Promise<Record<string, string>> {
  const corsOrigins = await getCorsOrigins();
  const allowOrigin =
    origin && corsOrigins.includes(origin) ? origin : corsOrigins[0] || '*';
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
  const headers = await getCorsHeaders(origin);
  return new NextResponse(null, {
    status: 204,
    headers
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

    console.log(`${LOG_PREFIX} Request:`, { hasCode: !!code, redirectUri });

    if (!code || !redirectUri) {
      console.warn(`${LOG_PREFIX} Missing params:`, {
        code: !!code,
        redirectUri: !!redirectUri
      });
      const corsHeaders = await getCorsHeaders(origin);
      const res = NextResponse.json(
        { error: 'code and redirect_uri are required' },
        { status: 400 }
      );
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const allowed = await isRedirectUriAllowed(redirectUri);
    if (!allowed) {
      console.warn(`${LOG_PREFIX} Redirect URI not allowed:`, redirectUri);
      const corsHeaders = await getCorsHeaders(origin);
      const res = NextResponse.json(
        {
          error: 'Invalid redirect URI. Service not found or URI not allowed.'
        },
        { status: 400 }
      );
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const payload = await verifySSOCode(code, redirectUri);
    const serviceToken = await createServiceToken(
      payload.userId,
      payload.service
    );

    console.log(`${LOG_PREFIX} Success:`, { userId: payload.userId, service: payload.service });

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

    const corsHeaders = await getCorsHeaders(origin);
    const res = NextResponse.json(responseData);
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
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
    const corsHeaders = await getCorsHeaders(origin);
    const res = NextResponse.json(
      {
        error:
          status === 400 ? 'Invalid or expired code' : 'Internal server error'
      },
      { status }
    );
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}
