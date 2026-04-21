import type { NextResponse } from "next/server";

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

export function buildContentSecurityPolicy(): string {
  const apiOrigin = resolveApiOrigin();
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://embed.tawk.to https://*.tawk.to https://js.stripe.com https://*.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
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
 * Apply baseline security headers (CSP, frame options, etc.) for Edge middleware responses.
 * Cloudflare next-on-pages often does not surface `next.config.js` `headers()` on HTML; middleware is reliable.
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(self "https://js.stripe.com")',
  );
  response.headers.set("Content-Security-Policy", buildContentSecurityPolicy());

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  return response;
}
