type CookieBaseOptions = {
  path: string;
  secure: boolean;
  sameSite: 'strict';
};

const isProduction = process.env.NODE_ENV === 'production';

const baseCookieOptions: CookieBaseOptions = {
  path: '/',
  secure: isProduction,
  sameSite: 'strict'
};

const toPositiveMaxAge = (maxAge: number): number => Math.max(0, Math.floor(maxAge));

export const getAuthTokenCookieOptions = (maxAge: number) => ({
  ...baseCookieOptions,
  httpOnly: true,
  maxAge: toPositiveMaxAge(maxAge)
});

export const getAdminTokenCookieOptions = (maxAge: number) => ({
  ...baseCookieOptions,
  httpOnly: true,
  maxAge: toPositiveMaxAge(maxAge)
});

export const getDeviceCookieOptions = (maxAge: number) => ({
  ...baseCookieOptions,
  maxAge: toPositiveMaxAge(maxAge)
});

export const getClearAuthTokenCookieOptions = () => ({
  ...baseCookieOptions,
  httpOnly: true,
  expires: new Date(0)
});

export const getClearAdminTokenCookieOptions = () => ({
  ...baseCookieOptions,
  httpOnly: true,
  expires: new Date(0)
});

export const getClearDeviceCookieOptions = () => ({
  ...baseCookieOptions,
  expires: new Date(0)
});

export const getImpersonationMetaCookieOptions = (maxAge: number) => ({
  ...baseCookieOptions,
  maxAge: toPositiveMaxAge(maxAge)
});

export const getClearImpersonationMetaCookieOptions = () => ({
  ...baseCookieOptions,
  expires: new Date(0)
});
