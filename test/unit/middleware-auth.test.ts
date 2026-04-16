import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

import { authApi } from "@/lib/apiAuth";

vi.mock("@/lib/apiAuth", () => ({
  authApi: {
    refreshToken: vi.fn(),
  },
}));

vi.mock("next-intl/middleware", () => ({
  default: () => (_request: NextRequest) => NextResponse.next(),
}));

vi.mock("@/i18n/routing", () => ({
  routing: {
    locales: ["uk", "en", "fr"],
    defaultLocale: "uk",
    localePrefix: "as-needed",
  },
}));

const toBase64Url = (input: string): string =>
  Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const fakeJwt = (exp: number): string => {
  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = toBase64Url(JSON.stringify({ exp }));

  return `${header}.${payload}.signature`;
};

const makeRequest = (pathname: string, cookie = ""): NextRequest =>
  new NextRequest(`https://frontend.local${pathname}`, {
    headers: cookie ? { cookie } : undefined,
  });

describe("middleware auth flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated root user to localized login", async () => {
    const { middleware } = await import("@/middleware");
    const response = await middleware(makeRequest("/"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://frontend.local/login",
    );
  });

  it("redirects authenticated root user to localized dashboard", async () => {
    const { middleware } = await import("@/middleware");
    const accessToken = fakeJwt(Math.floor(Date.now() / 1000) + 3600);
    const response = await middleware(
      makeRequest("/", `access_token=${accessToken}; device_id=dev-1`),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://frontend.local/dashboard",
    );
  });

  it("refreshes session for root user and sets hardened auth cookies", async () => {
    const { middleware } = await import("@/middleware");
    const mockedAuthApi = vi.mocked(authApi);
    const nextAccessToken = fakeJwt(Math.floor(Date.now() / 1000) + 3600);
    const nextRefreshToken = fakeJwt(Math.floor(Date.now() / 1000) + 3600 * 24);

    mockedAuthApi.refreshToken.mockResolvedValueOnce({
      status: 200,
      data: {
        accessToken: nextAccessToken,
        refreshToken: nextRefreshToken,
      },
    } as never);

    const response = await middleware(
      makeRequest("/", "refresh_token=old-refresh; device_id=device-42"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://frontend.local/dashboard",
    );

    const setCookie = response.headers.get("set-cookie") || "";

    expect(setCookie).toContain("access_token=");
    expect(setCookie).toContain("refresh_token=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=strict");
  });

  it("refreshes session for protected route and allows access", async () => {
    const { middleware } = await import("@/middleware");
    const mockedAuthApi = vi.mocked(authApi);
    const nextAccessToken = fakeJwt(Math.floor(Date.now() / 1000) + 3600);
    const nextRefreshToken = fakeJwt(Math.floor(Date.now() / 1000) + 3600 * 24);

    mockedAuthApi.refreshToken.mockResolvedValueOnce({
      status: 200,
      data: {
        accessToken: nextAccessToken,
        refreshToken: nextRefreshToken,
      },
    } as never);

    const request = makeRequest(
      "/uk/dashboard",
      "refresh_token=old-refresh; device_id=device-42",
    );
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();

    const setCookie = response.headers.get("set-cookie") || "";

    expect(setCookie).toContain("access_token=");
    expect(setCookie).toContain("refresh_token=");
  });
});
