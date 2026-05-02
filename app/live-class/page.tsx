"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Video, ExternalLink, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function LiveClassPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docSnap = await getDoc(doc(db, "settings", "general"));
        if (docSnap.exists()) {
          setSettings(docSnap.data());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#001a1a] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#001a1a] flex flex-col font-sans">
      <Navbar showHome={true} />

      <main className="relative flex-1 w-full flex flex-col items-center justify-center p-6">
        <div
          className="absolute inset-0 bg-no-repeat bg-cover bg-center opacity-10 pointer-events-none"
          style={{ backgroundImage: "url('/images/mainimg.webp')" }}
        ></div>

        <div className="w-full max-w-xl bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0"></div>

          <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-400 mb-8 border border-emerald-500/20 shadow-inner">
            <Video size={40} />
          </div>

          <h2 className="text-3xl font-black text-white italic mb-4 tracking-tight font-bengali">
            অনলাইন লাইভ ক্লাস
          </h2>

          <div className="text-white/70 font-bengali text-lg leading-relaxed mb-10 whitespace-pre-wrap">
            {settings?.liveClassText || "লাইভ ক্লাস সম্পর্কে বিস্তারিত তথ্য এডমিন প্যানেল থেকে যোগ করুন।"}
          </div>

          {settings?.liveClassLink ? (
            <a
              href={settings.liveClassLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <ExternalLink size={20} />
              {settings.liveClassButtonText || "Join Meeting"}
            </a>
          ) : (
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white/40 text-sm font-bold uppercase tracking-widest">
              No meeting link available
            </div>
          )}

          <Link href="/" className="mt-8 text-emerald-400 hover:text-emerald-300 flex items-center gap-2 transition-all hover:-translate-x-1">
            <ChevronLeft size={18} />
            <span className="font-bold font-bengali">হোমে ফিরে যান</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
