/**
 * SSO Initiate API Route
 *
 * Internal frontend proxy for SSO initiate-check backend endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';
import { getTokens } from '@/lib/auth';

export const runtime = 'edge';

const API_URL = API_CONFIG.BASE_URL;
const API_ORIGIN = (() => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return API_URL.replace(/\/$/, '');
  }
})();
const API_HOSTNAME = (() => {
  try {
    return new URL(API_URL).hostname;
  } catch {
    return '';
  }
})();

const getFrontendOrigin = (request: NextRequest, requestOrigin?: string) => {
  try {
    if (requestOrigin) {
      return new URL(requestOrigin).origin;
    }
  } catch {
    // Fall through to request URL.
  }
  return new URL(request.url).origin;
};

const normalizeBackendUrlToFrontend = (
  rawValue: string | undefined,
  frontendOrigin: string
): string | undefined => {
  if (!rawValue || typeof rawValue !== 'string') return rawValue;

  try {
    const parsed = new URL(rawValue);
    if (
      parsed.origin === API_ORIGIN ||
      (API_HOSTNAME && parsed.hostname === API_HOSTNAME)
    ) {
      const path = parsed.pathname + parsed.search + parsed.hash;
      return `${frontendOrigin}${path}`;
    }
    return parsed.toString();
  } catch {
    // Keep non-absolute values unchanged.
    return rawValue;
  }
};

export async function GET(request: NextRequest) {
  try {
    const redirectUri = request.nextUrl.searchParams.get('redirect_uri');
    const service = request.nextUrl.searchParams.get('service');
    const requestOrigin = request.headers.get('origin') || request.url;
    const frontendOrigin = getFrontendOrigin(request, requestOrigin);

    if (!redirectUri) {
      return NextResponse.json(
        { error: 'redirect_uri is required' },
        { status: 400 }
      );
    }

    const { accessToken } = getTokens(request);

    const url = new URL(
      `${API_URL}${API_CONFIG.ENDPOINTS.AUTH.SSO_INITIATE_CHECK}`
    );
    url.searchParams.set('redirect_uri', redirectUri);
    if (service) {
      url.searchParams.set('service', service);
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers
    });

    const data = await response.json();

    if (data?.data?.loginUrl) {
      try {
        const loginUrlObj = new URL(data.data.loginUrl);

        if (loginUrlObj.origin === API_ORIGIN || (API_HOSTNAME && loginUrlObj.hostname === API_HOSTNAME)) {
          const path =
            loginUrlObj.pathname + loginUrlObj.search + loginUrlObj.hash;
          data.data.loginUrl = `${frontendOrigin}${path}`;
        } else {
          const loginUrlParams = new URLSearchParams(loginUrlObj.search);
          if (!loginUrlParams.has('redirect_uri') && redirectUri) {
            loginUrlParams.set('redirect_uri', redirectUri);
            loginUrlObj.search = loginUrlParams.toString();
            data.data.loginUrl = loginUrlObj.toString();
          }
          if (!loginUrlParams.has('service') && service) {
            loginUrlParams.set('service', service);
            loginUrlObj.search = loginUrlParams.toString();
            data.data.loginUrl = loginUrlObj.toString();
          }
        }
      } catch {
        // Ignore invalid login URL format.
      }
    }

    if (typeof data?.loginUrl === 'string') {
      data.loginUrl = normalizeBackendUrlToFrontend(data.loginUrl, frontendOrigin);
    }

    if (typeof data?.data?.loginUrl === 'string') {
      data.data.loginUrl = normalizeBackendUrlToFrontend(
        data.data.loginUrl,
        frontendOrigin
      );
    }

    if (data?.data?.redirectUrl) {
      try {
        const redirectUrlObj = new URL(data.data.redirectUrl);
        if (
          redirectUrlObj.origin === API_ORIGIN ||
          (API_HOSTNAME && redirectUrlObj.hostname === API_HOSTNAME)
        ) {
          const path =
            redirectUrlObj.pathname +
            redirectUrlObj.search +
            redirectUrlObj.hash;
          data.data.redirectUrl = `${frontendOrigin}${path}`;
        }
      } catch {
        // Ignore invalid redirect URL format.
      }
    }

    if (typeof data?.data?.redirectUrl === 'string') {
      data.data.redirectUrl = normalizeBackendUrlToFrontend(
        data.data.redirectUrl,
        frontendOrigin
      );
    }

    if (typeof data?.redirectUrl === 'string') {
      data.redirectUrl = normalizeBackendUrlToFrontend(
        data.redirectUrl,
        frontendOrigin
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
