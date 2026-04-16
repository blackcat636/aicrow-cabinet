import { NextRequest, NextResponse } from 'next/server';
import { getTokens } from '@/lib/auth';
import { API_CONFIG } from '@/config/api';
import {
  getClearAuthTokenCookieOptions,
  getClearDeviceCookieOptions
} from '@/lib/auth-cookies';

export const runtime = 'edge';

const API_URL = API_CONFIG.BASE_URL;

export async function POST(request: NextRequest) {
  try {
    const { accessToken, deviceId } = getTokens(request);

    if (accessToken && deviceId) {
      // Try to logout from external API
      try {
        const response = await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            'x-device-id': deviceId
          }
        });
        if (!response.ok) {
          throw new Error('Logout failed');
        }
      } catch (error) {
        console.warn('Logout upstream call failed');
      }
    }

    // Clear tokens regardless of external API response
    const nextResponse = NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );

    // Clear cookies
    nextResponse.cookies.set('access_token', '', {
      ...getClearAuthTokenCookieOptions()
    });
    nextResponse.cookies.set('refresh_token', '', {
      ...getClearAuthTokenCookieOptions()
    });
    nextResponse.cookies.set('device_id', '', {
      ...getClearDeviceCookieOptions()
    });

    return nextResponse;
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
