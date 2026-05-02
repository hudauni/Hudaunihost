"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';

interface AssociateIdProps {
  className?: string;
}

export default function AssociateId({ className }: AssociateIdProps) {
  const { userData } = useAuth();

  // Use cached ID if Firestore data is still loading
  const displayId = userData?.associateId || (typeof window !== 'undefined' ? localStorage.getItem('cached_associate_id') : null);

  if (!displayId) {
    return <span className={className}>----</span>;
  }

  return (
    <span className={className}>
      {displayId}
    </span>
  );
}
