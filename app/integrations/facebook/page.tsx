import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function FacebookIntegrationRoot() {
  const locale = routing.defaultLocale;
  redirect(`/${locale}/integrations/facebook`);
}

