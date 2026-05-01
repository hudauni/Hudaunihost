"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import YouTubePlayer from '@/components/YouTubePlayer';
import { ArrowLeft, Loader2, Zap, Info, List, Play, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function ExploreContentClient() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const cDoc = await getDoc(doc(db, "exploreMenu", id as string));
      if (cDoc.exists()) {
        setContent(cDoc.data());
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) fetchData();
  }, [user, authLoading, fetchData, router]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#001a1a] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  if (!content) return null;

  // Prepare video list (supporting both old single video and new array)
  const videoList = content.videos && Array.isArray(content.videos)
    ? content.videos
    : (content.youtubeId ? [{ title: content.videoTitle || content.title, youtubeId: content.youtubeId }] : []);

  const activeVideo = videoList[activeVideoIndex];

  return (
    <div className="min-h-screen bg-[#001a1a] flex flex-col font-sans">
      <Navbar showHome={true} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 pt-6 lg:pt-28 pb-20">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/40 hover:text-emerald-400 transition-colors font-bold mb-8 uppercase tracking-widest text-xs"
        >
          <ArrowLeft size={16} /> ফিরে যান
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Side: Video & Details (8 Columns) */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl lg:text-4xl font-black text-white font-bengali leading-tight drop-shadow-lg">
                {activeVideo?.title || content.videoTitle || content.title}
              </h1>
              <div className="h-1 w-20 bg-emerald-500 rounded-full"></div>
            </div>

            {activeVideo?.youtubeId ? (
              <div className="shadow-2xl shadow-black/50">
                <YouTubePlayer videoId={activeVideo.youtubeId} key={activeVideo.youtubeId} />
              </div>
            ) : (
              <div className="aspect-video bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 text-white/20 font-bold italic">
                No Video Available
              </div>
            )}

            {/* Video List / Playlist - Moved here to be right under the video */}
            {videoList.length > 1 && (
              <div className="bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="p-5 border-b border-white/10 bg-white/5 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-3">
                    <List size={20} className="text-emerald-400" />
                    <span className="font-bengali">ভিডিও লিস্ট</span>
                  </h2>
                  <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    {videoList.length} Videos
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                  {videoList.map((v: any, idx: number) => {
                    const isActive = idx === activeVideoIndex;
                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveVideoIndex(idx)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-left group border ${
                          isActive
                            ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20 scale-[1.02]'
                            : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/10'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-white/20' : 'bg-black/20 group-hover:bg-emerald-500/20'
                        }`}>
                          {isActive ? <Play size={14} fill="currentColor" /> : <span className="font-bold text-xs">{idx + 1}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold font-bengali text-sm leading-tight truncate ${isActive ? 'text-white' : 'text-white/80'}`}>
                            {v.title}
                          </p>
                        </div>
                        {isActive && <CheckCircle2 size={16} className="text-white shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 lg:p-10 shadow-2xl space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 font-bengali">
                <Info size={20} className="text-emerald-400" /> বিস্তারিত বিবরণ
              </h3>
              <div className="text-white/70 leading-relaxed font-bengali whitespace-pre-wrap text-lg">
                {content.details || "কোনো বিবরণ দেওয়া হয়নি।"}
              </div>
            </div>
          </div>

          {/* Right Side: Action (4 Columns) */}
          <div className="lg:col-span-4 space-y-6">

            {/* Enroll / Call to Action */}
            <div className="sticky top-32 space-y-6">
              <div className="bg-gradient-to-br from-emerald-500/20 to-transparent border border-emerald-500/20 rounded-3xl p-8 text-center space-y-6 shadow-2xl backdrop-blur-xl">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 text-white">
                  <Zap size={30} fill="currentColor" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-xl mb-2 font-bengali">কোর্সে যুক্ত হতে চান?</h4>
                  <p className="text-white/40 text-sm">নিচের বাটনে ক্লিক করে দ্রুত এনরোলমেন্ট সম্পন্ন করুন।</p>
                </div>

                <Link href={
                  content.enrollUrl && !content.enrollUrl.includes('enroll')
                    ? content.enrollUrl
                    : `/enroll?type=service&course=${encodeURIComponent(content.videoTitle || content.title)}`
                }>
                  <button className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-500/10 active:scale-95 transition-all flex items-center justify-center gap-3">
                    <Zap size={18} fill="currentColor" />
                    {content.enrollText || "Enroll Now"}
                  </button>
                </Link>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Info size={20} />
                </div>
                <p className="text-white/60 text-xs font-medium font-bengali">যেকোনো সমস্যার জন্য সরাসরি আমাদের হেল্পলাইনে যোগাযোগ করুন।</p>
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
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
