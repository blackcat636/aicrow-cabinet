import { NextRequest, NextResponse } from 'next/server';
import { setTokens } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const deviceId = require('crypto').randomUUID();

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId
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
