"use client";

import React, { useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!loading && !isLoginPage) {
      if (!user) {
        router.push('/admin/login');
      } else if (userData && userData.role !== 'admin') {
        // যদি অ্যাডমিন না হয়, তবে তাকে অ্যাডমিন লগইন পেজে পাঠিয়ে দিন যেখানে সে লগআউট করতে পারবে
        router.push('/admin/login');
      }
    }
  }, [user, userData, loading, pathname, router, isLoginPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#001a1a] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  // If it's the login page, don't show the sidebar or apply protection yet
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Protect other admin routes
  if (!user || (userData && userData.role !== 'admin')) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-[#001a1a] flex">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-10">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
