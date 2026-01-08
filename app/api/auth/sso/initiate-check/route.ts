/**
 * SSO Initiate Check API Route
 * 
 * This is an INTERNAL API endpoint called by the frontend SSO initiate page.
 * External services should NOT call this directly - they should redirect to:
 * {MAIN_FRONTEND_URL}/sso/initiate or {MAIN_FRONTEND_URL}/auth/sso/initiate
 * 
 * The backend URL is hidden from the user - they only see frontend URLs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';
import { getTokens } from '@/lib/auth';
import { normalizeRedirectUri } from '@/config/site';

export const runtime = 'edge';

const API_URL = API_CONFIG.BASE_URL;

export async function GET(request: NextRequest) {
  const logPrefix = '[SSO Initiate Check API]';
  
  try {
    let redirectUri = request.nextUrl.searchParams.get('redirect_uri');
    const service = request.nextUrl.searchParams.get('service');
    const requestOrigin = request.headers.get('origin') || request.url;
    const referer = request.headers.get('referer');
    
    console.log(`${logPrefix} Request received:`, {
      redirectUri: redirectUri,
      service: service,
      origin: requestOrigin,
      referer: referer,
      url: request.url,
      method: request.method
    });

    if (!redirectUri) {
      console.error(`${logPrefix} Missing redirect_uri parameter`);
      return NextResponse.json(
        { error: 'redirect_uri is required' },
        { status: 400 }
      );
    }

    // Normalize redirect_uri - replace localhost with correct environment URL
    const originalRedirectUri = redirectUri;
    redirectUri = normalizeRedirectUri(redirectUri, requestOrigin);
    
    console.log(`${logPrefix} Redirect URI normalized:`, {
      original: originalRedirectUri,
      normalized: redirectUri
    });

    const { accessToken } = getTokens(request);
    
    console.log(`${logPrefix} Token check:`, {
      hasAccessToken: !!accessToken,
      tokenPreview: accessToken ? `${accessToken.substring(0, 20)}...` : 'none'
    });

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

    console.log(`${logPrefix} Calling backend:`, {
      url: url.toString(),
      hasAuth: !!accessToken
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers
    });

    const data = await response.json();
    
    console.log(`${logPrefix} Backend response:`, {
      status: response.status,
      hasRedirectUrl: !!data?.data?.redirectUrl,
      hasLoginUrl: !!data?.data?.loginUrl,
      message: data?.message
    });

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`${logPrefix} Error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
