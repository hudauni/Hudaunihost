"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { ArrowLeft, Loader2, ChevronRight, BookOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function ExploreContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [category, setCategory] = useState<any>(null);
  const [buttons, setButtons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const cDoc = await getDoc(doc(db, "homeMenu", id));
      if (cDoc.exists()) setCategory(cDoc.data());

      const q = query(
        collection(db, "exploreMenu"),
        where("parentId", "==", id)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      list.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeA - timeB;
      });

      setButtons(list);
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

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 pt-6 lg:pt-28 pb-12">
        <div className="flex items-center justify-between gap-4 mb-8 border-b border-white/5 pb-4">
          <div className="relative">
            <h1 className="text-2xl lg:text-3xl font-black text-white italic tracking-tighter drop-shadow-lg uppercase">
              {category?.title}
            </h1>
            <div className="absolute -bottom-2 left-0 h-1 w-12 bg-emerald-500 rounded-full"></div>
          </div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-all font-bold uppercase tracking-widest text-[10px] bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/10 shadow-lg"
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {buttons.length === 0 ? (
            <div className="py-20 text-center text-white/20 font-bold uppercase tracking-widest text-xs">
              No items found in this category.
            </div>
          ) : (
            buttons.map((btn) => (
              <Link key={btn.id} href={`/explore/content/?id=${btn.id}`}>
                <div className="group relative w-full py-3.5 px-6 bg-white/[0.03] backdrop-blur-3xl rounded-xl flex items-center justify-between transition-all duration-300 border border-white/10 shadow-xl hover:bg-emerald-500/[0.08] hover:border-emerald-500/30 hover:translate-x-1">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <BookOpen size={16} />
                    </div>
                    <span className="text-white text-lg font-bold tracking-wide group-hover:text-emerald-400 transition-colors font-bengali">
                      {btn.title}
                    </span>
                  </div>
                  <ChevronRight size={18} className="text-white/10 group-hover:text-emerald-400 transition-all" />
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#001a1a] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>}>
      <ExploreContent />
    </Suspense>
  );
}
