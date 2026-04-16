import { NextRequest, NextResponse } from 'next/server';
import { getTokens } from '@/lib/auth';
import { API_CONFIG } from '@/config/api';
import { getAvatarUrl } from '@/lib/avatars';

export const runtime = 'edge';

const API_URL = API_CONFIG.BASE_URL;
type JsonObject = Record<string, unknown>;

interface BackendEnvelope {
  status?: number;
  message?: string;
  data?: unknown;
}

const isRecord = (value: unknown): value is JsonObject =>
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
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'x-device-id': deviceId
      }
    });

    const rawData: unknown = await response.json();
    const data = (isRecord(rawData) ? rawData : {}) as BackendEnvelope;

    if (!response.ok) {
      return NextResponse.json(
        { message: readMessage(rawData, 'Failed to get profile') },
        { status: response.status }
      );
    }

    // Handle response format: { status: 200, data: {...}, message: "..." }
    if (data.status === 200 && data.data) {
      return NextResponse.json(data.data, { status: 200 });
    }

    // Fallback: if data is already the profile object
    return NextResponse.json(rawData, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { accessToken, deviceId } = getTokens(request);

    if (!accessToken || !deviceId) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }

    const body = await request.json();
    // Normalize photo field to absolute URL if needed
    if (body && typeof body.photo === 'string') {
      let url = getAvatarUrl(body.photo) ?? body.photo;
      if (url?.startsWith('/')) {
        try {
          const origin = request.nextUrl.origin;
          url = new URL(url, origin).toString();
        } catch {}
      }
      body.photo = url;
    }

    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'x-device-id': deviceId
      },
      body: JSON.stringify(body)
    });

    const rawData: unknown = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: readMessage(rawData, 'Failed to update profile') },
        { status: response.status }
      );
    }

    return NextResponse.json(rawData, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

