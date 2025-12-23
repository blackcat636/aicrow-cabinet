import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function AuthCallbackRoot() {
  const locale = routing.defaultLocale;
  redirect(`/${locale}/auth/callback`);
}

