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
