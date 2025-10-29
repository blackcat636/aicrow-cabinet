import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export const runtime = 'edge';

const API_URL = API_CONFIG.BASE_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to send reset code' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
