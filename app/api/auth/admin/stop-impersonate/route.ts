import { NextRequest, NextResponse } from 'next/server';
import { decodeToken } from '@/lib/auth-utils';
import {
  getAuthTokenCookieOptions,
  getClearAdminTokenCookieOptions,
  getClearAuthTokenCookieOptions,
  getClearDeviceCookieOptions,
  getClearImpersonationMetaCookieOptions,
  getDeviceCookieOptions
} from '@/lib/auth-cookies';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const adminAccessToken = request.cookies.get('admin_access_token')?.value;
    const adminRefreshToken = request.cookies.get('admin_refresh_token')?.value;
    const adminDeviceId = request.cookies.get('admin_device_id')?.value;

    if (!adminAccessToken || !adminRefreshToken || !adminDeviceId) {
      // If we cannot restore admin session, clear impersonation data and force login
      const response = NextResponse.json(
        { error: 'Admin session not found' },
        { status: 401 }
      );
      response.cookies.set('impersonation_meta', '', {
        ...getClearImpersonationMetaCookieOptions()
      });
      response.cookies.set('access_token', '', { ...getClearAuthTokenCookieOptions() });
      response.cookies.set('refresh_token', '', { ...getClearAuthTokenCookieOptions() });
      response.cookies.set('device_id', '', { ...getClearDeviceCookieOptions() });
      response.cookies.set('admin_access_token', '', {
        ...getClearAdminTokenCookieOptions()
      });
      response.cookies.set('admin_refresh_token', '', {
        ...getClearAdminTokenCookieOptions()
      });
      response.cookies.set('admin_device_id', '', { ...getClearDeviceCookieOptions() });
      return response;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const accessExp = decodeToken(adminAccessToken)?.exp;
    const refreshExp = decodeToken(adminRefreshToken)?.exp;
    const accessMaxAge = accessExp ? Math.max(0, accessExp - nowSec) : 60 * 60;
    const refreshMaxAge = refreshExp
      ? Math.max(0, refreshExp - nowSec)
      : 365 * 24 * 60 * 60;

    const response = NextResponse.json(
      { message: 'Impersonation stopped, admin session restored' },
      { status: 200 }
    );

    response.cookies.set('access_token', adminAccessToken, {
      ...getAuthTokenCookieOptions(accessMaxAge)
    });
    response.cookies.set('refresh_token', adminRefreshToken, {
      ...getAuthTokenCookieOptions(refreshMaxAge)
    });
    response.cookies.set('device_id', adminDeviceId, {
      ...getDeviceCookieOptions(365 * 24 * 60 * 60)
    });

    // Clear impersonation and admin backup cookies
    response.cookies.set('impersonation_meta', '', {
      ...getClearImpersonationMetaCookieOptions()
    });
    response.cookies.set('admin_access_token', '', {
      ...getClearAdminTokenCookieOptions()
    });
    response.cookies.set('admin_refresh_token', '', {
      ...getClearAdminTokenCookieOptions()
    });
    response.cookies.set('admin_device_id', '', { ...getClearDeviceCookieOptions() });

    return response;
  } catch (error) {
    console.error('❌ Stop impersonation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

