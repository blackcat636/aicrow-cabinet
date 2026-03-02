'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';

/**
 * Redirect /workflows to /market for backward compatibility.
 */
export default function WorkflowsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/market');
  }, [router]);

  return null;
}
