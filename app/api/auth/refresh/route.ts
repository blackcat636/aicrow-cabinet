import { NextRequest, NextResponse } from 'next/server';
import { getTokens } from '@/lib/auth';

import { API_CONFIG } from '@/config/api';
import { decodeToken } from '@/lib/auth-utils';
import { readApiJsonMessage } from '@/lib/api-json-error';
import { attachRequestId, getOrCreateRequestId } from '@/lib/request-id';
import {
  getAuthTokenCookieOptions,
  getClearAuthTokenCookieOptions,
  getClearDeviceCookieOptions,
  getDeviceCookieOptions
} from '@/lib/auth-cookies';

export const runtime = 'edge';

const API_URL = API_CONFIG.BASE_URL;
type JsonObject = Record<string, unknown>;

interface RefreshPayload {
  accessToken: string;
  refreshToken: string;
}

interface BackendRefreshResponse {
  status?: number;
  message?: string;
  data?: RefreshPayload;
}

const isRecord = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null;

export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  try {
    const { refreshToken, deviceId } = getTokens(request);

    if (!refreshToken || !deviceId) {
      const response = NextResponse.json(
        { error: 'No refresh token found' },
        { status: 401 }
      );
      attachRequestId(response, requestId);
      return response;
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': deviceId
      },
      body: JSON.stringify({ refreshToken, deviceId })
    });

    const rawData: unknown = await response.json();
    const data = (isRecord(rawData) ? rawData : {}) as BackendRefreshResponse;

    if (
      data.status === 200 &&
      data.data &&
      typeof data.data.accessToken === 'string' &&
      typeof data.data.refreshToken === 'string'
    ) {
      const nextResponse = NextResponse.json(
        { message: 'Token refreshed successfully' },
        { status: 200 }
      );
      attachRequestId(nextResponse, requestId);

      const nowSec = Math.floor(Date.now() / 1000);
      const accessExp = decodeToken(data.data.accessToken)?.exp;
      const refreshExp = decodeToken(data.data.refreshToken)?.exp;
      const accessMaxAge = accessExp ? Math.max(0, accessExp - nowSec) : 60 * 60;
      const refreshMaxAge = refreshExp ? Math.max(0, refreshExp - nowSec) : 365 * 24 * 60 * 60;

      // Set cookies
      nextResponse.cookies.set('access_token', data.data.accessToken, {
        ...getAuthTokenCookieOptions(accessMaxAge)
      });

      nextResponse.cookies.set('refresh_token', data.data.refreshToken, {
        ...getAuthTokenCookieOptions(refreshMaxAge)
      });

      nextResponse.cookies.set('device_id', deviceId, {
        ...getDeviceCookieOptions(365 * 24 * 60 * 60)
      });

      return nextResponse;
    } else {
      // If refresh token is invalid, clear all tokens
      if (data.status === 401) {
        const nextResponse = NextResponse.json(
          { error: 'Invalid refresh token' },
          { status: 401 }
        );
        attachRequestId(nextResponse, requestId);
        // Clear cookies
        nextResponse.cookies.set('access_token', '', {
          ...getClearAuthTokenCookieOptions()
        });
        nextResponse.cookies.set('refresh_token', '', {
          ...getClearAuthTokenCookieOptions()
        });
        nextResponse.cookies.set('device_id', '', {
          ...getClearDeviceCookieOptions()
        });
        return nextResponse;
      }

      const nextResponse = NextResponse.json(
        { error: readApiJsonMessage(rawData, 'Token refresh failed') },
        { status: response.status }
      );
      attachRequestId(nextResponse, requestId);
      return nextResponse;
    }
  } catch {
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    attachRequestId(response, requestId);
    return response;
  }
}
