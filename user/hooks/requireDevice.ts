'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '../lib/storage';

export function useRequireDevice() {
  const router = useRouter();
  const [aacUserId, setAacUserId] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const id = storage.getAacUserId();
    if (!id) {
      router.replace('/scan');
    } else {
      setAacUserId(id);
      setIsReady(true);
    }
  }, [router]);

  return { aacUserId, isReady };
}