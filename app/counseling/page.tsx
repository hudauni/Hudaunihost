"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function CounselingPage() {
  const counselingTypes = [
    { title: "শারীরিক সমস্যা", id: "5:1" },
    { title: "মানসিক সমস্যা", id: "5:2" },
    { title: "ক্যারিয়ার নিয়ে", id: "5:3" },
    { title: "দাম্পত্য কলহ", id: "5:4" },
    { title: "বিয়ের বিষয়ে", id: "5:5" },
    { title: "আধ্যাত্মিক সমস্যা- জিন/জাদু/নজর", id: "5:6" },
    { title: "পরীক্ষায় ভালো ফলাফল করতে", id: "5:7" },
    { title: "অর্থনৈতিক সমস্যা", id: "5:8" },
    { title: "সন্তান লালনপালন", id: "5:9" },
    { title: "অন্যান্য", id: "5:10" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#001a1a] flex flex-col font-sans overflow-x-hidden">
      <Navbar showHome={true} />

      <main className="relative flex-1 w-full flex flex-col items-center overflow-hidden">

        {/* --- MOBILE VERSION --- */}
        <div
          className="lg:hidden w-full min-h-screen flex flex-col items-center bg-no-repeat pt-0 pb-10 overflow-hidden"
          style={{
            backgroundImage: "url('/images/bgimg.webp')",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
          }}
        >
          <div className="w-full flex justify-start px-6 pt-4 mb-0">
            <Link href="/" className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white shadow-lg active:scale-90 transition-all">
              <ChevronLeft size={18} />
            </Link>
          </div>

          <h2 className="text-white font-bold mb-6 drop-shadow-lg font-bengali text-center px-10 text-xl">
            কাউন্সিলিং প্রয়োজন
          </h2>

          <div className="flex-1 w-full overflow-y-auto custom-scrollbar px-6 flex flex-col items-center space-y-3.5 mb-10">
            {counselingTypes.map((item) => (
              <button
                key={item.id}
                className="w-full max-w-[300px] py-3 px-6 bg-gradient-to-br from-[#1a472a]/70 to-[#001a1a]/90 backdrop-blur-xl border-t border-white/30 border-l border-white/20 rounded-full shadow-[0_8px_15px_rgba(0,0,0,0.5),inset_0_-2px_4px_rgba(0,0,0,0.3)] border border-white/10 flex items-center justify-center active:translate-y-1 active:scale-95 transition-all group"
              >
                <span className="text-white text-[14px] font-bold tracking-wide drop-shadow-md text-center font-bengali">
                  {item.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* --- DESKTOP VERSION --- */}
        <div className="hidden lg:flex w-full flex-col items-center relative bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#011a1a] min-h-[calc(100vh-73px)] pt-20 pb-20 overflow-y-auto custom-scrollbar">
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>

          <div className="relative z-10 w-full max-w-4xl px-10 flex flex-col items-center">
            <h2 className="text-5xl font-black text-white mb-12 tracking-tight font-bengali">কাউন্সিলিং প্রয়োজন</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {counselingTypes.map((item) => (
                <button
                  key={item.id}
                  className="group p-6 bg-gradient-to-br from-[#1a472a]/40 to-[#001a1a]/60 backdrop-blur-3xl border-t border-white/20 border-l border-white/10 rounded-2xl flex items-center justify-center transition-all duration-300 hover:-translate-y-1 shadow-[0_20px_40px_rgba(0,0,0,0.5),inset_0_-2px_6px_rgba(0,0,0,0.3)] hover:border-emerald-500/30"
                >
                  <span className="text-white font-bold text-xl font-bengali text-center drop-shadow-lg">{item.title}</span>
                </button>
              ))}
            </div>

            <Link href="/" className="mt-16 text-emerald-400/60 hover:text-emerald-400 flex items-center space-x-2 transition-all drop-shadow-md">
              <ChevronLeft size={20} />
              <span className="font-bold tracking-wide font-bengali">হোমে ফিরে যান</span>
            </Link>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
}
