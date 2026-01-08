export type SiteConfig = typeof siteConfig;

/**
 * Get the base URL for external services based on current environment
 * This allows using relative paths in redirect_uri that will be automatically
 * converted to absolute URLs based on the environment
 */
export const getExternalServiceBaseUrl = (): string => {
  // Check if we're in browser environment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Development environments
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return process.env.NEXT_PUBLIC_EXTERNAL_SERVICE_URL_DEV || 'http://localhost:3000';
    }
    
    // Develop/staging environments (Cloudflare Pages)
    if (hostname.includes('develop.') || hostname.includes('staging.')) {
      // For develop branch, use the same domain but different subdomain if needed
      // Or use the configured staging URL
      const stagingUrl = process.env.NEXT_PUBLIC_EXTERNAL_SERVICE_URL_STAGING;
      if (stagingUrl) {
        return stagingUrl;
      }
      // Auto-detect: if we're on develop.aicrow-cabinet.pages.dev, 
      // external service might be on the same domain
      return `https://${hostname}`;
    }
    
    // Production environment
    if (hostname.includes('pages.dev') || hostname.includes('aicrow-cabinet')) {
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
 * Normalize redirect_uri - converts relative paths to absolute URLs
 * based on the current environment
 */
export const normalizeRedirectUri = (redirectUri: string): string => {
  try {
    // If it's already an absolute URL, return as is
    const url = new URL(redirectUri);
    return url.toString();
  } catch {
    // If it's a relative path, convert to absolute URL
    const baseUrl = getExternalServiceBaseUrl();
    // Remove leading slash if present to avoid double slashes
    const path = redirectUri.startsWith('/') ? redirectUri : `/${redirectUri}`;
    return `${baseUrl}${path}`;
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
