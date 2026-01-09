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

    console.info(
      `${logPrefix} Incoming request`,
      JSON.stringify({
        redirectUri,
        service,
        requestOrigin,
        referer
      })
    );
    
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

    console.info(
      `${logPrefix} Forwarding to backend`,
      JSON.stringify({
        url: url.toString(),
        hasAccessToken: Boolean(accessToken)
      })
    );

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers
    });

    const data = await response.json();

    console.info(
      `${logPrefix} Backend response`,
      JSON.stringify({
        status: response.status,
        dataStatus: data?.status,
        hasLoginUrl: Boolean(data?.data?.loginUrl),
        hasRedirectUrl: Boolean(data?.data?.redirectUrl)
      })
    );
    
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

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`${logPrefix} Error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
