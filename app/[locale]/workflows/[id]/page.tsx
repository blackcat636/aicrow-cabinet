"use client";

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default function RedirectWorkflowDetail() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const id = params?.id as string;
    if (id) router.replace(`/dashboard/workflows/${id}`);
  }, [params, router]);

  return null;
}
