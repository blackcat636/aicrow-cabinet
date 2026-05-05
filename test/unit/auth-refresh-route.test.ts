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

  it("returns request id header for traceability", async () => {
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
        "x-request-id": "req-123",
      },
    });

    const response = await POST(request);

    expect(response.headers.get("x-request-id")).toBe("req-123");

    vi.unstubAllGlobals();
  });

  it("returns 401 without calling upstream when refresh token is missing", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const request = new NextRequest("https://frontend.local/api/auth/refresh", {
      method: "POST",
      headers: {
        cookie: "device_id=dev-1",
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("No refresh token found");
    expect(response.headers.get("x-request-id")).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("uses normalized backend error message from payload.error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ status: 403, error: "Forbidden by policy" }),
          {
            status: 403,
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
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Forbidden by policy");
    expect(response.headers.get("x-request-id")).toBeTruthy();

    vi.unstubAllGlobals();
  });
});
