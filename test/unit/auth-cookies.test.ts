import { describe, expect, it } from "vitest";

import {
  getAuthTokenCookieOptions,
  getClearAuthTokenCookieOptions,
  getDeviceCookieOptions,
  getClearDeviceCookieOptions,
  getAdminTokenCookieOptions,
  getClearAdminTokenCookieOptions,
} from "@/lib/auth-cookies";

describe("auth-cookies policy", () => {
  it("applies secure httpOnly policy for auth token cookies", () => {
    const options = getAuthTokenCookieOptions(3600);

    expect(options.path).toBe("/");
    expect(options.sameSite).toBe("strict");
    expect(options.httpOnly).toBe(true);
    expect(options.maxAge).toBe(3600);
  });

  it("does not set httpOnly for device cookie", () => {
    const options = getDeviceCookieOptions(60);

    expect(options.path).toBe("/");
    expect(options.sameSite).toBe("strict");
    expect("httpOnly" in options).toBe(false);
    expect(options.maxAge).toBe(60);
  });

  it("uses consistent clear strategy for auth and admin token cookies", () => {
    const authClear = getClearAuthTokenCookieOptions();
    const adminClear = getClearAdminTokenCookieOptions();

    expect(authClear.httpOnly).toBe(true);
    expect(adminClear.httpOnly).toBe(true);
    expect(authClear.path).toBe("/");
    expect(adminClear.path).toBe("/");
    expect(authClear.expires.getTime()).toBeLessThanOrEqual(Date.now());
    expect(adminClear.expires.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("uses consistent clear strategy for device cookie", () => {
    const options = getClearDeviceCookieOptions();

    expect(options.path).toBe("/");
    expect(options.sameSite).toBe("strict");
    expect(options.expires.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("normalizes non-positive maxAge to zero", () => {
    expect(getAuthTokenCookieOptions(-5).maxAge).toBe(0);
    expect(getDeviceCookieOptions(0).maxAge).toBe(0);
    expect(getAdminTokenCookieOptions(-100).maxAge).toBe(0);
  });
});
