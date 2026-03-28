"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Play, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

interface SkillVideo {
  id: string;
  title: string;
  youtubeId: string;
}

export default function SkillsPage() {
  const [videos, setVideos] = useState<SkillVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const q = query(collection(db, "skillsVideos"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SkillVideo[];
        setVideos(data);
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#001a1a] flex flex-col font-sans overflow-x-hidden">
      <Navbar showHome={true} />

      <main className="relative flex-1 w-full flex flex-col items-center">

        {/* --- MOBILE VERSION --- */}
        <div
          className="lg:hidden w-full h-[calc(100vh+2px)] flex flex-col items-center bg-no-repeat pt-0 pb-6 overflow-hidden"
          style={{
            backgroundImage: "url('/images/bgimg.webp')",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
          }}
        >
          <div className="w-full flex justify-start px-6 pt-2 mb-0">
            <Link href="/" className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white shadow-lg">
              <ChevronLeft size={18} />
            </Link>
          </div>

          <h2 className="text-[#8b5cf6] text-lg font-bold mb-3 -mt-[27px] drop-shadow-sm font-bengali relative z-10">
            সাফল্যের জন্য দক্ষতা
          </h2>

          <div className="flex-1 w-full overflow-y-auto custom-scrollbar px-6 flex flex-col items-center space-y-5 mb-4 mt-[17px]">
            {loading ? (
              <div className="pt-20 text-emerald-500 animate-pulse font-bengali">লোড হচ্ছে...</div>
            ) : videos.length > 0 ? (
              videos.map((video) => (
                <div key={video.id} className="w-full max-w-[280px] flex flex-col items-center">
                  <div
                    onClick={() => setSelectedVideo(video.youtubeId)}
                    className="w-full aspect-video bg-white/20 backdrop-blur-md rounded-md border border-white/30 flex items-center justify-center shadow-xl relative overflow-hidden group cursor-pointer active:scale-95 transition-transform"
                  >
                    <img
                      src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                      alt={video.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-40"
                    />
                    <div className="w-12 h-12 bg-black/20 rounded-full flex items-center justify-center border border-white/20 relative z-10">
                      <Play size={24} className="text-white fill-white/20 ml-1" />
                    </div>
                  </div>
                  <p className="mt-1.5 text-black text-[13px] font-bold font-bengali text-center leading-tight">{video.title}</p>
                </div>
              ))
            ) : (
              <div className="pt-20 text-white/20 font-bengali">কোনো ভিডিও পাওয়া যায়নি</div>
            )}
          </div>

          <div className="w-full px-12 space-y-2.5 mt-auto mb-[45px]">
            <button className="w-full py-2.5 bg-gradient-to-r from-[#6d28d9] to-[#4c1d95] text-white rounded-xl font-bold font-bengali shadow-[0_6px_12px_rgba(0,0,0,0.3)] border-t border-white/20 active:scale-95 transition-all text-[13px]">
              ফুল কোর্স পেতে এনরোল করুন।
            </button>
            <button className="w-full py-2.5 bg-gradient-to-r from-[#7c3aed] to-[#5b21b6] text-white rounded-xl font-bold font-bengali shadow-[0_6px_12px_rgba(0,0,0,0.3)] border-t border-white/20 active:scale-95 transition-all text-[13px]">
              ফুল কোর্স
            </button>
          </div>
        </div>

        {/* --- DESKTOP VERSION --- */}
        <div className="hidden lg:flex w-full relative bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#011a1a] min-h-screen pt-[73px]">
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>

          <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col px-10 py-12 items-center">
            <h2 className="text-6xl font-black text-white mb-8 tracking-tight font-bengali not-italic text-center">
              সাফল্যের জন্য দক্ষতা
            </h2>

            <div className="flex items-center justify-center space-x-6 mb-16">
              <button className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold font-bengali shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all transform hover:-translate-y-1 active:scale-95 border-t border-white/20">
                ফুল কোর্স পেতে এনরোল করুন।
              </button>
              <button className="px-14 py-4 bg-white/[0.05] hover:bg-white/[0.1] text-emerald-400 border border-emerald-500/20 rounded-2xl font-bold font-bengali shadow-lg transition-all transform hover:-translate-y-1 active:scale-95">
                ফুল কোর্স
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 w-full px-10 pt-6">
              {loading ? (
                <div className="col-span-full text-center text-emerald-500 animate-pulse font-bengali">লোড হচ্ছে...</div>
              ) : videos.length > 0 ? (
                videos.map((video) => (
                  <div key={video.id} className="flex flex-col items-center group w-full">
                    <div
                      onClick={() => setSelectedVideo(video.youtubeId)}
                      className="w-full aspect-video bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-3xl border border-white/10 rounded-xl flex items-center justify-center transition-all duration-500 transform hover:-translate-y-3 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden cursor-pointer hover:border-emerald-500/30"
                    >
                      <img
                        src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                        alt={video.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500 shadow-emerald-500/20 relative z-10">
                        <Play size={32} className="fill-white ml-1" />
                      </div>
                    </div>
                    <p className="mt-5 text-emerald-100/70 text-lg font-bold group-hover:text-emerald-400 transition-colors duration-300 font-bengali text-center w-full">
                      {video.title}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-white/20 py-20 font-bengali">কোনো ভিডিও নেই</div>
              )}
            </div>

            <div className="flex justify-center pb-10 mt-12">
              <Link href="/" className="text-emerald-400/60 hover:text-emerald-400 flex items-center space-x-2 transition-all">
                <ChevronLeft size={20} />
                <span className="font-medium tracking-wide font-bengali">হোমে ফিরে যান</span>
              </Link>
            </div>
          </div>
        </div>

        {/* --- VIDEO PLAYER MODAL --- */}
        {selectedVideo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setSelectedVideo(null)}></div>
            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300">
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black text-white rounded-full transition-all z-10"
              >
                <X size={24} />
              </button>
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
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
