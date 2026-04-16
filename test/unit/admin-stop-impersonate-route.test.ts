import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { POST } from "@/app/api/auth/admin/stop-impersonate/route";

describe("admin stop impersonation route", () => {
  it("restores admin session and clears impersonation backup cookies", async () => {
    const request = new NextRequest(
      "https://frontend.local/api/auth/admin/stop-impersonate",
      {
        method: "POST",
        headers: {
          cookie:
            "admin_access_token=eyJhbGciOiJIUzI1NiJ9.eyJleHAiIjo0MTAyNDQ0ODAwfQ.signature; admin_refresh_token=eyJhbGciOiJIUzI1NiJ9.eyJleHAiIjo0MTAyNDQ0ODAwfQ.signature; admin_device_id=admin-dev",
        },
      },
    );

    const response = await POST(request);
    const setCookie = response.headers.get("set-cookie") || "";

    expect(response.status).toBe(200);
    expect(setCookie).toContain("access_token=");
    expect(setCookie).toContain("refresh_token=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("admin_access_token=");
    expect(setCookie).toContain("admin_refresh_token=");
    expect(setCookie).toContain("impersonation_meta=");
  });

  it("returns 401 and clears all related cookies when backup session is incomplete", async () => {
    const request = new NextRequest(
      "https://frontend.local/api/auth/admin/stop-impersonate",
      {
        method: "POST",
        headers: {
          cookie: "admin_access_token=token-only",
        },
      },
    );

    const response = await POST(request);
    const setCookie = response.headers.get("set-cookie") || "";

    expect(response.status).toBe(401);
    expect(setCookie).toContain("access_token=");
    expect(setCookie).toContain("refresh_token=");
    expect(setCookie).toContain("admin_access_token=");
    expect(setCookie).toContain("admin_refresh_token=");
    expect(setCookie).toContain("admin_device_id=");
  });
});
