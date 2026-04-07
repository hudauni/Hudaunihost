"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Lock, CheckCircle2, Play, Loader2, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LevelSyllabusPage() {
  const params = useParams();
  const router = useRouter();
  const levelId = params.levelId as string;
  const { user, loading: authLoading } = useAuth();

  const [levelData, setLevelData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [prevTaskTitle, setPrevTaskTitle] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    async function fetchData() {
      if (!user || !levelId) return;
      try {
        // 1. Fetch Level Title
        const levelDoc = await getDoc(doc(db, "membershipLevels", levelId));
        if (levelDoc.exists()) {
          setLevelData(levelDoc.data());
        }

        // 2. Fetch Tasks for this level (Removed orderBy to avoid Index requirement)
        const q = query(
          collection(db, "membershipTasks"),
          where("levelId", "==", levelId)
        );
        const snap = await getDocs(q);

        // Sort tasks in-memory
        const tasksData = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

        setTasks(tasksData);

        // 3. Fetch User Progress for this level
        const docRef = doc(db, "userProgress", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProgress(docSnap.data()[levelId] || {});
        }
      } catch (e) {
        console.error("Error fetching level data:", e);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchData();
    }
  }, [user, authLoading, router, levelId]);

  const isUnlocked = (index: number) => {
    if (tasks.length === 0) return false;
    const task = tasks[index];
    if (index === 0) return true;

    // Special rule for associate level (e.g., last 3 tasks always unlocked)
    if (levelId === 'associate' && task.order >= 8) return true;

    const prevTaskId = tasks[index - 1].id;
    return progress[prevTaskId]?.completed === true;
  };

  const handleTaskClick = (task: any, index: number) => {
    const unlocked = isUnlocked(index);
    if (!unlocked) {
      setPrevTaskTitle(tasks[index - 1]?.title || "পূর্ববর্তী টাস্ক");
      setShowLockedModal(true);
      return;
    }

    if (levelId === 'associate' && task.title === "নিয়মিত সদকা করা") {
      router.push('/sadaka');
    } else {
      router.push(`/membership/${levelId}/${task.id}`);
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
    <div className="min-h-screen w-full bg-[#001a1a] flex flex-col font-sans overflow-x-hidden">
      <Navbar showHome={true} />

      <main className="relative flex-1 w-full flex flex-col items-center">
        {/* --- MOBILE VERSION --- */}
        <div
          className="lg:hidden w-full min-h-screen flex flex-col items-center bg-no-repeat pt-0 pb-10 overflow-hidden"
          style={{
            backgroundImage: "url('/images/bgimg.webp')",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
          }}
        >
          <div className="w-full flex justify-start px-6 pt-4 relative z-50">
            <Link href="/membership" className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white shadow-lg active:scale-90 transition-transform">
              <ChevronLeft size={18} />
            </Link>
          </div>

          <h2 className="text-[#8b5cf6] text-lg font-bold mb-6 drop-shadow-sm font-bengali text-center px-10 -mt-[70px] relative z-10 text-lg">
            {levelData?.title || levelId} থেকে মেম্বার হওয়ার সিলেবাস
          </h2>

          <div className="flex-1 w-full overflow-y-auto custom-scrollbar px-6 flex flex-col items-center space-y-3.5 mt-8">
            {tasks.map((task, index) => {
              const unlocked = isUnlocked(index);
              const completed = progress[task.id]?.completed;
              const isSpecialTask = levelId === 'associate' && task.order >= 8;

              return (
                <button
                  key={task.id}
                  onClick={() => handleTaskClick(task, index)}
                  className={`w-[285px] py-3 px-5 rounded-full border transition-all flex items-center justify-between group relative overflow-hidden
                    bg-gradient-to-br from-[#1a472a]/70 to-[#001a1a]/90 backdrop-blur-xl border-t border-white/30 border-l border-white/20 shadow-[0_8px_15px_rgba(0,0,0,0.5),inset_0_-2px_4px_rgba(0,0,0,0.3)]
                    ${unlocked ? 'active:scale-95 active:translate-y-1' : 'opacity-60 grayscale cursor-default'}
                  `}
                >
                  <span className={`text-[14px] font-bold font-bengali flex-1 text-center ml-6 tracking-wide drop-shadow-md ${unlocked ? 'text-white' : 'text-white/40'}`}>
                    {task.title}
                  </span>

                  <div className="flex items-center space-x-2">
                    {completed ? (
                      <CheckCircle2 size={18} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    ) : !unlocked ? (
                      <Lock size={16} className="text-red-500/80 drop-shadow-[0_0_5px_rgba(239,68,68,0.3)]" />
                    ) : !isSpecialTask ? (
                      <Play size={16} className="text-emerald-400/80 group-hover:text-emerald-400 transition-colors" />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* --- DESKTOP VERSION --- */}
        <div className="hidden lg:flex w-full min-h-[calc(100vh-73px)] relative bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#011a1a] pt-20 pb-20 overflow-y-auto custom-scrollbar">
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>

          <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center px-10">
            <Link href="/membership" className="self-start text-emerald-400 hover:text-emerald-300 flex items-center space-x-2 mb-10 transition-all">
              <ChevronLeft size={20} />
              <span className="font-medium font-bengali text-lg">মেম্বারশিপ লেভেলে ফিরে যান</span>
            </Link>

            <h2 className="text-5xl font-black text-white mb-12 tracking-tight font-bengali text-center">
              {levelData?.title || levelId} থেকে মেম্বার হওয়ার সিলেবাস
            </h2>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map((task, index) => {
                const unlocked = isUnlocked(index);
                const completed = progress[task.id]?.completed;
                const isSpecialTask = levelId === 'associate' && task.order >= 8;

                return (
                  <button
                    key={task.id}
                    onClick={() => handleTaskClick(task, index)}
                    className={`p-5 rounded-2xl border transition-all flex items-center justify-between text-left group
                      bg-gradient-to-br from-white/[0.08] to-transparent backdrop-blur-3xl border-t border-white/30 border-l border-white/20 shadow-[0_15px_35px_rgba(0,0,0,0.4),inset_0_-2px_6px_rgba(0,0,0,0.2)]
                      ${unlocked ? 'hover:border-emerald-500/30 hover:-translate-y-1' : 'opacity-50 grayscale cursor-default'}
                    `}
                  >
                    <h3 className={`font-bold font-bengali text-xl drop-shadow-lg ${unlocked ? 'text-white' : 'text-gray-500'}`}>
                      {task.title}
                    </h3>

                    <div className="flex flex-col items-end">
                      {completed ? (
                        <div className="bg-emerald-500/20 p-2 rounded-full shadow-inner"><CheckCircle2 size={24} className="text-emerald-400" /></div>
                      ) : !unlocked ? (
                        <div className="bg-white/5 p-2 rounded-full"><Lock size={24} className="text-red-500/60" /></div>
                      ) : !isSpecialTask ? (
                        <div className="bg-emerald-500/10 p-2 rounded-full group-hover:bg-emerald-500/20 transition-all shadow-md"><Play size={24} className="text-emerald-400" /></div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* --- LOCKED TASK MODAL --- */}
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
                <h3 className="text-2xl font-black text-white font-bengali">টাস্কটি এখনো লক করা!</h3>
                <p className="text-white/60 font-bengali leading-relaxed text-sm">
                  দুঃখিত! এই টাস্কটি শুরু করতে হলে আপনাকে প্রথমে <span className="text-emerald-400 font-bold underline underline-offset-4">{prevTaskTitle}</span> টাস্কটির সকল ভিডিও দেখা সম্পন্ন করতে হবে।
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

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
}
