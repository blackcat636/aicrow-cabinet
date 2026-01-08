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
    try {
      redirectUri = normalizeRedirectUri(redirectUri, requestOrigin);
      console.log(`${logPrefix} Redirect URI normalized:`, {
        original: originalRedirectUri,
        normalized: redirectUri
      });
    } catch (error: any) {
      console.error(`${logPrefix} Failed to normalize redirect_uri:`, error);
      return NextResponse.json(
        { 
          error: error?.message || 'Invalid redirect_uri',
          message: error?.message || 'redirect_uri не може вказувати на внутрішні маршрути'
        },
        { status: 400 }
      );
    }

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
    
    console.log(`${logPrefix} 📦 Backend response (raw, full):`, JSON.stringify(data, null, 2));
    console.log(`${logPrefix} Backend response (raw, summary):`, {
      status: response.status,
      httpStatus: response.status,
      hasRedirectUrl: !!data?.data?.redirectUrl,
      hasLoginUrl: !!data?.data?.loginUrl,
      loginUrl: data?.data?.loginUrl,
      redirectUrl: data?.data?.redirectUrl,
      hasCode: !!data?.data?.code,
      hasState: !!data?.data?.state,
      code: data?.data?.code ? data.data.code.substring(0, 20) + '...' : null,
      state: data?.data?.state ? data.data.state.substring(0, 20) + '...' : null,
      message: data?.message,
      error: data?.error,
      fullData: data
    });

    // Normalize loginUrl - replace backend URL with frontend URL
    // Backend might return loginUrl pointing to backend, but we need frontend URL
    if (data?.data?.loginUrl) {
      try {
        const loginUrlObj = new URL(data.data.loginUrl);
        const originalLoginUrl = data.data.loginUrl;
        
        // If loginUrl points to backend domain, replace with frontend domain
        if (loginUrlObj.origin === API_URL || loginUrlObj.hostname.includes('api.')) {
          // Get frontend origin from request
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
            // Fallback to request URL origin
            const requestUrl = new URL(request.url);
            frontendOrigin = requestUrl.origin;
          }
          
          const path = loginUrlObj.pathname + loginUrlObj.search + loginUrlObj.hash;
          data.data.loginUrl = `${frontendOrigin}${path}`;
          console.log(`${logPrefix} LoginUrl normalized:`, {
            original: originalLoginUrl,
            normalized: data.data.loginUrl,
            frontendOrigin: frontendOrigin
          });
        }
      } catch (error) {
        console.warn(`${logPrefix} Failed to normalize loginUrl:`, error);
      }
    }

    // Normalize redirectUrl as well (in case backend returns backend URL)
    if (data?.data?.redirectUrl) {
      try {
        const redirectUrlObj = new URL(data.data.redirectUrl);
        // If redirectUrl points to backend domain, it's probably wrong
        if (redirectUrlObj.origin === API_URL || redirectUrlObj.hostname.includes('api.')) {
          console.warn(`${logPrefix} RedirectUrl points to backend, this might be wrong:`, data.data.redirectUrl);
        }
      } catch (error) {
        // Not a URL, skip
      }
    }

    console.log(`${logPrefix} ✅ Backend response (normalized, full):`, JSON.stringify(data, null, 2));
    console.log(`${logPrefix} Backend response (normalized, summary):`, {
      status: response.status,
      hasRedirectUrl: !!data?.data?.redirectUrl,
      hasLoginUrl: !!data?.data?.loginUrl,
      loginUrl: data?.data?.loginUrl,
      redirectUrl: data?.data?.redirectUrl,
      hasCode: !!data?.data?.code,
      hasState: !!data?.data?.state,
      message: data?.message,
      error: data?.error
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
