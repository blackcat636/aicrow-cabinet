import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export const runtime = 'edge';

const API_URL = API_CONFIG.BASE_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    const response = await fetch(`${API_URL}/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, code })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Email verification failed' },
        { status: response.status }
      );
    }

    // Check for successful response with tokens
    // Backend returns status: 200 (not 0) for success
    if (data.status === 200 && data.data && data.data.accessToken) {
      const nextResponse = NextResponse.json(
        {
          user: data.data.user,
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          deviceId: data.data.deviceId,
          message: data.message || 'Email verified successfully'
        },
        { status: 200 }
      );

      // Set cookies
      nextResponse.cookies.set('access_token', data.data.accessToken, {
        path: '/',
        maxAge: 60 * 60, // 1 hour
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      nextResponse.cookies.set('refresh_token', data.data.refreshToken, {
        path: '/',
        maxAge: 365 * 24 * 60 * 60,
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
      { error: `Invalid response format: ${JSON.stringify(data)}` },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
