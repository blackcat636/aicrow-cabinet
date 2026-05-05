import { NextRequest, NextResponse } from 'next/server';

const HEADER_NAME = 'x-request-id';

const randomId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const getOrCreateRequestId = (request: NextRequest): string => {
  const existing = request.headers.get(HEADER_NAME);
  if (existing && existing.trim().length > 0) {
    return existing.trim();
  }
  return randomId();
};

export const attachRequestId = (response: NextResponse, requestId: string): void => {
  response.headers.set(HEADER_NAME, requestId);
};
