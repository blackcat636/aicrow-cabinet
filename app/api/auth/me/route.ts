import { NextRequest, NextResponse } from 'next/server';
import { getTokens } from '@/lib/auth';
import { API_CONFIG } from '@/config/api';

export const runtime = 'edge';

const API_URL = API_CONFIG.BASE_URL;

export async function GET(request: NextRequest) {
  try {
    const { accessToken, deviceId } = getTokens(request);

    if (!accessToken || !deviceId) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'x-device-id': deviceId
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to get user info' },
        { status: response.status }
      );
    }

    if (data.status === 200 && data.data) {
      return NextResponse.json({ user: data.data }, { status: 200 });
    }

    console.error('❌ Invalid response format:', data);
    return NextResponse.json(
      { error: 'Invalid response format' },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ API Me error:', error);
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
