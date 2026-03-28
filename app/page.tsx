"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, Loader2, User } from 'lucide-react';
import Navbar from '@/components/Navbar';
import AssociateId from '@/components/AssociateId';
import PrayerTimeCircle from '@/components/PrayerTimeCircle';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function HomePage() {
  const { user, userData, loading } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchLogo() {
      try {
        const docRef = doc(db, "settings", "general");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLogoUrl(docSnap.data().logoUrl || null);
        }
      } catch (error) {
        console.error("Error fetching logo:", error);
      }
    }
    fetchLogo();
  }, []);

  const menuItems = [
    { title: "আল কুরআন", id: 0, href: "/quran" },
    { title: "মেম্বার হতে চাই", id: 1, href: "/membership" },
    { title: "ইসলাম কি? কেন? কিভাবে?", id: 2, href: "/what-is-islam" },
    { title: "সাফল্যের জন্য দক্ষতা", id: 3, href: "/skills" },
    { title: "সকল সেবা", id: 4, href: "/services" },
    { title: "কাউন্সিলিং প্রয়োজন", id: 5, href: "/counseling" },
    { title: "হুদা ইউনি এর লক্ষ্য-উদ্দেশ্য", id: 6, href: "/goals" },
    { title: "সাদকা প্রদান", id: 7, href: "/sadaka" },
  ];

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#001a1a] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#001a1a] flex flex-col font-sans">

      <Navbar />

      <main className="relative flex-1 w-full flex flex-col items-center lg:pt-[73px]">

        {/* --- MOBILE VERSION --- */}
        <div
          className="lg:hidden w-full min-h-screen flex flex-col items-center bg-no-repeat overflow-y-auto pb-10 custom-scrollbar relative"
          style={{
            backgroundImage: "url('/images/mainimg.webp')",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            backgroundColor: "#002b2b"
          }}
        >
          {/* Mobile Profile Icon Button - Enhanced 3D Vibe */}
          <Link
            href="/profile"
            className="absolute top-6 right-6 p-2.5 bg-gradient-to-br from-[#d4af37] via-[#f9d71c] to-[#b8860b] rounded-full
                       shadow-[0_8px_16px_rgba(0,0,0,0.4),inset_0_-2px_4px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.3)]
                       border-t border-white/30 border-l border-white/20
                       active:scale-90 active:shadow-inner transition-all z-50"
          >
            <User size={20} className="text-[#1a472a] stroke-[3] drop-shadow-sm" />
          </Link>

          <div className="w-full max-w-[280px] flex flex-col items-center">
            <div className="flex flex-col items-center pt-[106px] text-center space-y-1">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-16 object-contain drop-shadow-md mb-2" />
              ) : (
                <h1 className="text-3xl font-bold text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)] italic tracking-tighter"
                    style={{ fontFamily: 'serif' }}>
                  Huda <span className="text-cyan-400">Uni</span>
                </h1>
              )}
              <p className="text-white/70 text-[10px] font-light tracking-[0.2em] uppercase">University</p>

              <div className="mt-2">
                <p className="text-white/90 text-[10px] font-medium font-bengali">
                  আসসালামু আলাইকুম {userData?.displayName?.split(' ')[0]}! আপনার আইডি: <AssociateId className="text-cyan-300 font-bold" />
                </p>
              </div>
            </div>

            <div className="mt-2 mb-1">
               <PrayerTimeCircle size={150} />
            </div>

            <div className="mt-2 w-full max-h-[400px] overflow-y-auto flex flex-col items-center space-y-3 custom-scrollbar px-2">
              {menuItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="relative w-[230px] py-2.5 px-6 bg-white/5 backdrop-blur-xl rounded-full
                             flex items-center justify-between transition-all active:scale-95
                             border-t border-white/10 border-l border-white/5
                             shadow-[0_6px_12px_rgba(0,0,0,0.4),inset_0_-2px_4px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.1)]
                             hover:bg-white/10 border border-white/10 group flex-shrink-0"
                >
                  <span className="text-white text-[13px] font-semibold tracking-wide drop-shadow-sm flex-1 text-center font-bengali">
                    {item.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* --- DESKTOP VERSION --- */}
        <div
          className="hidden lg:flex w-full h-full min-h-[calc(100vh-73px)] items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#011a1a]"
        >
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>

          <div className="relative z-10 w-full max-w-7xl flex items-center justify-between px-20">
            <div className="flex flex-col space-y-12 animate-in fade-in slide-in-from-left-8 duration-1000">
              <div className="space-y-4">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-32 object-contain drop-shadow-2xl mb-4" />
                ) : (
                  <h1 className="text-8xl font-black text-white italic tracking-tighter" style={{ fontFamily: 'serif' }}>
                    Huda <span className="text-emerald-400">Uni</span>
                  </h1>
                )}
                <p className="text-emerald-100/40 text-xl tracking-[0.4em] uppercase font-light">International Islamic University System</p>

                <div className="flex items-center space-x-8">
                  <div className="inline-flex flex-col px-6 py-3 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
                    <p className="text-white/60 text-sm font-medium font-bengali mb-1">
                      স্বাগতম, {userData?.displayName}
                    </p>
                    <p className="text-white/40 text-xs font-medium uppercase tracking-widest border-t border-white/10 pt-2">
                      Associate ID: <AssociateId className="text-emerald-400 font-bold tracking-widest ml-2" />
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-4 backdrop-blur-md shadow-2xl">
                    <PrayerTimeCircle size={120} />
                  </div>
                </div>
              </div>

              <div className="w-[600px] aspect-video bg-[#022c22]/60 backdrop-blur-3xl border border-white/10 rounded-[40px] flex items-center justify-center relative overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7)] group cursor-pointer transition-all hover:border-emerald-500/30">
                <div className="w-24 h-24 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.4)] transition-transform group-hover:scale-110">
                  <Play size={40} className="fill-white ml-1" />
                </div>
                <div className="absolute bottom-8 left-10 right-10 h-1.5 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 w-1/3 rounded-full shadow-[0_0_20px_#10b981]"></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col w-[420px] animate-in fade-in slide-in-from-right-8 duration-1000 delay-300 h-[620px]">
              <h3 className="text-white/40 text-xs font-bold uppercase tracking-[0.3em] mb-6 pl-4 border-l-2 border-emerald-500 flex-shrink-0">Academic Navigation</h3>

              <div className="flex flex-col space-y-4 overflow-y-auto pr-6 custom-scrollbar">
                {menuItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group relative w-full py-4 px-8 bg-white/[0.05] backdrop-blur-3xl rounded-2xl lg:rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-95 flex-shrink-0
                               border-t border-white/20 border-l border-white/10
                               shadow-[0_12px_30px_rgba(0,0,0,0.5),inset_0_-4px_8px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.1)]
                               hover:bg-white/[0.08] hover:translate-x-2"
                  >
                    <span className="text-white text-lg font-medium tracking-wide group-hover:text-emerald-400 transition-colors drop-shadow-md flex-1 text-center font-bengali">
                      {item.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.5);
        }

        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-in-from-left-8 { from { transform: translateX(-2rem); } to { transform: translateY(0); } }
        @keyframes slide-in-from-right-8 { from { transform: translateX(2rem); } to { transform: translateY(0); } }
        .animate-in { animation: fade-in 1s ease-out; }
      `}</style>
    </div>
  );
}
