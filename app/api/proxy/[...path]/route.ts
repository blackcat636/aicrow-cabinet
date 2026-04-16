import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';
import { decodeToken } from '@/lib/auth-utils';
import {
  getAuthTokenCookieOptions,
  getClearAuthTokenCookieOptions,
  getClearDeviceCookieOptions
} from '@/lib/auth-cookies';

export const runtime = 'edge';

const API_ORIGIN = API_CONFIG.BASE_URL.replace(/\/$/, '');
const AUTH_HEADER = 'authorization';
const DEVICE_HEADER = 'x-device-id';

type ProxyContext = { params: Promise<{ path: string[] }> };

const buildBackendUrl = (segments: string[], search: string): string =>
  `${API_ORIGIN}/${segments.join('/')}${search}`;

const readBody = async (request: NextRequest): Promise<BodyInit | undefined> => {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD') {
    return undefined;
  }
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const raw = await request.text();
    return raw.length > 0 ? raw : undefined;
  }
  return await request.arrayBuffer();
};

const forwardRequest = async (
  request: NextRequest,
  url: string,
  accessToken: string | null,
  deviceId: string | null
): Promise<Response> => {
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers.set('content-type', contentType);
  }
  if (accessToken) {
    headers.set(AUTH_HEADER, `Bearer ${accessToken}`);
  }
  if (deviceId) {
    headers.set(DEVICE_HEADER, deviceId);
  }

  return fetch(url, {
    method: request.method,
    headers,
    body: await readBody(request),
    redirect: 'manual',
    cache: 'no-cache'
  });
};

const refreshSession = async (
  refreshToken: string | null,
  deviceId: string | null
): Promise<{ accessToken: string; refreshToken: string } | null> => {
  if (!refreshToken || !deviceId) {
    return null;
  }
  const response = await fetch(`${API_ORIGIN}/auth/refresh`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      [DEVICE_HEADER]: deviceId
    },
    body: JSON.stringify({ refreshToken, deviceId }),
    cache: 'no-cache'
  });
  if (!response.ok) {
    return null;
  }
  const payload = (await response.json()) as {
    status?: number;
    data?: { accessToken?: string; refreshToken?: string };
  };
  if (
    payload.status !== 200 ||
    !payload.data ||
    typeof payload.data.accessToken !== 'string' ||
    typeof payload.data.refreshToken !== 'string'
  ) {
    return null;
  }
  return {
    accessToken: payload.data.accessToken,
    refreshToken: payload.data.refreshToken
  };
};

const toJsonResponse = async (response: Response): Promise<NextResponse> => {
  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') || 'application/json'
    }
  });
};

const applyRefreshedCookies = (
  response: NextResponse,
  accessToken: string,
  refreshToken: string
) => {
  const nowSec = Math.floor(Date.now() / 1000);
  const accessExp = decodeToken(accessToken)?.exp;
  const refreshExp = decodeToken(refreshToken)?.exp;
  const accessMaxAge = accessExp ? Math.max(0, accessExp - nowSec) : 60 * 60;
  const refreshMaxAge = refreshExp
    ? Math.max(0, refreshExp - nowSec)
    : 365 * 24 * 60 * 60;

  response.cookies.set('access_token', accessToken, {
    ...getAuthTokenCookieOptions(accessMaxAge)
  });
  response.cookies.set('refresh_token', refreshToken, {
    ...getAuthTokenCookieOptions(refreshMaxAge)
  });
};

const clearAuthCookies = (response: NextResponse) => {
  response.cookies.set('access_token', '', {
    ...getClearAuthTokenCookieOptions()
  });
  response.cookies.set('refresh_token', '', {
    ...getClearAuthTokenCookieOptions()
  });
  response.cookies.set('device_id', '', {
    ...getClearDeviceCookieOptions()
  });
};

const handleProxy = async (
  request: NextRequest,
  context: ProxyContext
): Promise<NextResponse> => {
  const { path } = await context.params;
  if (!path || path.length === 0) {
    return NextResponse.json({ message: 'Proxy path is required' }, { status: 400 });
  }

  const backendUrl = buildBackendUrl(path, request.nextUrl.search);
  const accessToken = request.cookies.get('access_token')?.value ?? null;
  const refreshToken = request.cookies.get('refresh_token')?.value ?? null;
  const deviceId = request.cookies.get('device_id')?.value ?? null;

  let upstream = await forwardRequest(request, backendUrl, accessToken, deviceId);
  if (upstream.status !== 401) {
    return toJsonResponse(upstream);
  }

  const refreshed = await refreshSession(refreshToken, deviceId);
  if (!refreshed) {
    const unauthorized = NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    );
    clearAuthCookies(unauthorized);
    return unauthorized;
  }

  upstream = await forwardRequest(
    request,
    backendUrl,
    refreshed.accessToken,
    deviceId
  );
  const proxied = await toJsonResponse(upstream);
  applyRefreshedCookies(proxied, refreshed.accessToken, refreshed.refreshToken);
  return proxied;
};

export async function GET(request: NextRequest, context: ProxyContext) {
  return handleProxy(request, context);
}

export async function POST(request: NextRequest, context: ProxyContext) {
  return handleProxy(request, context);
}

export async function PUT(request: NextRequest, context: ProxyContext) {
  return handleProxy(request, context);
}

export async function PATCH(request: NextRequest, context: ProxyContext) {
  return handleProxy(request, context);
}

export async function DELETE(request: NextRequest, context: ProxyContext) {
  return handleProxy(request, context);
}
