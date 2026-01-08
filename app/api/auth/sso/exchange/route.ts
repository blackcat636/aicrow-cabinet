import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export const runtime = 'edge';

const API_URL = API_CONFIG.BASE_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code: string | undefined = body?.code;
    const redirectUri: string | undefined = body?.redirect_uri || body?.redirectUri;

    if (!code || !redirectUri) {
      return NextResponse.json(
        { error: 'code and redirect_uri are required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${API_URL}${API_CONFIG.ENDPOINTS.AUTH.SSO_EXCHANGE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          redirect_uri: redirectUri
        })
      }
    );

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
