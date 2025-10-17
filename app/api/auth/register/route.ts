import { NextRequest, NextResponse } from 'next/server';
import { setTokens } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Generate device ID if not exists
    const deviceId = require('crypto').randomUUID();

    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId
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

      setTokens(
        {
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          deviceId: deviceId
        },
        nextResponse
      );

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
