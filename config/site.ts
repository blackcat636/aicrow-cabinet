export type SiteConfig = typeof siteConfig;

/**
 * Get the base URL for external services based on current environment
 * This allows using relative paths in redirect_uri that will be automatically
 * converted to absolute URLs based on the environment
 */
export const getExternalServiceBaseUrl = (hostname?: string): string => {
  // Get hostname from parameter or window
  const currentHostname =
    hostname ||
    (typeof window !== 'undefined' ? window.location.hostname : undefined);

  if (currentHostname) {
    // Development environments
    if (
      currentHostname.includes('localhost') ||
      currentHostname.includes('127.0.0.1')
    ) {
      return (
        process.env.NEXT_PUBLIC_EXTERNAL_SERVICE_URL_DEV ||
        'http://localhost:3000'
      );
    }

    // Develop/staging environments (Cloudflare Pages)
    if (
      currentHostname.includes('develop.') ||
      currentHostname.includes('staging.')
    ) {
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
    if (
      currentHostname.includes('pages.dev') ||
      currentHostname.includes('aicrow-cabinet')
    ) {
      const prodUrl = process.env.NEXT_PUBLIC_EXTERNAL_SERVICE_URL_PROD;
      if (prodUrl) {
        return prodUrl;
      }
      // Auto-detect production URL
      return 'https://aicrow-cabinet.pages.dev';
    }
  }

  // Server-side fallback - use environment variables
  return (
    process.env.NEXT_PUBLIC_EXTERNAL_SERVICE_URL ||
    process.env.NEXT_PUBLIC_EXTERNAL_SERVICE_URL_PROD ||
    'https://aicrow-cabinet.pages.dev'
  );
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
