import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';
import { decodeToken } from '@/lib/auth-utils';
import {
  getAuthTokenCookieOptions,
  getDeviceCookieOptions
} from '@/lib/auth-cookies';

export const runtime = 'edge';

type FacebookVerifyPayload = {
  code: string;
  link?: boolean;
  redirectUri: string;
};

type FacebookVerifyResponse = {
  status?: number;
  message?: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    deviceId?: string;
  };
  error?: string;
};

const API_URL = API_CONFIG.BASE_URL.replace(/\/$/, '');

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FacebookVerifyPayload;
    const accessToken = request.cookies.get('access_token')?.value;
    const deviceId = request.cookies.get('device_id')?.value || request.headers.get('x-device-id');

    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    if (deviceId) {
      headers['x-device-id'] = deviceId;
    }
    if (body.link && accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_URL}/auth/facebook/verify`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-cache'
    });

    if (response.status === 204) {
      return NextResponse.json({ status: 204 }, { status: 200 });
    }

    const payload = (await response.json()) as FacebookVerifyResponse;
    if (!response.ok) {
      return NextResponse.json(
        { message: payload.message || payload.error || 'Facebook verification failed' },
        { status: response.status }
      );
    }

    if (
      !body.link &&
      payload.data &&
      typeof payload.data.accessToken === 'string' &&
      typeof payload.data.refreshToken === 'string'
    ) {
      const nowSec = Math.floor(Date.now() / 1000);
      const nextDeviceId = payload.data.deviceId || deviceId || '';
      const accessExp = decodeToken(payload.data.accessToken)?.exp;
      const refreshExp = decodeToken(payload.data.refreshToken)?.exp;
      const accessMaxAge = accessExp ? Math.max(0, accessExp - nowSec) : 60 * 60;
      const refreshMaxAge = refreshExp
        ? Math.max(0, refreshExp - nowSec)
        : 365 * 24 * 60 * 60;

      const nextResponse = NextResponse.json(payload, { status: 200 });
      nextResponse.cookies.set('access_token', payload.data.accessToken, {
        ...getAuthTokenCookieOptions(accessMaxAge)
      });
      nextResponse.cookies.set('refresh_token', payload.data.refreshToken, {
        ...getAuthTokenCookieOptions(refreshMaxAge)
      });
      if (nextDeviceId) {
        nextResponse.cookies.set('device_id', nextDeviceId, {
          ...getDeviceCookieOptions(365 * 24 * 60 * 60)
        });
      }
      return nextResponse;
    }

    return NextResponse.json(payload, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
