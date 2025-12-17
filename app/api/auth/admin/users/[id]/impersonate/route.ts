import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';
import { getTokens } from '@/lib/auth';
import { decodeToken } from '@/lib/auth-utils';

export const runtime = 'edge';

const API_URL = API_CONFIG.BASE_URL;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { accessToken, refreshToken, deviceId } = getTokens(request);

    if (!accessToken || !deviceId) {
      return NextResponse.json(
        { error: 'Admin session not found' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_URL}/auth/admin/users/${id}/impersonate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'x-device-id': deviceId
      }
    });

    const data = await response.json();

    if (!response.ok || data.status !== 200 || !data.data) {
      const message =
        data?.message ||
        data?.error ||
        'Failed to impersonate user';
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const nextResponse = NextResponse.json(data, { status: 200 });

    const nowSec = Math.floor(Date.now() / 1000);
    const accessExp = decodeToken(data.data.accessToken)?.exp;
    const refreshExp = decodeToken(data.data.refreshToken)?.exp;
    const accessMaxAge = accessExp ? Math.max(0, accessExp - nowSec) : 60 * 60;
    const refreshMaxAge = refreshExp
      ? Math.max(0, refreshExp - nowSec)
      : 365 * 24 * 60 * 60;

    // Backup admin tokens to allow exiting impersonation
    const adminAccessExp = decodeToken(accessToken)?.exp;
    const adminRefreshExp = decodeToken(refreshToken || '')?.exp;
    const adminAccessMaxAge = adminAccessExp
      ? Math.max(0, adminAccessExp - nowSec)
      : accessMaxAge;
    const adminRefreshMaxAge = adminRefreshExp
      ? Math.max(0, adminRefreshExp - nowSec)
      : refreshMaxAge;

    nextResponse.cookies.set('admin_access_token', accessToken, {
      path: '/',
      maxAge: adminAccessMaxAge,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    if (refreshToken) {
      nextResponse.cookies.set('admin_refresh_token', refreshToken, {
        path: '/',
        maxAge: adminRefreshMaxAge,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
    }
    if (deviceId) {
      nextResponse.cookies.set('admin_device_id', deviceId, {
        path: '/',
        maxAge: 365 * 24 * 60 * 60,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
    }

    // Set impersonated session tokens
    nextResponse.cookies.set('access_token', data.data.accessToken, {
      path: '/',
      maxAge: accessMaxAge,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    nextResponse.cookies.set('refresh_token', data.data.refreshToken, {
      path: '/',
      maxAge: refreshMaxAge,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    nextResponse.cookies.set('device_id', data.data.deviceId, {
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // Store impersonation meta for client UI
    nextResponse.cookies.set(
      'impersonation_meta',
      JSON.stringify({
        isImpersonated: true,
        impersonatedBy: data.data.impersonation?.impersonatedBy || null,
        impersonatedUser: {
          id: data.data.user?.id,
          email: data.data.user?.email,
          username: data.data.user?.username
        }
      }),
      {
        path: '/',
        maxAge: refreshMaxAge,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      }
    );

    return nextResponse;
  } catch (error) {
    console.error('❌ Impersonation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

