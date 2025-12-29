import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function AuthCallbackRoot({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const locale = routing.defaultLocale;
  const resolved = searchParams ? await searchParams : {};

  const qs = new URLSearchParams(
    Object.entries(resolved).flatMap(([key, value]) => {
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

