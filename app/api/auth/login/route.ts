import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';
import { decodeToken } from '@/lib/auth-utils';

export const runtime = 'edge';

const API_URL = API_CONFIG.BASE_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Login failed' },
        { status: response.status }
      );
    }

    if (data.status === 200 && data.data) {
      // Set tokens in cookies
      const nextResponse = NextResponse.json(
        {
          user: data.data.user,
          message: 'Login successful'
        },
        { status: 200 }
      );

      const nowSec = Math.floor(Date.now() / 1000);
      const accessExp = decodeToken(data.data.accessToken)?.exp;
      const refreshExp = decodeToken(data.data.refreshToken)?.exp;
      const accessMaxAge = accessExp
        ? Math.max(0, accessExp - nowSec)
        : 60 * 60;
      const refreshMaxAge = refreshExp
        ? Math.max(0, refreshExp - nowSec)
        : 365 * 24 * 60 * 60;

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

      nextResponse.cookies.set('device_id', data.data.deviceId, {
        path: '/',
        maxAge: 365 * 24 * 60 * 60,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      return nextResponse;
    }

    return NextResponse.json(
      { error: 'Invalid response format' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
