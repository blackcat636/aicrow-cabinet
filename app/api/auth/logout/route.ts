import { NextRequest, NextResponse } from 'next/server';
import { getTokens, removeTokens } from '@/lib/auth';
import { API_CONFIG } from '@/config/api';

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
