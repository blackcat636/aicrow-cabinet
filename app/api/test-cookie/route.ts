import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const nextResponse = NextResponse.json(
    { message: 'Cookie test successful' },
    { status: 200 }
  );

  // Simple cookie test
  nextResponse.headers.set(
    'Set-Cookie',
    'test_cookie=test_value; Path=/; Max-Age=3600; SameSite=Strict'
  );

  return nextResponse;
}
