import { NextRequest, NextResponse } from 'next/server';
import { getTokens } from '@/lib/auth';
import { API_CONFIG } from '@/config/api';

export const runtime = 'edge';

type JsonRecord = Record<string, unknown>;

const API_URL = API_CONFIG.BASE_URL;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null;

const readMessage = (payload: unknown, fallback: string): string => {
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
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(`${API_URL}/subscription-plans/my/active`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'x-device-id': deviceId
      },
      cache: 'no-cache'
    });

    if (response.status === 404) {
      return NextResponse.json({ status: 200, data: null }, { status: 200 });
    }

    const rawPayload: unknown = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: readMessage(rawPayload, 'Failed to load active plan') },
        { status: response.status }
      );
    }

    return NextResponse.json(rawPayload, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
