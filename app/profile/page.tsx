"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, User, Mail, Hash, Award, LogOut, Loader2, CheckCircle2, History } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, userData, logout, loading: authLoading } = useAuth();
  const [totalVideosInLevel, setTotalVideosInLevel] = useState(0);
  const [completedVideosCount, setCompletedVideosCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    async function fetchUserStats() {
      if (!user || !userData) return;

      try {
        // 1. Fetch total videos available for user's current level (role)
        const vQuery = query(
          collection(db, "membershipVideos"),
          where("levelId", "==", userData.role)
        );
        const vSnap = await getDocs(vQuery);
        const allLevelVideos = vSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTotalVideosInLevel(allLevelVideos.length);

        // 2. Fetch user's specific progress data
        const pRef = doc(db, "userProgress", user.uid);
        const pSnap = await getDoc(pRef);

        if (pSnap.exists()) {
          const pData = pSnap.data();
          const userVideosProgress = pData.videos || {};

          // 3. Count how many of the level's videos are completed by this user
          let completedCount = 0;
          allLevelVideos.forEach((video: any) => {
            const taskProgress = userVideosProgress[video.taskId as string];
            if (taskProgress && taskProgress[video.youtubeId]?.completed === true) {
              completedCount++;
            }
          });
          setCompletedVideosCount(completedCount);
        } else {
          setCompletedVideosCount(0);
        }

      } catch (e) {
        console.error("Profile stats fetch error:", e);
      } finally {
        setLoading(false);
      }
    }

    if (user && userData) {
      fetchUserStats();
    }
  }, [user, userData, authLoading, router]);

  if (authLoading || (user && loading)) {
    return (
      <div className="min-h-screen bg-[#001a1a] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  // Calculate percentage based on individual videos
  const progressPercentage = totalVideosInLevel > 0
    ? Math.round((completedVideosCount / totalVideosInLevel) * 100)
    : 0;

  return (
    <div className="min-h-screen w-full bg-[#001a1a] flex flex-col font-sans overflow-x-hidden">
      <Navbar showHome={true} />

      <main className="relative flex-1 w-full flex flex-col items-center">
        {/* --- MOBILE VERSION --- */}
        <div
          className="lg:hidden w-full min-h-screen flex flex-col items-center bg-no-repeat pt-0 pb-10"
          style={{
            backgroundImage: "url('/images/mainimg.webp')",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
          }}
        >
          {/* Top Bar with Back and White Logout Icon */}
          <div className="w-full flex justify-between items-center px-6 pt-4 relative z-50">
            <Link href="/" className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white shadow-lg active:scale-90 transition-all">
              <ChevronLeft size={18} />
            </Link>
            <button
              onClick={() => logout()}
              className="p-2.5 bg-white rounded-full text-red-600 shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_-2px_4px_rgba(0,0,0,0.1)] active:scale-90 active:translate-y-1 transition-all border border-white/20"
            >
              <LogOut size={18} />
            </button>
          </div>

          <div className="w-full flex flex-col items-center mt-5">
            {/* User Avatar */}
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-full border-4 border-[#d4af37] p-1 shadow-[0_10px_25px_rgba(0,0,0,0.5)] bg-black/20">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-inner">
                    <User size={35} />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-[#d4af37] to-[#f9d71c] p-1 rounded-full shadow-md">
                <CheckCircle2 size={14} className="text-[#1a472a]" />
              </div>
            </div>

            {/* Profile Title */}
            <h2 className="text-white font-bold font-bengali text-lg mb-6 drop-shadow-lg">প্রোফাইল</h2>

            {/* Info Cards - Fixed Width 245px, reduced radius, 3D Vibe */}
            <div className="flex flex-col items-center space-y-3">
              <div className="w-[245px] p-2.5 bg-black/40 backdrop-blur-xl border-t border-white/20 border-l border-white/10 rounded-lg flex items-center gap-3 shadow-[0_8px_16px_rgba(0,0,0,0.4),inset_0_-2px_4px_rgba(0,0,0,0.2)]">
                <div className="p-1.5 bg-white/5 rounded-md text-emerald-400 shadow-inner"><User size={14} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest">Name</p>
                  <p className="text-white font-bold text-[11px] truncate">{userData?.displayName}</p>
                </div>
              </div>

              <div className="w-[245px] p-2.5 bg-black/40 backdrop-blur-xl border-t border-white/20 border-l border-white/10 rounded-lg flex items-center gap-3 shadow-[0_8px_16px_rgba(0,0,0,0.4),inset_0_-2px_4px_rgba(0,0,0,0.2)]">
                <div className="p-1.5 bg-white/5 rounded-md text-emerald-400 shadow-inner"><Mail size={14} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest">Email</p>
                  <p className="text-white font-medium text-[9px] truncate">{user?.email}</p>
                </div>
              </div>

              <div className="w-[245px] p-2.5 bg-black/40 backdrop-blur-xl border-t border-white/20 border-l border-white/10 rounded-lg flex items-center gap-3 shadow-[0_8px_16px_rgba(0,0,0,0.4),inset_0_-2px_4px_rgba(0,0,0,0.2)]">
                <div className="p-1.5 bg-white/5 rounded-md text-[#d4af37] shadow-inner"><Hash size={14} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest">Associate ID</p>
                  <p className="text-white font-black text-xs tracking-widest">{userData?.associateId}</p>
                </div>
              </div>

              {/* Progress Card - Based on individual videos */}
              <div className="w-[245px] p-4 bg-gradient-to-br from-[#1a472a]/60 to-[#001a1a]/60 backdrop-blur-xl border-t border-white/20 border-l border-white/10 rounded-lg relative overflow-hidden shadow-[0_15px_30px_rgba(0,0,0,0.5),inset_0_-2px_6px_rgba(0,0,0,0.3)]">
                <div className="relative z-10">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <p className="text-white/40 text-[7px] uppercase font-bold tracking-widest">Level</p>
                      <p className="text-emerald-400 font-black text-base uppercase italic tracking-tighter">{userData?.role}</p>
                    </div>
                    <p className="text-emerald-400 font-bold text-xs">{progressPercentage}%</p>
                  </div>
                  <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-white/60 text-[10px] mt-2 text-right italic font-bold">
                    {completedVideosCount} / {totalVideosInLevel} Videos Completed
                  </p>
                </div>
              </div>

              {/* Sadaka History Button */}
              <Link href="/profile/sadaka-history" className="w-[245px]">
                <button className="w-full py-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-lg active:translate-y-1">
                  <History size={18} />
                  <span className="text-xs uppercase tracking-widest font-black font-bengali">সাদকা হিস্টোরি</span>
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* --- DESKTOP VERSION --- */}
        <div
          className="hidden lg:flex w-full min-h-[calc(100vh-73px)] relative items-center justify-center p-20 bg-no-repeat bg-cover bg-center"
          style={{ backgroundImage: "url('/images/mainimg.webp')" }}
        >
          <div className="absolute inset-0 bg-[#001a1a]/80 backdrop-blur-sm"></div>

          <div className="relative z-10 w-full max-w-5xl bg-white/[0.03] border-t border-white/20 border-l border-white/10 backdrop-blur-3xl rounded-[1.5rem] p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] flex gap-12">

            <div className="w-1/3 flex flex-col items-center space-y-8 border-r border-white/5 pr-12">
              <div className="w-40 h-40 rounded-full border-8 border-[#d4af37] p-2 shadow-2xl shadow-yellow-900/20 transition-transform hover:scale-105 duration-500">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-emerald-500 flex items-center justify-center text-white text-6xl font-bold shadow-inner">
                    {userData?.displayName?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="text-center">
                <h2 className="text-3xl font-black text-white italic mb-1 drop-shadow-md">{userData?.displayName}</h2>
                <p className="text-emerald-400/60 font-medium">{user?.email}</p>
              </div>
              <button
                onClick={() => logout()}
                className="w-full py-4 bg-white text-black rounded-xl font-bold transition-all flex items-center justify-center gap-3
                           shadow-[0_8px_0_#cbd5e1] hover:shadow-[0_4px_0_#cbd5e1] hover:translate-y-[4px]
                           active:shadow-none active:translate-y-[8px]"
              >
                <LogOut size={20} />
                Logout Account
              </button>
            </div>

            <div className="flex-1 space-y-8 pt-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-white/[0.03] border-t border-white/10 border-l border-white/5 rounded-xl shadow-xl hover:bg-white/[0.05] transition-colors group">
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Hash size={14} className="text-[#d4af37]" /> Associate ID
                  </p>
                  <p className="text-white font-black text-3xl tracking-[0.2em] drop-shadow-lg group-hover:text-emerald-400 transition-colors">{userData?.associateId}</p>
                </div>
                <div className="p-6 bg-white/[0.03] border-t border-white/10 border-l border-white/5 rounded-xl shadow-xl hover:bg-white/[0.05] transition-colors group">
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Award size={14} className="text-emerald-400" /> Current Rank
                  </p>
                  <p className="text-emerald-400 font-black text-3xl italic uppercase tracking-tighter drop-shadow-lg">{userData?.role}</p>
                </div>
              </div>

              <div className="p-8 bg-emerald-500/5 border-t border-white/10 border-l border-white/5 rounded-xl relative overflow-hidden shadow-2xl">
                <div className="relative z-10">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <h4 className="text-white font-bold text-2xl font-bengali">লেভেল প্রগ্রেস</h4>
                    </div>
                    <p className="text-emerald-400 font-black text-4xl drop-shadow-lg">{progressPercentage}%</p>
                  </div>
                  <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-300 transition-all duration-1000 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-white/60 text-sm mt-4 text-right italic font-bold">
                    Total {completedVideosCount} out of {totalVideosInLevel} videos watched.
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <Link href="/profile/sadaka-history">
                  <button className="px-8 py-4 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold transition-all flex items-center gap-3 shadow-xl">
                    <History size={20} />
                    <span className="font-bengali">সাদকা হিস্টোরি</span>
                  </button>
                </Link>
                <Link href="/" className="text-emerald-400 hover:text-emerald-300 flex items-center gap-2 transition-all hover:-translate-x-1 drop-shadow-md">
                  <ChevronLeft size={20} />
                  <span className="font-bold font-bengali text-lg tracking-tight">হোমে ফিরে যান</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
