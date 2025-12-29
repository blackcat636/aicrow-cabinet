import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function AuthCallbackRoot({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const locale = routing.defaultLocale;
  const qs = new URLSearchParams(
    Object.entries(searchParams).flatMap(([key, value]) => {
      if (value === undefined) return [];
      if (Array.isArray(value)) {
        return value.map(v => [key, v] as [string, string]);
      }
      return [[key, value] as [string, string]];
    })
  ).toString();

  const target = `/${locale}/auth/callback${qs ? `?${qs}` : ''}`;
  redirect(target);
}

