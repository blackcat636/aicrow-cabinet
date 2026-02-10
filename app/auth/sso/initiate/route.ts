import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Redirect /auth/sso/initiate to /sso/initiate (client page)
 * Preserves query params: redirect_uri, service, state
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const redirectUrl = new URL('/sso/initiate', url.origin);
  url.searchParams.forEach((value, key) => {
    redirectUrl.searchParams.set(key, value);
  });
  return NextResponse.redirect(redirectUrl.toString(), 302);
}
