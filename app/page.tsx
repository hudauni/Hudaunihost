"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, Loader2, User, Zap, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import AssociateId from '@/components/AssociateId';
import PrayerTimeCircle from '@/components/PrayerTimeCircle';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';

export default function HomePage() {
  const { user, userData, loading } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [promoVideos, setPromoVideos] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const docRef = doc(db, "settings", "general");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLogoUrl(docSnap.data().logoUrl || null);
        }

        const qMenu = query(collection(db, "homeMenu"), orderBy("order", "asc"));
        const snapMenu = await getDocs(qMenu);
        setMenuItems(snapMenu.docs.map(d => ({ id: d.id, ...d.data() })));

        const qVideos = query(collection(db, "homeVideos"), orderBy("createdAt", "desc"));
        const snapVideos = await getDocs(qVideos);
        setPromoVideos(snapVideos.docs.map(d => ({ id: d.id, ...d.data() })));

      } catch (e) {
        console.error("Error fetching data:", e);
      } finally {
        setDataLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading || !user || dataLoading) {
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
          className="lg:hidden w-full min-h-screen flex flex-col items-center bg-no-repeat overflow-hidden relative"
          style={{
            backgroundImage: "url('/images/mainimg.webp')",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            backgroundColor: "#002b2b"
          }}
        >
          {/* Profile Icon */}
          <Link
            href="/profile"
            className="absolute top-6 right-6 p-2.5 bg-gradient-to-br from-[#d4af37] via-[#f9d71c] to-[#b8860b] rounded-full
                       shadow-[0_8px_16px_rgba(0,0,0,0.4),inset_0_-2px_4px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.3)]
                       border-t border-white/30 border-l border-white/20
                       active:scale-90 transition-all z-50"
          >
            <User size={20} className="text-[#1a472a] stroke-[3]" />
          </Link>

          <div className="w-full max-w-[280px] flex flex-col items-center">
            <div className="flex flex-col items-center pt-[106px] text-center space-y-1">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-16 object-contain drop-shadow-md mb-2" />
              ) : (
                <h1 className="text-3xl font-bold text-white italic tracking-tighter" style={{ fontFamily: 'serif' }}>
                  Huda <span className="text-cyan-400">Uni</span>
                </h1>
              )}
              <p className="text-white/70 text-[10px] font-light tracking-[0.2em] uppercase">University</p>
              <div className="mt-2">
                <p className="text-white/90 text-[10px] font-medium font-bengali">
                  আসসালামু আলাইকুম {userData?.displayName?.split(' ')[0]}! আইডি: <AssociateId className="text-cyan-300 font-bold" />
                </p>
              </div>
            </div>

            <div className="mt-2 mb-1"><PrayerTimeCircle size={150} /></div>

            {/* SCROLLABLE AREA: Now contains both buttons and videos to keep the original layout style */}
            <div className="mt-2 w-full max-h-[400px] overflow-y-auto custom-scrollbar px-2 flex flex-col items-center space-y-3">
              {menuItems.map((item) => (
                <Link key={item.id} href={item.href} className="relative w-[230px] py-2.5 px-6 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-between border border-white/10 shadow-lg active:scale-95 transition-all flex-shrink-0">
                  <span className="text-white text-[13px] font-semibold tracking-wide flex-1 text-center font-bengali">{item.title}</span>
                </Link>
              ))}

              {/* VIDEO SECTION (INSIDE SCROLLABLE AREA) */}
              {promoVideos.length > 0 && (
                <div className="w-full mt-8 space-y-6 pb-4 flex flex-col items-center">
                  <div className="flex items-center gap-2 w-full px-4">
                    <div className="h-[1px] flex-1 bg-white/10"></div>
                    <span className="text-white/30 text-[8px] font-black uppercase tracking-[0.2em]">Highlights</span>
                    <div className="h-[1px] flex-1 bg-white/10"></div>
                  </div>

                  {promoVideos.map((video) => (
                    <div key={video.id} className="w-[230px] flex-shrink-0 space-y-3">
                      <div
                        onClick={() => setSelectedVideoId(video.youtubeId)}
                        className="relative aspect-video w-full rounded-xl overflow-hidden border border-white/10 shadow-xl group cursor-pointer"
                      >
                        <img src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`} className="w-full h-full object-cover opacity-60" alt=""/>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                            <Play size={18} className="text-white fill-white ml-0.5" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                          <h4 className="text-white font-bold text-[10px] font-bengali line-clamp-1">{video.title}</h4>
                        </div>
                      </div>
                      <Link href="/what-is-islam" className="w-full py-2 bg-white text-black rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                        <Zap size={10} fill="currentColor" /> Enroll Now
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- DESKTOP VERSION --- */}
        <div className="hidden lg:flex w-full min-h-[calc(100vh-73px)] relative overflow-hidden bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#011a1a]">
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>

          <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col py-10 space-y-12 h-full overflow-y-auto custom-scrollbar px-20">
            <div className="flex items-center justify-between">
              <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
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
                      <p className="text-white/60 text-sm font-medium font-bengali mb-1">স্বাগতম, {userData?.displayName}</p>
                      <p className="text-white/40 text-xs font-medium uppercase tracking-widest border-t border-white/10 pt-2">ID: <AssociateId className="text-emerald-400 font-bold ml-2" /></p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-4 backdrop-blur-md shadow-2xl"><PrayerTimeCircle size={120} /></div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col w-[420px] h-[550px]">
                <h3 className="text-white/40 text-xs font-bold uppercase tracking-[0.3em] mb-6 pl-4 border-l-2 border-emerald-500 flex-shrink-0">Academic Navigation</h3>
                <div className="flex flex-col space-y-4 overflow-y-auto pr-6 custom-scrollbar">
                  {menuItems.map((item) => (
                    <Link key={item.id} href={item.href} className="group relative w-full py-4 px-8 bg-white/[0.05] backdrop-blur-3xl rounded-full flex items-center justify-center transition-all duration-300 border border-white/10 shadow-2xl hover:bg-white/[0.08] hover:translate-x-2 flex-shrink-0">
                      <span className="text-white text-lg font-medium tracking-wide group-hover:text-emerald-400 transition-colors font-bengali">{item.title}</span>
                    </Link>
                  ))}

                  {/* DESKTOP VIDEO SECTION */}
                  {promoVideos.length > 0 && (
                    <div className="pt-10 space-y-8">
                      {promoVideos.map((video) => (
                        <div key={video.id} className="space-y-4">
                          <div
                            onClick={() => setSelectedVideoId(video.youtubeId)}
                            className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-xl group cursor-pointer"
                          >
                            <img src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`} className="w-full h-full object-cover opacity-40 group-hover:opacity-80 transition-all" alt=""/>
                            <div className="absolute inset-0 flex items-center justify-center"><Play size={32} className="text-white fill-white/20" /></div>
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                              <h4 className="text-white font-bold text-sm font-bengali">{video.title}</h4>
                            </div>
                          </div>
                          <Link href="/what-is-islam" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl transition-all">
                            <Zap size={14} fill="currentColor" /> Enroll Now
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- VIDEO PLAYER MODAL --- */}
        {selectedVideoId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setSelectedVideoId(null)}></div>
            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300">
              <button
                onClick={() => setSelectedVideoId(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black text-white rounded-full transition-all z-[130]"
              >
                <X size={24} />
              </button>

              <div className="relative w-full h-full">
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideoId}?autoplay=1&modestbranding=1&rel=0`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>

                {/* HIGH PRIORITY OVERLAYS (Now Fully Transparent) */}
                {/* Top Area: Title & Share */}
                <div className="absolute top-0 left-0 right-0 h-[30%] z-[120] bg-transparent pointer-events-auto cursor-default"></div>

                {/* Bottom Area: Controls & YouTube Logo */}
                <div className="absolute bottom-0 left-0 right-0 h-[30%] z-[120] bg-transparent pointer-events-auto cursor-default"></div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
}
