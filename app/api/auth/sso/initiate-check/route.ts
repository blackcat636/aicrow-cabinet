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

export const runtime = 'edge';

const API_URL = API_CONFIG.BASE_URL;

export async function GET(request: NextRequest) {
  const logPrefix = '[SSO Initiate Check API]';
  
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
          
          // Preserve ALL query parameters and hash
          const path = loginUrlObj.pathname + loginUrlObj.search + loginUrlObj.hash;
          data.data.loginUrl = `${frontendOrigin}${path}`;
          
        } else {
          // Even if loginUrl points to frontend, ensure redirect_uri and service are present
          // If they're missing, add them from the original request
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
      } catch (error) {
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
