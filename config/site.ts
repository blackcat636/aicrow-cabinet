export type SiteConfig = typeof siteConfig;

/**
 * Get the base URL for external services based on current environment
 * This allows using relative paths in redirect_uri that will be automatically
 * converted to absolute URLs based on the environment
 */
export const getExternalServiceBaseUrl = (hostname?: string): string => {
  // Get hostname from parameter or window
  const currentHostname = hostname || 
    (typeof window !== 'undefined' ? window.location.hostname : undefined);
  
  if (currentHostname) {
    // Development environments
    if (currentHostname.includes('localhost') || currentHostname.includes('127.0.0.1')) {
      return process.env.NEXT_PUBLIC_EXTERNAL_SERVICE_URL_DEV || 'http://localhost:3000';
    }
    
    // Develop/staging environments (Cloudflare Pages)
    if (currentHostname.includes('develop.') || currentHostname.includes('staging.')) {
      // For develop branch, use the same domain but different subdomain if needed
      // Or use the configured staging URL
      const stagingUrl = process.env.NEXT_PUBLIC_EXTERNAL_SERVICE_URL_STAGING;
      if (stagingUrl) {
        return stagingUrl;
      }
      // Auto-detect: if we're on develop.aicrow-cabinet.pages.dev, 
      // external service might be on the same domain
      return `https://${currentHostname}`;
    }
    
    // Production environment
    if (currentHostname.includes('pages.dev') || currentHostname.includes('aicrow-cabinet')) {
      const prodUrl = process.env.NEXT_PUBLIC_EXTERNAL_SERVICE_URL_PROD;
      if (prodUrl) {
        return prodUrl;
      }
      // Auto-detect production URL
      return 'https://aicrow-cabinet.pages.dev';
    }
  }
  
  // Server-side fallback - use environment variables
  return process.env.NEXT_PUBLIC_EXTERNAL_SERVICE_URL || 
         process.env.NEXT_PUBLIC_EXTERNAL_SERVICE_URL_PROD || 
         'https://aicrow-cabinet.pages.dev';
};

/**
 * Validate redirect_uri - check if it points to internal routes
 * Internal routes should not be used as redirect_uri
 * This validates BEFORE normalization to catch localhost/internal routes early
 */
const validateRedirectUri = (redirectUri: string, currentOrigin: string): { valid: boolean; error?: string } => {
  const internalRoutes = ['/login', '/signup', '/auth/callback', '/sso/initiate', '/auth/sso/initiate', '/dashboard'];
  const logPrefix = '[validateRedirectUri]';
  
  console.log(`${logPrefix} Validating redirect_uri:`, {
    redirectUri,
    currentOrigin
  });
  
  try {
    const url = new URL(redirectUri);
    const pathname = url.pathname;
    
    console.log(`${logPrefix} Parsed URL:`, {
      hostname: url.hostname,
      pathname: pathname,
      origin: url.origin
    });
    
    // Check if it's an internal route (regardless of domain)
    if (internalRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
      console.error(`${logPrefix} ❌ Internal route detected:`, pathname);
      return {
        valid: false,
        error: `redirect_uri не може вказувати на внутрішні маршрути (${pathname}). ` +
               `redirect_uri має вказувати на зовнішній сервіс (callback URL), наприклад: ` +
               `https://external-service.com/callback або /callback. ` +
               `Після логіну система робить redirect на redirect_uri з SSO кодом, тому він не може бути внутрішнім маршрутом.`
      };
    }
    
    // Check if redirect_uri points to current domain (after normalization would happen)
    if (url.origin === currentOrigin || url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      // If it's localhost, it will be normalized to currentOrigin, so check pathname
      if (internalRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
        console.error(`${logPrefix} ❌ Internal route on localhost/current domain:`, pathname);
        return {
          valid: false,
          error: `redirect_uri не може вказувати на внутрішні маршрути (${pathname}). ` +
                 `redirect_uri має вказувати на зовнішній сервіс (callback URL), наприклад: ` +
                 `https://external-service.com/callback або /callback. ` +
                 `Після логіну система робить redirect на redirect_uri з SSO кодом, тому він не може бути внутрішнім маршрутом.`
        };
      }
    }
    
    console.log(`${logPrefix} ✅ Validation passed`);
    return { valid: true };
  } catch {
    // Relative path - check if it's internal route
    const path = redirectUri.startsWith('/') ? redirectUri : `/${redirectUri}`;
    console.log(`${logPrefix} Relative path detected:`, path);
    
    if (internalRoutes.some(route => path === route || path.startsWith(route + '/'))) {
      console.error(`${logPrefix} ❌ Internal route in relative path:`, path);
      return {
        valid: false,
        error: `redirect_uri не може вказувати на внутрішні маршрути (${path}). ` +
               `redirect_uri має вказувати на зовнішній сервіс (callback URL), наприклад: ` +
               `https://external-service.com/callback або /callback. ` +
               `Після логіну система робить redirect на redirect_uri з SSO кодом, тому він не може бути внутрішнім маршрутом.`
      };
    }
    
    console.log(`${logPrefix} ✅ Validation passed for relative path`);
    return { valid: true };
  }
};

