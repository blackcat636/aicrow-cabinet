import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { POST } from "@/app/api/auth/logout/route";

describe("auth logout route", () => {
  it("always clears auth cookies even if upstream logout fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network unavailable")),
    );

    const request = new NextRequest("https://frontend.local/api/auth/logout", {
      method: "POST",
      headers: {
        cookie:
          "access_token=at; refresh_token=rt; device_id=device-1; other_cookie=1",
      },
    });

    const response = await POST(request);
    const setCookie = response.headers.get("set-cookie") || "";

    expect(response.status).toBe(200);
    expect(setCookie).toContain("access_token=");
    expect(setCookie).toContain("refresh_token=");
    expect(setCookie).toContain("device_id=");

    vi.unstubAllGlobals();
  });

  it("returns request id header from incoming request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 200 })),
    );

    const request = new NextRequest("https://frontend.local/api/auth/logout", {
      method: "POST",
      headers: {
        cookie: "access_token=at; device_id=device-1",
        "x-request-id": "logout-req-1",
      },
    });

    const response = await POST(request);

    expect(response.headers.get("x-request-id")).toBe("logout-req-1");

    vi.unstubAllGlobals();
  });

  it("returns 200 and generated request id when auth cookies are missing", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const request = new NextRequest("https://frontend.local/api/auth/logout", {
      method: "POST",
      headers: {
        cookie: "some_cookie=1",
      },
    });

    const response = await POST(request);
    const setCookie = response.headers.get("set-cookie") || "";

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBeTruthy();
    expect(setCookie).toContain("access_token=");
    expect(setCookie).toContain("refresh_token=");
    expect(setCookie).toContain("device_id=");
    expect(fetchSpy).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
