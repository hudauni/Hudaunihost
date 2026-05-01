"use client";

import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#001a1a] flex flex-col items-center justify-center font-sans p-6 text-center">
      <Navbar />

      <div className="max-w-md w-full bg-white/[0.03] border border-white/10 rounded-3xl p-12 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-red-500 shadow-lg shadow-red-500/5">
          <WifiOff size={48} />
        </div>

        <h1 className="text-3xl font-black text-white italic mb-4 font-bengali">
          আপনি <span className="text-red-400">অফলাইনে</span> আছেন
        </h1>

        <p className="text-white/40 mb-10 leading-relaxed font-bengali">
          আপনার ইন্টারনেট সংযোগ বিচ্ছিন্ন হয়ে গেছে। এই পেজটি আগে লোড করা না থাকলে দেখা সম্ভব নয়। দয়া করে আপনার ইন্টারনেট চেক করুন।
        </p>

        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-500/10 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <RefreshCw size={20} />
          আবার চেষ্টা করুন
        </button>
      </div>

      <p className="mt-8 text-white/10 text-[10px] uppercase font-bold tracking-[0.3em]">
        Huda Uni Offline Support
      </p>
    </div>
  );
}
