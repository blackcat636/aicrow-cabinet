import { NextRequest, type NextResponse } from "next/server";

function resolveApiOrigin(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_API_URL,
    process.env.API_BASE_URL,
  ];
  for (const raw of candidates) {
    if (!raw || typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    try {
      const withScheme = /^https?:\/\//i.test(trimmed)
        ? trimmed
        : `https://${trimmed}`;
      return new URL(withScheme).origin;
    } catch {
      continue;
    }
  }
  return "https://app.aipills.ca";
}

/** Base64 nonce (Edge-safe; no Buffer). */
export function generateCspNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/**
 * CSP: script-src uses nonce + strict-dynamic in production (no unsafe-inline / no unsafe-eval).
 * In development, unsafe-eval is kept for React/Next debugging (see Next.js CSP docs).
 * style-src keeps unsafe-inline for Tailwind / component styles; nonce is still sent for Next.
 */
export function buildContentSecurityPolicy(
  nonce: string,
  isDevelopment: boolean,
): string {
  const apiOrigin = resolveApiOrigin();
  const scriptEval = isDevelopment ? " 'unsafe-eval'" : "";
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    "https://embed.tawk.to",
    "https://*.tawk.to",
    "https://js.stripe.com",
    "https://*.stripe.com",
    scriptEval,
  ]
    .filter(Boolean)
    .join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    `script-src ${scriptSrc}`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://fonts.googleapis.com`,
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    `connect-src 'self' ${apiOrigin} https://*.stripe.com wss://*.stripe.com https://*.tawk.to wss://*.tawk.to https://*.facebook.com`,
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://*.stripe.com https://*.tawk.to https://www.facebook.com https://*.facebook.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

/**
 * Clone the request with CSP + x-nonce so Next.js can attach nonces to framework scripts.
 */
export function enrichRequestWithCsp(request: NextRequest): {
  req: NextRequest;
  cspHeader: string;
} {
  const nonce = generateCspNonce();
  const isDevelopment = process.env.NODE_ENV === "development";
  const cspHeader = buildContentSecurityPolicy(nonce, isDevelopment);

  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", cspHeader);

  const init: ConstructorParameters<typeof NextRequest>[1] = {
    headers,
    method: request.method,
  };

  if (request.body != null) {
    Object.assign(init, { body: request.body, duplex: "half" as const });
  }

  const req = new NextRequest(request.url, init);
  return { req, cspHeader };
}

/**
 * Apply security headers on the response. CSP must match the value set on the enriched request.
 */
export function applySecurityHeaders(
  response: NextResponse,
  cspHeader: string,
): NextResponse {
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(self "https://js.stripe.com")',
  );
  response.headers.set("Content-Security-Policy", cspHeader);

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  return response;
}
