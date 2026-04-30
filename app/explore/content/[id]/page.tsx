"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import YouTubePlayer from '@/components/YouTubePlayer';
import { ArrowLeft, Loader2, Zap, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function ExploreContentPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-[#001a1a] flex flex-col font-sans">
      <Navbar showHome={true} />

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 pt-6 lg:pt-28 pb-20">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/40 hover:text-emerald-400 transition-colors font-bold mb-8 uppercase tracking-widest text-xs"
        >
          <ArrowLeft size={16} /> ফিরে যান
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Side: Video & Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl lg:text-4xl font-black text-white font-bengali leading-tight drop-shadow-lg">
                {content.videoTitle || content.title}
              </h1>
              <div className="h-1 w-20 bg-emerald-500 rounded-full"></div>
            </div>

            {content.youtubeId ? (
              <div className="shadow-2xl shadow-black/50">
                <YouTubePlayer videoId={content.youtubeId} />
              </div>
            ) : (
              <div className="aspect-video bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 text-white/20 font-bold italic">
                No Video Available
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

          {/* Right Side: Enroll/Action Button */}
          <div className="lg:col-span-1">
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
    </div>
  );
}
