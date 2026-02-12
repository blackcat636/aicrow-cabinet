import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';
import { decodeToken } from '@/lib/auth-utils';

export const runtime = 'edge';

const API_URL = API_CONFIG.BASE_URL;

export async function POST(request: NextRequest) {
  const logPrefix = '[Login API]';

  const getFrontendOrigin = (req: NextRequest, requestOrigin?: string): string => {
    // Prefer explicit Origin header, fallback to request URL
    if (requestOrigin) {
      try {
        const originUrl = new URL(requestOrigin);
        return originUrl.origin;
      } catch {
        // ignore and fallback below
      }
    }
    try {
      const reqUrl = new URL(req.url);
      return reqUrl.origin;
    } catch {
      return '';
    }
  };

  try {
    const body = await request.json();
    const redirectUri = request.nextUrl.searchParams.get('redirect_uri');
    const service = request.nextUrl.searchParams.get('service');
    const requestOrigin = request.headers.get('origin') || undefined;
    const frontendOrigin = getFrontendOrigin(request, requestOrigin);

    const url = new URL(`${API_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`);
    if (redirectUri) {
      url.searchParams.set('redirect_uri', redirectUri);
    }
    if (service) {
      url.searchParams.set('service', service);
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      redirect: 'manual'
    });

    // Handle backend redirect responses explicitly (e.g., SSO flow)
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        let targetLocation = location;
        try {
          const locUrl = new URL(location);
          // If backend redirects to its own (api) origin, rewrite to frontend origin
          if (locUrl.origin === API_URL || locUrl.hostname.includes('api.')) {
            const path = locUrl.pathname + locUrl.search + locUrl.hash;
            targetLocation = `${frontendOrigin}${path}`;
          }
        } catch {
          // keep original if parsing fails
        }
        // Return JSON instead of redirect to avoid CORS/opaqueredirect issues on fetch.
        return NextResponse.json(
          {
            status: response.status,
            data: { redirectUrl: targetLocation }
          },
          { status: 200 }
        );
      }
    }

    interface LoginResponse {
      data?: {
        redirectUrl?: string;
        user?: unknown;
        accessToken?: string;
        refreshToken?: string;
        deviceId?: string;
      };
      status?: number;
      error?: string;
      message?: string;
    }

    let data: LoginResponse = {};
    try {
      data = (await response.json()) as LoginResponse;
    } catch {
      data = {};
    }

    if (!response.ok) {
      const errorMessage = data?.error || data?.message || 'Login failed';
      console.error(`${logPrefix} Login failed:`, errorMessage, data);
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // If backend returns redirectUrl in payload (SSO flow)
    if (data?.data?.redirectUrl) {
      let targetLocation = data.data.redirectUrl;
      try {
        const locUrl = new URL(data.data.redirectUrl);
        if (locUrl.origin === API_URL || locUrl.hostname.includes('api.')) {
          const path = locUrl.pathname + locUrl.search + locUrl.hash;
          targetLocation = `${frontendOrigin}${path}`;
        }
      } catch {
        // keep original if parsing fails
      }
      // Same approach: return JSON to let client navigate, avoiding cross-origin redirect in fetch.
      return NextResponse.json(
        {
          status: 200,
          data: { redirectUrl: targetLocation }
        },
        { status: 200 }
      );
    }

    const responseData = data.data;
    if (data.status === 200 && responseData?.accessToken && responseData?.refreshToken && responseData?.deviceId) {
      // Set tokens in cookies
      const nextResponse = NextResponse.json(
        {
          user: responseData.user,
          message: 'Login successful'
        },
        { status: 200 }
      );

      const nowSec = Math.floor(Date.now() / 1000);
      const accessExp = decodeToken(responseData.accessToken)?.exp;
      const refreshExp = decodeToken(responseData.refreshToken)?.exp;
      const accessMaxAge = accessExp
        ? Math.max(0, accessExp - nowSec)
        : 60 * 60;
      const refreshMaxAge = refreshExp
        ? Math.max(0, refreshExp - nowSec)
        : 365 * 24 * 60 * 60;

      nextResponse.cookies.set('access_token', responseData.accessToken, {
        path: '/',
        maxAge: accessMaxAge,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      nextResponse.cookies.set('refresh_token', responseData.refreshToken, {
        path: '/',
        maxAge: refreshMaxAge,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      nextResponse.cookies.set('device_id', responseData.deviceId, {
        path: '/',
        maxAge: 365 * 24 * 60 * 60,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      return nextResponse;
    }

    return NextResponse.json(
      { error: 'Invalid response format' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
