import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export const runtime = 'edge';

const API_URL = API_CONFIG.BASE_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Register error:', data);
      return NextResponse.json(
        { error: data.message || 'Registration failed' },
        { status: response.status }
      );
    }

    if (data.status === 200 && data.data) {
      // Set tokens in cookies
      const nextResponse = NextResponse.json(
        {
          user: data.data.user,
          message: 'Registration successful'
        },
        { status: 200 }
      );

      // Set cookies manually
      nextResponse.cookies.set('access_token', data.data.accessToken, {
        path: '/',
        maxAge: 60 * 60, // 1 hour
        secure: true,
        sameSite: 'strict'
      });
      nextResponse.cookies.set('refresh_token', data.data.refreshToken, {
        path: '/',
        maxAge: 365 * 24 * 60 * 60,
        secure: true,
        sameSite: 'strict'
      });
      nextResponse.cookies.set('device_id', data.data.deviceId, {
        path: '/',
        maxAge: 365 * 24 * 60 * 60,
        secure: true,
        sameSite: 'strict'
      });

      return nextResponse;
    }

    return NextResponse.json(
      { error: 'Invalid response format' },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ API Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
