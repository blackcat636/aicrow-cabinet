import { NextRequest, NextResponse } from 'next/server';
import { getTokens, removeTokens } from '@/lib/auth';

export const runtime = 'edge';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010';

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
      } catch (error) {
        console.warn(
          '⚠️ API Logout warning: Could not reach external API',
          error
        );
      }
    }

    // Clear tokens regardless of external API response
    const nextResponse = NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );

    // Clear cookies manually
    nextResponse.cookies.set('access_token', '', {
      path: '/',
      expires: new Date(0),
      secure: true,
      sameSite: 'strict'
    });
    nextResponse.cookies.set('refresh_token', '', {
      path: '/',
      expires: new Date(0),
      secure: true,
      sameSite: 'strict'
    });
    nextResponse.cookies.set('device_id', '', {
      path: '/',
      expires: new Date(0),
      secure: true,
      sameSite: 'strict'
    });

    return nextResponse;
  } catch (error) {
    console.error('❌ API Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
