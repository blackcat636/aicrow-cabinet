import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

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

      const cookieHeaders = [
        `access_token=${data.data.accessToken}; Path=/; Max-Age=${60 * 60}; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}SameSite=Strict`,
        `refresh_token=${data.data.refreshToken}; Path=/; Max-Age=${365 * 24 * 60 * 60}; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}SameSite=Strict`,
        `device_id=${data.data.deviceId}; Path=/; Max-Age=${365 * 24 * 60 * 60}; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}SameSite=Strict`
      ];

      cookieHeaders.forEach((cookie) => {
        nextResponse.headers.append('Set-Cookie', cookie);
      });

      return nextResponse;
    }

    console.error('❌ Invalid response format:', data);
    return NextResponse.json(
      { error: 'Invalid response format' },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ API Login error:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
