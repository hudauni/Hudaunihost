"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';

interface AssociateIdProps {
  className?: string;
}

export default function AssociateId({ className }: AssociateIdProps) {
  const { userData } = useAuth();

  // Initialize state directly from localStorage if available to avoid "vanish" on reload
  const [id, setId] = React.useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cached_associate_id');
    }
    return null;
  });

  // Keep live data synced
  React.useEffect(() => {
    if (userData?.associateId) {
      const liveId = userData.associateId.toString();
      setId(liveId);
      localStorage.setItem('cached_associate_id', liveId);
    }
  }, [userData?.associateId]);

  return (
    <span className={className} suppressHydrationWarning>
      {id || "----"}
    </span>
  );
}
