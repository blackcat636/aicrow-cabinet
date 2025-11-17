import { NextRequest, NextResponse } from 'next/server';
import { getTokens, removeTokens } from '@/lib/auth';

import { API_CONFIG } from '@/config/api';
import { decodeToken } from '@/lib/auth-utils';

export const runtime = 'edge';

const API_URL = API_CONFIG.BASE_URL;

export async function POST(request: NextRequest) {
  try {
    const { refreshToken, deviceId } = getTokens(request);

    if (!refreshToken || !deviceId) {
      return NextResponse.json(
        { error: 'No refresh token found' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId
      },
      body: JSON.stringify({ refreshToken, deviceId })
    });

    const data = await response.json();

    if (data.status === 200 && data.data) {
      const nextResponse = NextResponse.json(
        { message: 'Token refreshed successfully' },
        { status: 200 }
      );

      const nowSec = Math.floor(Date.now() / 1000);
      const accessExp = decodeToken(data.data.accessToken)?.exp;
      const refreshExp = decodeToken(data.data.refreshToken)?.exp;
      const accessMaxAge = accessExp ? Math.max(0, accessExp - nowSec) : 60 * 60;
      const refreshMaxAge = refreshExp ? Math.max(0, refreshExp - nowSec) : 365 * 24 * 60 * 60;

      // Set cookies
      nextResponse.cookies.set('access_token', data.data.accessToken, {
        path: '/',
        maxAge: accessMaxAge,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      nextResponse.cookies.set('refresh_token', data.data.refreshToken, {
        path: '/',
        maxAge: refreshMaxAge,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      nextResponse.cookies.set('device_id', deviceId, {
        path: '/',
        maxAge: 365 * 24 * 60 * 60,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      return nextResponse;
    } else {
      // If refresh token is invalid, clear all tokens
      if (data.status === 401) {
        const nextResponse = NextResponse.json(
          { error: 'Invalid refresh token' },
          { status: 401 }
        );
        // Clear cookies
        nextResponse.cookies.set('access_token', '', {
          path: '/',
          expires: new Date(0),
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          httpOnly: true
        });
        nextResponse.cookies.set('refresh_token', '', {
          path: '/',
          expires: new Date(0),
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          httpOnly: true
        });
        nextResponse.cookies.set('device_id', '', {
          path: '/',
          expires: new Date(0),
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        return nextResponse;
      }

      return NextResponse.json(
        { error: data.message || 'Token refresh failed' },
        { status: response.status }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
