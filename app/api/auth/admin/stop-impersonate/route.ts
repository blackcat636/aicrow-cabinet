import { NextRequest, NextResponse } from 'next/server';
import { decodeToken } from '@/lib/auth-utils';

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
        path: '/',
        maxAge: 0
      });
      response.cookies.set('access_token', '', { path: '/', maxAge: 0 });
      response.cookies.set('refresh_token', '', { path: '/', maxAge: 0 });
      response.cookies.set('device_id', '', { path: '/', maxAge: 0 });
      response.cookies.set('admin_access_token', '', { path: '/', maxAge: 0 });
      response.cookies.set('admin_refresh_token', '', { path: '/', maxAge: 0 });
      response.cookies.set('admin_device_id', '', { path: '/', maxAge: 0 });
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
      path: '/',
      maxAge: accessMaxAge,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    response.cookies.set('refresh_token', adminRefreshToken, {
      path: '/',
      maxAge: refreshMaxAge,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    response.cookies.set('device_id', adminDeviceId, {
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // Clear impersonation and admin backup cookies
    response.cookies.set('impersonation_meta', '', { path: '/', maxAge: 0 });
    response.cookies.set('admin_access_token', '', { path: '/', maxAge: 0 });
    response.cookies.set('admin_refresh_token', '', { path: '/', maxAge: 0 });
    response.cookies.set('admin_device_id', '', { path: '/', maxAge: 0 });

    return response;
  } catch (error) {
    console.error('❌ Stop impersonation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

