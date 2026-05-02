"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';

interface AssociateIdProps {
  className?: string;
}

export default function AssociateId({ className }: AssociateIdProps) {
  const { userData } = useAuth();
  const [displayId, setDisplayId] = React.useState<string | null>(null);

  React.useEffect(() => {
    // 1. Priority: Live data from AuthContext
    if (userData?.associateId) {
      setDisplayId(userData.associateId);
      return;
    }

    // 2. Fallback: Cached data from LocalStorage
    const cached = localStorage.getItem('cached_associate_id');
    if (cached) {
      setDisplayId(cached);
    }
  }, [userData?.associateId]);

  if (!displayId) {
    return <span className={className} suppressHydrationWarning>----</span>;
  }

  return (
    <span className={className} suppressHydrationWarning>
      {displayId}
    </span>
  );
}
