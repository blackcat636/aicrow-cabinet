import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export const runtime = 'edge';

const API_URL = API_CONFIG.BASE_URL;

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

export async function POST(request: NextRequest) {
  const logPrefix = '[SSO Exchange API]';
  const origin = request.headers.get('origin');

  try {
    const body = await request.json();
    const code: string | undefined = body?.code;
    const redirectUri: string | undefined =
      body?.redirect_uri || body?.redirectUri;

    if (!code || !redirectUri) {
      console.error(`${logPrefix} Missing required parameters:`, {
        hasCode: !!code,
        hasRedirectUri: !!redirectUri
      });
      return NextResponse.json(
        { error: 'code and redirect_uri are required' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': origin || '*',
            'Access-Control-Allow-Credentials': 'true'
          }
        }
      );
    }

    const backendUrl = `${API_URL}${API_CONFIG.ENDPOINTS.AUTH.SSO_EXCHANGE}`;
    const requestBody = {
      code,
      redirect_uri: redirectUri
    };

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Credentials': 'true'
      }
    });
  } catch (error: any) {
    console.error(`${logPrefix} Error:`, error);
    return NextResponse.json(
      { error: 'Internal server error', message: error?.message },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Credentials': 'true'
        }
      }
    );
  }
}
