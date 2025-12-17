import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';
import { getTokens } from '@/lib/auth';

export const runtime = 'edge';

const API_URL = API_CONFIG.BASE_URL;

export async function GET(request: NextRequest) {
  try {
    const { accessToken, deviceId } = getTokens(request);

    if (!accessToken || !deviceId) {
      return NextResponse.json(
        { error: 'Admin session not found' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_URL}/admin/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'x-device-id': deviceId
      }
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data?.message || data?.error || 'Failed to fetch users';
      return NextResponse.json({ error: message }, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('❌ Admin users list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

