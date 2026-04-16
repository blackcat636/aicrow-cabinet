import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { GET } from "@/app/api/proxy/[...path]/route";

const API_BASE = "https://app.aipills.ca";

const makeRequest = (cookie: string) =>
  new NextRequest("https://frontend.local/api/proxy/users/profile", {
    method: "GET",
    headers: {
      cookie,
    },
  });

describe("api proxy route", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it("forwards successful request with access token and device id", async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await GET(makeRequest("access_token=a1; device_id=d1"), {
      params: Promise.resolve({ path: ["users", "profile"] }),
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];

    expect(url).toBe(`${API_BASE}/users/profile`);
    const headers = init?.headers as Headers;

    expect(headers.get("authorization")).toBe("Bearer a1");
    expect(headers.get("x-device-id")).toBe("d1");
    expect(response.status).toBe(200);
  });

  it("refreshes session and retries request on 401", async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: 200,
            data: {
              accessToken: "new-access",
              refreshToken: "new-refresh",
            },
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    const response = await GET(
      makeRequest(
        "access_token=old-access; refresh_token=old-refresh; device_id=dev1",
      ),
      {
        params: Promise.resolve({ path: ["users", "profile"] }),
      },
    );

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const setCookie = response.headers.get("set-cookie") || "";

    expect(setCookie).toContain("access_token=");
    expect(setCookie).toContain("HttpOnly");
    expect(response.status).toBe(200);
  });

  it("clears auth cookies when refresh fails", async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Refresh failed" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        }),
      );

    const response = await GET(
      makeRequest(
        "access_token=old-access; refresh_token=old-refresh; device_id=dev1",
      ),
      {
        params: Promise.resolve({ path: ["users", "profile"] }),
      },
    );

    expect(response.status).toBe(401);
    const setCookie = response.headers.get("set-cookie") || "";

    expect(setCookie).toContain("access_token=");
    expect(setCookie).toContain("refresh_token=");
  });
});
