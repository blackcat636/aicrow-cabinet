"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function RedirectWorkflowDetail() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const id = params?.id as string;
    if (id) router.replace(`/dashboard/workflows/${id}`);
  }, [params, router]);

  return null;
}
