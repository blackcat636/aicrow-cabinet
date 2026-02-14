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

export async function GET(request: NextRequest) {
  try {
    const redirectUri = request.nextUrl.searchParams.get('redirect_uri');
    const service = request.nextUrl.searchParams.get('service');
    const requestOrigin = request.headers.get('origin') || request.url;

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

        if (loginUrlObj.origin === API_ORIGIN) {
          let frontendOrigin: string;
          try {
            if (requestOrigin) {
              const originUrl = new URL(requestOrigin);
              frontendOrigin = originUrl.origin;
            } else {
              const requestUrl = new URL(request.url);
              frontendOrigin = requestUrl.origin;
            }
          } catch {
            const requestUrl = new URL(request.url);
            frontendOrigin = requestUrl.origin;
          }

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

    if (data?.data?.redirectUrl) {
      try {
        const redirectUrlObj = new URL(data.data.redirectUrl);
        if (redirectUrlObj.origin === API_ORIGIN) {
          let frontendOrigin: string;
          try {
            const originUrl = new URL(requestOrigin || request.url);
            frontendOrigin = originUrl.origin;
          } catch {
            const requestUrl = new URL(request.url);
            frontendOrigin = requestUrl.origin;
          }
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

    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
