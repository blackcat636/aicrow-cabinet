import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getClientPreferredLocale,
  getLocalizedAppPath,
} from '@/lib/client-locale';

describe('client-locale', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses pathname prefix over cookies', () => {
    vi.stubGlobal('window', { location: { pathname: '/fr/dashboard' } });
    vi.stubGlobal('document', { cookie: 'NEXT_LOCALE=uk' });
    expect(getClientPreferredLocale()).toBe('fr');
    expect(getLocalizedAppPath('/login')).toBe('/fr/login');
  });

  it('uses first supported cookie when pathname has no locale', () => {
    vi.stubGlobal('window', { location: { pathname: '/login' } });
    vi.stubGlobal('document', { cookie: 'NEXT_LOCALE=uk; path=/' });
    expect(getClientPreferredLocale()).toBe('uk');
    expect(getLocalizedAppPath('/login')).toBe('/uk/login');
  });

  it('omits prefix for default locale with as-needed', () => {
    vi.stubGlobal('window', { location: { pathname: '/dashboard' } });
    vi.stubGlobal('document', { cookie: 'NEXT_LOCALE=en' });
    expect(getClientPreferredLocale()).toBe('en');
    expect(getLocalizedAppPath('/login')).toBe('/login');
  });
});