/**
 * Normalize redirect_uri - universal solution that works for all cases:
 * 1. If redirect_uri is localhost - replace with current domain
 * 2. If redirect_uri is relative path - use current domain
 * 3. If redirect_uri is absolute URL from different domain - use as is
 * 
 * This makes it work universally across all environments without configuration
 */
export const normalizeRedirectUri = (redirectUri: string, requestOrigin?: string): string => {
  const logPrefix = '[normalizeRedirectUri]';
  
  // Get current origin (where the request is coming from)
  let currentOrigin: string;
  
  if (requestOrigin) {
    try {
      const originUrl = new URL(requestOrigin);
      currentOrigin = originUrl.origin;
    } catch {
      currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    }
  } else {
    currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  }

  console.log(`${logPrefix} 📥 Input:`, {
    redirectUri,
    requestOrigin,
    currentOrigin,
    isClient: typeof window !== 'undefined',
    windowOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A'
  });

  // Validate redirect_uri BEFORE normalization
  // This catches localhost/internal routes early
  const validation = validateRedirectUri(redirectUri, currentOrigin);
  if (!validation.valid) {
    console.error(`${logPrefix} ❌ Validation failed:`, validation.error);
    throw new Error(validation.error || 'Invalid redirect_uri');
  }

  try {
    // Try to parse as absolute URL
    const url = new URL(redirectUri);
    
    console.log(`${logPrefix} Parsed URL:`, {
      hostname: url.hostname,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      origin: url.origin
    });
    
    // If it's localhost, replace with current domain
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      // Preserve path, query, and hash from original redirect_uri
      const path = url.pathname + url.search + url.hash;
      const normalized = `${currentOrigin}${path}`;
      console.log(`${logPrefix} ✅ Localhost detected, normalized:`, {
        original: redirectUri,
        normalized,
        path: path,
        currentOrigin: currentOrigin
      });
      return normalized;
    }
    
    // If it's already a valid absolute URL from different domain, use as is
    console.log(`${logPrefix} ✅ Absolute URL from different domain, using as is:`, {
      original: redirectUri,
      hostname: url.hostname,
      origin: url.origin
    });
    return url.toString();
  } catch (error) {
    // If it's a relative path, prepend current origin
    const path = redirectUri.startsWith('/') ? redirectUri : `/${redirectUri}`;
    const normalized = `${currentOrigin}${path}`;
    console.log(`${logPrefix} ✅ Relative path, normalized:`, {
      original: redirectUri,
      normalized,
      path: path,
      currentOrigin: currentOrigin,
      parseError: error instanceof Error ? error.message : 'Unknown error'
    });
    return normalized;
  }
};

export const siteConfig = {
  name: 'Ai Pills User Account',
  description: 'User interface for AiPills CRM system',
  navItems: [],
  navMenuItems: [],
  links: {
    github: 'https://github.com/aipills',
    twitter: 'https://twitter.com/aipills',
    docs: 'https://docs.aipills.com'
  }
};
