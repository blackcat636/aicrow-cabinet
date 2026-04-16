import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { POST } from "@/app/api/auth/refresh/route";

describe("auth refresh route", () => {
  it("sets httpOnly token cookies on successful refresh", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: 200,
            data: {
              accessToken:
                "eyJhbGciOiJIUzI1NiJ9.eyJleHAiIjo0MTAyNDQ0ODAwfQ.signature",
              refreshToken:
                "eyJhbGciOiJIUzI1NiJ9.eyJleHAiIjo0MTAyNDQ0ODAwfQ.signature",
            },
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      ),
    );

    const request = new NextRequest("https://frontend.local/api/auth/refresh", {
      method: "POST",
      headers: {
        cookie: "refresh_token=rt; device_id=dev-1",
      },
    });

    const response = await POST(request);
    const setCookie = response.headers.get("set-cookie") || "";

    expect(response.status).toBe(200);
    expect(setCookie).toContain("access_token=");
    expect(setCookie).toContain("refresh_token=");
    expect(setCookie).toContain("HttpOnly");

    vi.unstubAllGlobals();
  });

  it("clears auth cookies on invalid refresh token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ status: 401, message: "Invalid refresh token" }),
          {
            status: 401,
            headers: { "content-type": "application/json" },
          },
        ),
      ),
    );

    const request = new NextRequest("https://frontend.local/api/auth/refresh", {
      method: "POST",
      headers: {
        cookie: "refresh_token=rt; device_id=dev-1",
      },
    });

    const response = await POST(request);
    const setCookie = response.headers.get("set-cookie") || "";

    expect(response.status).toBe(401);
    expect(setCookie).toContain("access_token=");
    expect(setCookie).toContain("refresh_token=");
    expect(setCookie).toContain("device_id=");

    vi.unstubAllGlobals();
  });
});
