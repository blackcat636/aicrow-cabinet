import { NextRequest, NextResponse } from 'next/server';
import { verifySSOCode, createServiceToken } from '@/lib/sso';
import { isRedirectUriAllowed } from '@/lib/ssoConfig';

export const runtime = 'edge';

/**
 * POST /api/auth/sso/exchange
 * Exchange SSO code for service token (JWT, 90 days)
 * Body: { code: string, redirect_uri: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = body.code;
    const redirectUri = body.redirect_uri || body.redirectUri;

    if (!code || !redirectUri) {
      return NextResponse.json(
        { error: 'code and redirect_uri are required' },
        { status: 400 }
      );
    }

    const allowed = await isRedirectUriAllowed(redirectUri);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Invalid redirect URI. Service not found or URI not allowed.' },
        { status: 400 }
      );
    }

    const payload = await verifySSOCode(code, redirectUri);
    const serviceToken = await createServiceToken(payload.userId, payload.service);

    return NextResponse.json({
      status: 200,
      data: {
        serviceToken,
        userId: payload.userId,
        serviceName: payload.service
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('redirect_uri mismatch') || message.includes('Invalid code')) {
      return NextResponse.json(
        { error: 'Invalid or expired code' },
        { status: 400 }
      );
    }
    console.error('[SSO Exchange] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
