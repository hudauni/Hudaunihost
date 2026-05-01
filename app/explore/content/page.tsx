"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import YouTubePlayer from '@/components/YouTubePlayer';
import { ArrowLeft, Loader2, Zap, Info, Play, X, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

function ExploreContentInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [parentInfo, setParentInfo] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedDescription, setSelectedDescription] = useState<{title: string, details: string} | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const pDoc = await getDoc(doc(db, "exploreMenu", id));
      if (pDoc.exists()) setParentInfo(pDoc.data());

      const q = query(collection(db, "exploreMenu", id, "services"), orderBy("createdAt", "asc"));
      const snap = await getDocs(q);
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && id) fetchData();
  }, [user, authLoading, fetchData, router, id]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#001a1a] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#001a1a] flex flex-col font-sans">
      <Navbar showHome={true} />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 pt-4 lg:pt-24 pb-20">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/40 hover:text-emerald-400 transition-colors font-bold mb-6 uppercase tracking-widest text-[10px]"
        >
          <ArrowLeft size={14} /> ফিরে যান
        </button>

        <div className="space-y-2 mb-8">
          <h1 className="text-2xl lg:text-3xl font-black text-white font-bengali leading-tight drop-shadow-lg">
            {parentInfo?.title || "সার্ভিস সমূহ"}
          </h1>
          <div className="h-1 w-16 bg-emerald-500 rounded-full"></div>
        </div>

        <div className="space-y-8">
          {services.map((card: any, idx: number) => (
            <div
              key={card.id}
              className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Video Player Section - Reduced Aspect Ratio if needed, but video needs 16:9 */}
              <div className="w-full aspect-video bg-black shadow-lg">
                <YouTubePlayer videoId={card.youtubeId} key={card.youtubeId} />
              </div>

              {/* Content Body Section - Compact Padding */}
              <div className="p-5 lg:p-6 space-y-4">
                <div className="flex justify-between items-center gap-4">
                  <div className="space-y-0.5">
                    <p className="text-emerald-500 font-black uppercase tracking-[0.2em] text-[9px]">Module #{idx + 1}</p>
                    <h2 className="text-xl lg:text-2xl font-bold text-white font-bengali leading-tight">
                      {card.title}
                    </h2>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  {/* Description Button */}
                  <button
                    onClick={() => setSelectedDescription({title: card.title, details: card.details})}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] border border-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <FileText size={16} className="text-emerald-400" />
                    বিবরণ
                  </button>

                  {/* Enroll Button */}
                  <Link href={`/enroll/?type=service&course=${encodeURIComponent(card.title)}`} className="flex-[2]">
                    <button className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-emerald-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                      <Zap size={16} fill="currentColor" />
                      ENROLL NOW
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {services.length === 0 && (
            <div className="py-20 text-center">
               <p className="text-white/20 font-bold uppercase tracking-widest text-[10px]">No contents added yet.</p>
            </div>
          )}
        </div>
      </main>

      {/* --- FULLSCREEN DESCRIPTION MODAL --- */}
      {selectedDescription && (
        <div className="fixed inset-0 z-[100] bg-[#001a1a] animate-in slide-in-from-bottom duration-300 flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#002b2b]">
            <h3 className="text-white font-bold font-bengali truncate mr-4">{selectedDescription.title}</h3>
            <button
              onClick={() => setSelectedDescription(null)}
              className="p-2 bg-white/5 rounded-full text-white/60 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="flex items-center gap-3 text-emerald-400 font-black uppercase tracking-[0.3em] text-xs">
                <Info size={18} /> বিস্তারিত বর্ণনা
              </div>
              <div className="text-white/80 leading-relaxed font-bengali text-lg whitespace-pre-wrap pb-20">
                {selectedDescription.details || "কোনো বিবরণ দেওয়া হয়নি।"}
              </div>
            </div>
          </div>
          <div className="p-6 bg-[#002b2b] border-t border-white/5">
             <button
               onClick={() => setSelectedDescription(null)}
               className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold uppercase tracking-widest shadow-xl"
             >
               বন্ধ করুন
             </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
}

export default function ExploreContentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#001a1a] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>}>
      <ExploreContentInner />
    </Suspense>
  );
}
