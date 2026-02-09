/**
 * SSO Initiate API Route (Frontend proxy)
 *
 * Calls backend /auth/sso/initiate and forwards the redirect back to the browser.
 */

import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';
import { getTokens } from '@/lib/auth';
import { normalizeRedirectUri } from '@/config/site';

export const runtime = 'edge';

const API_URL = API_CONFIG.BASE_URL;

const getFrontendOrigin = (req: NextRequest, requestOrigin?: string): string => {
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

const rewriteLocationToFrontend = (location: string, frontendOrigin: string): string => {
  try {
    const locUrl = new URL(location);
    if (locUrl.origin === API_URL || locUrl.hostname.includes('api.')) {
      const path = locUrl.pathname + locUrl.search + locUrl.hash;
      return `${frontendOrigin}${path}`;
    }
  } catch {
    // keep original
  }

  return location;
};

export async function GET(request: NextRequest) {
  const logPrefix = '[SSO Initiate API]';

  try {
    let redirectUri = request.nextUrl.searchParams.get('redirect_uri');
    const service = request.nextUrl.searchParams.get('service');
    const requestOrigin = request.headers.get('origin') || undefined;
    const frontendOrigin = getFrontendOrigin(request, requestOrigin);

    if (!redirectUri) {
      return NextResponse.json({ error: 'redirect_uri is required' }, { status: 400 });
    }

    try {
      redirectUri = normalizeRedirectUri(redirectUri, requestOrigin);
    } catch (error: any) {
      return NextResponse.json(
        {
          error: error?.message || 'Invalid redirect_uri',
          message: error?.message || 'Invalid redirect_uri'
        },
        { status: 400 }
      );
    }

    const { accessToken } = getTokens(request);

    const url = new URL(`${API_URL}/auth/sso/initiate`);
    url.searchParams.set('redirect_uri', redirectUri);
    if (service) {
      url.searchParams.set('service', service);
    }

    const headers: HeadersInit = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      redirect: 'manual'
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        console.error(`${logPrefix} Redirect response without location header`);
        return NextResponse.json({ error: 'Missing redirect location' }, { status: 502 });
      }

      const targetLocation = rewriteLocationToFrontend(location, frontendOrigin);
      return NextResponse.redirect(targetLocation, response.status as 301 | 302 | 303 | 307 | 308);
    }

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: response.status });
    } catch {
      return NextResponse.json(
        { error: 'Unexpected response from SSO initiate', details: text },
        { status: response.status || 500 }
      );
    }
  } catch (error) {
    console.error('[SSO Initiate API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
