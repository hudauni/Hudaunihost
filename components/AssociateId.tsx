"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';

interface AssociateIdProps {
  className?: string;
}

export default function AssociateId({ className }: AssociateIdProps) {
  const { userData } = useAuth();

  if (!userData?.associateId) {
    return <span className={className}>----</span>;
  }

  return (
    <span className={className}>
      {userData.associateId}
    </span>
  );
}
