import { NextRequest, NextResponse } from 'next/server';
import { getTokens, setTokens, removeTokens } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010';

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

      setTokens(
        {
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          deviceId: deviceId
        },
        nextResponse
      );

      return nextResponse;
    } else {
      // If refresh token is invalid, clear all tokens
      if (data.status === 401) {
        const nextResponse = NextResponse.json(
          { error: 'Invalid refresh token' },
          { status: 401 }
        );
        removeTokens(nextResponse);
        return nextResponse;
      }

      return NextResponse.json(
        { error: data.message || 'Token refresh failed' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ API Refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
