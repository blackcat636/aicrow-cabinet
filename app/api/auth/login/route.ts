import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';
import { decodeToken } from '@/lib/auth-utils';

export const runtime = 'edge';

const API_URL = API_CONFIG.BASE_URL;

export async function POST(request: NextRequest) {
  const logPrefix = '[Login API]';

  try {
    const body = await request.json();
    const redirectUri = request.nextUrl.searchParams.get('redirect_uri');
    const service = request.nextUrl.searchParams.get('service');

    // 🔍 ЛОГ 1 — що отримали від фронту
    console.log(`${logPrefix} STEP 1 — incoming params:`, {
      redirectUri,
      service,
      body
    });

    const url = new URL(`${API_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`);
    if (redirectUri) {
      url.searchParams.set('redirect_uri', redirectUri);
    }
    if (service) {
      url.searchParams.set('service', service);
    }

    // 🔍 ЛОГ 2 — який URL формуємо для бекенду
    console.log(`${logPrefix} STEP 2 — full backend URL:`, url.toString());

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      redirect: 'manual'
    });

    // 🔍 ЛОГ 3 — що відповів бекенд
    console.log(`${logPrefix} STEP 3 — backend response:`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Handle backend redirect responses
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      console.log(`${logPrefix} STEP 3a — redirect location:`, location);
      if (location) {
        return NextResponse.json(
          { status: response.status, data: { redirectUrl: location } },
          { status: 200 }
        );
      }
    }

    interface LoginResponse {
      data?: {
        redirectUrl?: string;
        user?: unknown;
        accessToken?: string;
        refreshToken?: string;
        deviceId?: string;
      };
      status?: number;
      error?: string;
      message?: string;
    }

    let data: LoginResponse = {};
    try {
      data = (await response.json()) as LoginResponse;
    } catch {
      data = {};
    }

    // 🔍 ЛОГ 4 — що за дані прийшли в body
    console.log(`${logPrefix} STEP 4 — backend response body:`, JSON.stringify(data, null, 2));

    if (!response.ok) {
      const errorMessage = data?.error || data?.message || 'Login failed';
      console.error(`${logPrefix} STEP 4a — Login FAILED:`, errorMessage, data);
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // 🔍 ЛОГ 5 — перевіряємо SSO redirectUrl
    console.log(`${logPrefix} STEP 5 — has redirectUrl?`, !!data?.data?.redirectUrl, data?.data?.redirectUrl);

    if (data?.data?.redirectUrl) {
      return NextResponse.json(
        { status: 200, data: { redirectUrl: data.data.redirectUrl } },
        { status: 200 }
      );
    }

    const responseData = data.data;

    // 🔍 ЛОГ 6 — перевіряємо токени
    console.log(`${logPrefix} STEP 6 — tokens present?`, {
      status: data.status,
      hasAccessToken: !!responseData?.accessToken,
      hasRefreshToken: !!responseData?.refreshToken,
      hasDeviceId: !!responseData?.deviceId
    });

    if (data.status === 200 && responseData?.accessToken && responseData?.refreshToken && responseData?.deviceId) {
      const nextResponse = NextResponse.json(
        {
          user: responseData.user,
          message: 'Login successful'
        },
        { status: 200 }
      );

      const nowSec = Math.floor(Date.now() / 1000);
      const accessExp = decodeToken(responseData.accessToken)?.exp;
      const refreshExp = decodeToken(responseData.refreshToken)?.exp;
      const accessMaxAge = accessExp ? Math.max(0, accessExp - nowSec) : 60 * 60;
      const refreshMaxAge = refreshExp ? Math.max(0, refreshExp - nowSec) : 365 * 24 * 60 * 60;

      nextResponse.cookies.set('access_token', responseData.accessToken, {
        path: '/',
        maxAge: accessMaxAge,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      nextResponse.cookies.set('refresh_token', responseData.refreshToken, {
        path: '/',
        maxAge: refreshMaxAge,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      nextResponse.cookies.set('device_id', responseData.deviceId, {
        path: '/',
        maxAge: 365 * 24 * 60 * 60,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      console.log(`${logPrefix} STEP 7 — cookies set, returning success`);
      return nextResponse;
    }

    // 🔍 ЛОГ ФІНАЛ — якщо нічого не спрацювало
    console.error(`${logPrefix} STEP FINAL — fell through all checks. data:`, JSON.stringify(data, null, 2));
    return NextResponse.json(
      { error: 'Invalid response format' },
      { status: 400 }
    );
  } catch (error) {
    console.error(`${logPrefix} EXCEPTION:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
