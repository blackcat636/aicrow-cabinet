import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';
import { decodeToken } from '@/lib/auth-utils';
import {
  getAuthTokenCookieOptions,
  getDeviceCookieOptions
} from '@/lib/auth-cookies';

export const runtime = 'edge';

const API_URL = API_CONFIG.BASE_URL;
type JsonObject = Record<string, unknown>;

interface VerifyEmailPayload {
  accessToken: string;
  refreshToken: string;
  deviceId: string;
  user: unknown;
}

interface BackendVerifyEmailResponse {
  status?: number;
  message?: string;
  data?: VerifyEmailPayload;
  error?: string;
}

const isRecord = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null;

const toVerifyEmailResponse = (payload: unknown): BackendVerifyEmailResponse => {
  if (!isRecord(payload)) {
    return {};
  }
  return payload as BackendVerifyEmailResponse;
};

const readMessage = (payload: BackendVerifyEmailResponse, fallback: string): string =>
  payload.message || payload.error || fallback;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    const response = await fetch(`${API_URL}/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, code })
    });

    const rawData: unknown = await response.json();
    const data = toVerifyEmailResponse(rawData);

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Email verification failed' },
        { status: response.status }
      );
    }

    // Check for successful response with tokens
    // Backend returns status: 200 (not 0) for success
    if (
      data.status === 200 &&
      data.data &&
      typeof data.data.accessToken === 'string' &&
      typeof data.data.refreshToken === 'string' &&
      typeof data.data.deviceId === 'string'
    ) {
      const nextResponse = NextResponse.json(
        {
          user: data.data.user,
          message: readMessage(data, 'Email verified successfully')
        },
        { status: 200 }
      );

      const nowSec = Math.floor(Date.now() / 1000);
      const accessExp = decodeToken(data.data.accessToken)?.exp;
      const refreshExp = decodeToken(data.data.refreshToken)?.exp;
      const accessMaxAge = accessExp ? Math.max(0, accessExp - nowSec) : 60 * 60;
      const refreshMaxAge = refreshExp
        ? Math.max(0, refreshExp - nowSec)
        : 365 * 24 * 60 * 60;

      // Set cookies
      nextResponse.cookies.set('access_token', data.data.accessToken, {
        ...getAuthTokenCookieOptions(accessMaxAge)
      });

      nextResponse.cookies.set('refresh_token', data.data.refreshToken, {
        ...getAuthTokenCookieOptions(refreshMaxAge)
      });

      nextResponse.cookies.set('device_id', data.data.deviceId, {
        ...getDeviceCookieOptions(365 * 24 * 60 * 60)
      });

      return nextResponse;
    }

    return NextResponse.json(
      { error: 'Invalid response format' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
