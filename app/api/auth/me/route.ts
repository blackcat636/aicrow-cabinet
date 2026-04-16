import { NextRequest, NextResponse } from 'next/server';
import { getTokens } from '@/lib/auth';
import { API_CONFIG } from '@/config/api';

export const runtime = 'edge';

const API_URL = API_CONFIG.BASE_URL;
type JsonObject = Record<string, unknown>;

interface BackendMeResponse {
  status?: number;
  message?: string;
  data?: unknown;
}

const isRecord = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null;

const getMessage = (payload: unknown, fallback: string): string => {
  if (!isRecord(payload)) return fallback;
  const message = payload.message;
  if (typeof message === 'string' && message.length > 0) {
    return message;
  }
  return fallback;
};

export async function GET(request: NextRequest) {
  try {
    const { accessToken, deviceId } = getTokens(request);

    if (!accessToken || !deviceId) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'x-device-id': deviceId
      }
    });

    const rawData: unknown = await response.json();
    const data = (isRecord(rawData) ? rawData : {}) as BackendMeResponse;

    if (!response.ok) {
      return NextResponse.json(
        { message: getMessage(rawData, 'Failed to get user info') },
        { status: response.status }
      );
    }

    if (data.status === 200 && data.data) {
      return NextResponse.json({ user: data.data }, { status: 200 });
    }

    return NextResponse.json(
      { message: 'Invalid response format' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
