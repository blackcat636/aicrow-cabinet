import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export const runtime = 'edge';

const API_URL = API_CONFIG.BASE_URL;
const SELF_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL;

const getAllowedOrigins = (): Set<string> => {
  const configured = (process.env.SSO_EXCHANGE_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const defaults = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_FRONTEND_URL,
    SELF_ORIGIN
  ].filter(Boolean) as string[];
  return new Set([...configured, ...defaults]);
};

const buildCorsHeaders = (origin: string | null): Record<string, string> => {
  if (!origin) return {};
  const allowedOrigins = getAllowedOrigins();
  if (!allowedOrigins.has(origin)) {
    return {};
  }
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin'
  };
};

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = buildCorsHeaders(origin);

  if (origin && !headers['Access-Control-Allow-Origin']) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 204,
    headers
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = buildCorsHeaders(origin);

  if (origin && !corsHeaders['Access-Control-Allow-Origin']) {
    return NextResponse.json(
      { error: 'Origin is not allowed' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const code: string | undefined = body?.code;
    const redirectUri: string | undefined =
      body?.redirect_uri || body?.redirectUri;

    if (!code || !redirectUri) {
      return NextResponse.json(
        { error: 'code and redirect_uri are required' },
        {
          status: 400
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
      headers: corsHeaders
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', message: error?.message },
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
}
