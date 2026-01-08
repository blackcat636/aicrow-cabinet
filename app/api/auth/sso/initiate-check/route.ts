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
  try {
    const redirectUri = request.nextUrl.searchParams.get('redirect_uri');
    const service = request.nextUrl.searchParams.get('service');

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

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
