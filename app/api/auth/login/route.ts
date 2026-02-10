import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';
import { decodeToken } from '@/lib/auth-utils';
import { createSSOCode, generateState } from '@/lib/sso';
import { isRedirectUriAllowed } from '@/config/sso';

export const runtime = 'edge';

const API_URL = API_CONFIG.BASE_URL;

function setAuthCookies(response: NextResponse, data: any) {
  const nowSec = Math.floor(Date.now() / 1000);
  const accessExp = decodeToken(data.data.accessToken)?.exp;
  const refreshExp = decodeToken(data.data.refreshToken)?.exp;
  const accessMaxAge = accessExp ? Math.max(0, accessExp - nowSec) : 60 * 60;
  const refreshMaxAge = refreshExp
    ? Math.max(0, refreshExp - nowSec)
    : 365 * 24 * 60 * 60;

  response.cookies.set('access_token', data.data.accessToken, {
    path: '/',
    maxAge: accessMaxAge,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  response.cookies.set('refresh_token', data.data.refreshToken, {
    path: '/',
    maxAge: refreshMaxAge,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  response.cookies.set('device_id', data.data.deviceId, {
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
}

export async function POST(request: NextRequest) {
  const logPrefix = '[Login API]';

  try {
    const body = await request.json();
    const redirectUri = request.nextUrl.searchParams.get('redirect_uri');
    const service = request.nextUrl.searchParams.get('service') || undefined;
    const state = request.nextUrl.searchParams.get('state') || generateState();

    const loginUrl = new URL(`${API_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`);
    const response = await fetch(loginUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      redirect: 'manual'
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`${logPrefix} Login failed:`, data.message);
      return NextResponse.json(
        { error: data.message || 'Login failed' },
        { status: response.status }
      );
    }

    if (data.status !== 200 || !data.data) {
      return NextResponse.json(
        { error: 'Invalid response format' },
        { status: 400 }
      );
    }

    // SSO flow: redirect_uri present and credentials valid
    if (redirectUri && isRedirectUriAllowed(redirectUri, service)) {
      try {
        const userId = data.data.user?.id != null
          ? (typeof data.data.user.id === 'string'
              ? parseInt(data.data.user.id, 10)
              : data.data.user.id)
          : undefined;
        const code = await createSSOCode(
          data.data.accessToken,
          redirectUri,
          service,
          userId
        );
        const ssoRedirectUrl = new URL(redirectUri);
        ssoRedirectUrl.searchParams.set('code', code);
        ssoRedirectUrl.searchParams.set('state', state);

        const nextResponse = NextResponse.json(
          {
            status: 200,
            data: { redirectUrl: ssoRedirectUrl.toString() }
          },
          { status: 200 }
        );
        setAuthCookies(nextResponse, data);
        return nextResponse;
      } catch (ssoError) {
        console.error(`${logPrefix} SSO code generation failed:`, ssoError);
      }
    }

    // Normal login
    const nextResponse = NextResponse.json(
      { user: data.data.user, message: 'Login successful' },
      { status: 200 }
    );
    setAuthCookies(nextResponse, data);
    return nextResponse;
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
