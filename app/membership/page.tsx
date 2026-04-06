"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Loader2, Lock, CheckCircle2, X, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import GlassButton from '@/components/GlassButton';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

export default function MembershipPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [levels, setLevels] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [userProgress, setUserProgress] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [prevLevelTitle, setPrevLevelTitle] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Fetch all levels
        const levelsSnap = await getDocs(collection(db, "membershipLevels"));
        const levelsData = levelsSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        setLevels(levelsData);

        // 2. Fetch all tasks to check level completion
        const tasksSnap = await getDocs(collection(db, "membershipTasks"));
        setAllTasks(tasksSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // 3. Fetch user progress
        if (user) {
          const pRef = doc(db, "userProgress", user.uid);
          const pSnap = await getDoc(pRef);
          if (pSnap.exists()) {
            setUserProgress(pSnap.data());
          }
        }
      } catch (error) {
        console.error("Error fetching membership data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading]);

  const isLevelFullyCompleted = (levelId: string) => {
    let levelTasks = allTasks.filter(t => t.levelId === levelId);
    if (levelTasks.length === 0) return false;

    // For Associate, only tasks 1-7 are required for progression
    if (levelId === 'associate') {
      levelTasks = levelTasks.filter(t => (t.order || 0) < 8);
    }

    const progress = userProgress[levelId] || {};
    return levelTasks.every(task => progress[task.id]?.completed === true);
  };

  const getLevelStatus = (levelId: string, index: number) => {
    if (index === 0) return { unlocked: true, completed: isLevelFullyCompleted(levelId) };
    const prevLevel = levels[index - 1];
    const prevCompleted = isLevelFullyCompleted(prevLevel.id);
    return {
      unlocked: prevCompleted,
      completed: isLevelFullyCompleted(levelId)
    };
  };

  const handleLevelClick = (level: any, index: number) => {
    const { unlocked } = getLevelStatus(level.id, index);
    if (unlocked) {
      router.push(`/membership/${level.id}`);
    } else {
      setPrevLevelTitle(levels[index - 1]?.title || "পূর্ববর্তী লেভেল");
      setShowLockedModal(true);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#001a1a] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#001a1a] flex flex-col font-sans">
      <Navbar showHome={true} buttonText="Portal" />

      <main className="relative flex-1 w-full flex flex-col items-center">
        {/* --- MOBILE VERSION --- */}
        <div
          className="lg:hidden w-full min-h-screen flex flex-col items-center bg-no-repeat overflow-y-auto pb-10"
          style={{
            backgroundImage: "url('/images/bgimg.webp')",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
          }}
        >
          <div className="w-full flex justify-start p-6">
            <Link href="/" className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white shadow-lg active:scale-90 transition-all">
              <ChevronLeft size={20} />
            </Link>
          </div>

          <div className="w-full max-w-[285px] flex flex-col items-center space-y-3.5 mt-4">
            {levels.map((level, index) => {
              const { unlocked, completed } = getLevelStatus(level.id, index);
              return (
                <div key={level.id} className="w-full relative">
                  <GlassButton
                    title={level.title}
                    variant="membership-mobile"
                    onClick={() => handleLevelClick(level, index)}
                    className={!unlocked ? "opacity-60 grayscale cursor-not-allowed" : ""}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    {completed ? (
                      <CheckCircle2 size={18} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    ) : !unlocked ? (
                      <Lock size={16} className="text-red-500/80" />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- DESKTOP VERSION --- */}
        <div className="hidden lg:flex w-full flex-1 min-h-[calc(100vh-73px)] items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#011a1a]">
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>

          <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold text-white mb-2 font-bengali">মেম্বারশিপ লেভেল</h2>
              <div className="w-20 h-1 bg-emerald-500 mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-2 gap-6 w-full px-10">
              {levels.map((level, index) => {
                const { unlocked, completed } = getLevelStatus(level.id, index);
                return (
                  <div key={level.id} className="relative group w-full">
                    <GlassButton
                      title={level.title}
                      variant="membership-desktop"
                      onClick={() => handleLevelClick(level, index)}
                      className={!unlocked ? "opacity-50 grayscale cursor-not-allowed" : ""}
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none transition-all group-hover:scale-110">
                      {completed ? (
                        <CheckCircle2 size={24} className="text-emerald-400" />
                      ) : !unlocked ? (
                        <Lock size={20} className="text-red-500/60" />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <Link href="/" className="mt-12 text-emerald-400 hover:text-emerald-300 flex items-center space-x-2 transition-colors">
              <ChevronLeft size={18} />
              <span className="font-bengali">হোমে ফিরে যান</span>
            </Link>
          </div>
        </div>

        {/* --- LOCKED LEVEL MODAL --- */}
        {showLockedModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60 animate-in fade-in duration-300">
            <div className="bg-[#002b2b] border border-white/10 w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-emerald-500 to-red-500"></div>

              <button
                onClick={() => setShowLockedModal(false)}
                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/40 transition-all"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 border border-red-500/20 shadow-2xl shadow-red-500/10">
                  <Lock size={40} />
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-white font-bengali">লেভেলটি এখনো লক করা!</h3>
                  <p className="text-white/60 font-bengali leading-relaxed text-sm">
                    দুঃখিত! এই লেভেলটিতে প্রবেশ করতে হলে আপনাকে প্রথমে <span className="text-emerald-400 font-bold underline underline-offset-4">{prevLevelTitle}</span> লেভেলের সকল টাস্ক ও ভিডিও সম্পন্ন করতে হবে।
                  </p>
                </div>

                <button
                  onClick={() => setShowLockedModal(false)}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold font-bengali transition-all shadow-lg active:scale-95 border-t border-white/20"
                >
                  ঠিক আছে
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
