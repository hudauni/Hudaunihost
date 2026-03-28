"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#001a1a] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center bg-no-repeat overflow-hidden"
      style={{
        backgroundImage: "url('/images/mainimg.webp')",
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        backgroundColor: "#002b2b"
      }}
    >
      <div className="w-full max-w-[320px] flex flex-col items-center space-y-10 p-8">

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-white italic drop-shadow-lg" style={{ fontFamily: 'serif' }}>
            Huda <span className="text-emerald-400">Uni</span>
          </h1>
          <p className="text-white/60 text-xs uppercase tracking-[0.2em] font-bold">Islamic University System</p>
        </div>

        <div className="flex flex-col items-center space-y-6 w-full">
          <button
            onClick={login}
            className="w-[240px] py-3.5 px-4 bg-white text-black rounded-2xl flex items-center justify-center gap-2.5 font-bold transition-all active:scale-95 hover:bg-white/90 shadow-[0_10px_30px_rgba(0,0,0,0.3)] text-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
            Continue with Google
          </button>

          <p className="text-white/60 text-[12px] text-center px-4 leading-relaxed font-bengali font-medium drop-shadow-md">
            লগইন করার মাধ্যমে আপনি আমাদের শর্তাবলী এবং গোপনীয়তা নীতির সাথে সম্মত হচ্ছেন।
          </p>
        </div>

      </div>
    </div>
  );
}
