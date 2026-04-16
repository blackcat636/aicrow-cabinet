import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';
import { decodeToken } from '@/lib/auth-utils';
import {
  getAuthTokenCookieOptions,
  getDeviceCookieOptions
} from '@/lib/auth-cookies';

export const runtime = 'edge';

const API_URL = API_CONFIG.BASE_URL.replace(/\/$/, '');
type JsonObject = Record<string, unknown>;

interface LoginPayload {
  accessToken: string;
  refreshToken: string;
  deviceId: string;
  user: unknown;
  redirectUrl?: string;
}

interface BackendLoginResponse {
  status?: number;
  message?: string;
  data?: LoginPayload;
}

const isRecord = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null;

const readErrorMessage = (payload: unknown, fallback: string): string => {
  if (!isRecord(payload)) {
    return fallback;
  }
  const message = payload.message;
  const error = payload.error;
  if (typeof message === 'string' && message.length > 0) {
    return message;
  }
  if (typeof error === 'string' && error.length > 0) {
    return error;
  }
  return fallback;
};

const toBackendLoginResponse = (payload: unknown): BackendLoginResponse => {
  if (!isRecord(payload)) {
    return {};
  }
  return payload as BackendLoginResponse;
};
const isAbsoluteHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const resolveRedirectTarget = (
  location: string,
  frontendOrigin: string,
  redirectUri?: string | null
): string => {
  try {
    const locUrl = new URL(location, API_URL);
    if (locUrl.origin !== API_URL) {
      return locUrl.toString();
    }

    const path = locUrl.pathname + locUrl.search + locUrl.hash;
    const hasSsoCodeOrState =
      locUrl.searchParams.has('code') || locUrl.searchParams.has('state');

    // For SSO callback redirects, prefer callback origin from redirect_uri.
    if (hasSsoCodeOrState && redirectUri && isAbsoluteHttpUrl(redirectUri)) {
      const redirectUriObj = new URL(redirectUri);
      return `${redirectUriObj.origin}${path}`;
    }

    // For auth pages and other internal redirects, keep frontend origin.
    return `${frontendOrigin}${path}`;
  } catch {
    return location;
  }
};

export async function POST(request: NextRequest) {
  const getFrontendOrigin = (
    req: NextRequest,
    requestOrigin?: string
  ): string => {
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
        const targetLocation = resolveRedirectTarget(
          location,
          frontendOrigin,
          redirectUri
        );
        return NextResponse.json(
          { status: response.status, data: { redirectUrl: targetLocation } },
          { status: 200 }
        );
      }
    }

    const rawData: unknown = await response.json();
    const data = toBackendLoginResponse(rawData);
    if (!response.ok) {
      return NextResponse.json(
        { error: readErrorMessage(rawData, 'Login failed') },
        { status: response.status }
      );
    }

    // If backend returns redirectUrl in payload (SSO flow)
    if (data.data?.redirectUrl) {
      const targetLocation = resolveRedirectTarget(
        data.data.redirectUrl,
        frontendOrigin,
        redirectUri
      );
      return NextResponse.json(
        {
          status: 200,
          data: { redirectUrl: targetLocation }
        },
        { status: 200 }
      );
    }

    if (
      data.status === 200 &&
      data.data &&
      typeof data.data.accessToken === 'string' &&
      typeof data.data.refreshToken === 'string' &&
      typeof data.data.deviceId === 'string'
    ) {
      // Set tokens in cookies
      const nextResponse = NextResponse.json(
        {
          user: data.data.user,
          message: 'Login successful'
        },
        { status: 200 }
      );

      const nowSec = Math.floor(Date.now() / 1000);
      const accessExp = decodeToken(data.data.accessToken)?.exp;
      const refreshExp = decodeToken(data.data.refreshToken)?.exp;
      const accessMaxAge = accessExp
        ? Math.max(0, accessExp - nowSec)
        : 60 * 60;
      const refreshMaxAge = refreshExp
        ? Math.max(0, refreshExp - nowSec)
        : 365 * 24 * 60 * 60;

      nextResponse.cookies.set('access_token', data.data.accessToken, {
        ...getAuthTokenCookieOptions(accessMaxAge)
      });

      nextResponse.cookies.set('refresh_token', data.data.refreshToken, {
        ...getAuthTokenCookieOptions(refreshMaxAge)
      });

      nextResponse.cookies.set('device_id', data.data.deviceId, {
        ...getDeviceCookieOptions(365 * 24 * 60 * 60)
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
