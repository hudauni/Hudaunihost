"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Lock, Play, CheckCircle2, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import YouTubePlayer from '@/components/YouTubePlayer';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const taskId = params.taskId as string;

  const [taskData, setTaskData] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Ref to track last saved time to avoid frequent DB writes
  const lastSavedTimeRef = useRef(0);

  const fetchVideosAndProgress = useCallback(async () => {
    if (!user || !taskId) return;
    try {
      // 1. Fetch Task Info
      const taskDoc = await getDoc(doc(db, "membershipTasks", taskId));
      if (taskDoc.exists()) {
        setTaskData(taskDoc.data());
      }

      // 2. Fetch videos for this task
      const vQuery = query(
        collection(db, "membershipVideos"),
        where("taskId", "==", taskId)
      );
      const vSnap = await getDocs(vQuery);

      const vData = vSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

      setVideos(vData);

      // 3. Fetch user progress
      const pRef = doc(db, "userProgress", user.uid);
      const pSnap = await getDoc(pRef);
      if (pSnap.exists()) {
        const data = pSnap.data();
        setUserProgress(data.videos?.[taskId] || {});
      } else {
        setUserProgress({});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [taskId, user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchVideosAndProgress();
    }
  }, [user, authLoading, router, fetchVideosAndProgress]);

  const handleVideoProgress = async (seconds: number) => {
    if (!user) return;
    const activeVideo = videos[activeVideoIndex];
    if (!activeVideo) return;

    const currentSeconds = Math.floor(seconds);

    // Only save to DB every 10 seconds to improve performance
    if (currentSeconds - lastSavedTimeRef.current >= 10) {
      lastSavedTimeRef.current = currentSeconds;

      const pRef = doc(db, "userProgress", user.uid);
      await setDoc(pRef, {
        videos: {
          [taskId]: {
            [activeVideo.youtubeId]: {
              watchedSeconds: currentSeconds,
              completed: userProgress[activeVideo.youtubeId]?.completed || false
            }
          }
        }
      }, { merge: true });
    }
  };

  const handleVideoComplete = async () => {
    if (!user) return;
    const activeVideo = videos[activeVideoIndex];
    if (!activeVideo) return;

    const pRef = doc(db, "userProgress", user.uid);

    await setDoc(pRef, {
      videos: {
        [taskId]: {
          [activeVideo.youtubeId]: {
            completed: true,
            watchedSeconds: 0 // Reset for next watch
          }
        }
      }
    }, { merge: true });

    const updatedProgress = { ...userProgress, [activeVideo.youtubeId]: { completed: true } };
    setUserProgress(updatedProgress);

    if (activeVideoIndex < videos.length - 1) {
      setActiveVideoIndex(activeVideoIndex + 1);
      lastSavedTimeRef.current = 0;
    }

    const allDone = videos.every(v => updatedProgress[v.youtubeId]?.completed);

    if (allDone) {
      await setDoc(pRef, {
        associate: {
          [taskId]: { completed: true }
        }
      }, { merge: true });
    }
  };

  const isVideoUnlocked = (index: number) => {
    if (index === 0) return true;
    const prevVideo = videos[index - 1];
    return userProgress?.[prevVideo.youtubeId]?.completed === true;
  };

  if (authLoading || (user && loading)) {
    return (
      <div className="min-h-screen bg-[#001a1a] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  const activeVideo = videos[activeVideoIndex];

  return (
    <div className="min-h-screen w-full bg-[#001a1a] flex flex-col font-sans">
      <Navbar showHome={true} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 lg:pt-[100px]">
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/membership/associate" className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all shadow-lg">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-white font-bengali">{taskData?.title || taskId}</h2>
            <p className="text-emerald-500/60 text-sm font-medium uppercase tracking-wider">Level: Associate • Task {taskId}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            {activeVideo ? (
              <>
                <YouTubePlayer
                  key={activeVideo.youtubeId}
                  videoId={activeVideo.youtubeId}
                  startSeconds={userProgress?.[activeVideo.youtubeId]?.watchedSeconds || 0}
                  onProgress={handleVideoProgress}
                  onComplete={handleVideoComplete}
                />
                <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                  <h3 className="text-2xl font-bold text-white mb-4 font-bengali">{activeVideo.title}</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                           style={{ width: `${userProgress?.[activeVideo.youtubeId]?.completed ? 100 : 0}%` }}></div>
                    </div>
                    <div className="flex items-center gap-2">
                      {userProgress?.[activeVideo.youtubeId]?.completed ? (
                        <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1">
                          <CheckCircle2 size={12} /> Complete
                        </span>
                      ) : (
                        <span className="bg-white/5 text-white/40 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                          Watching
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="aspect-video bg-white/5 rounded-[2rem] flex items-center justify-center border-2 border-dashed border-white/10">
                <p className="text-white/20 font-bengali">এই টাস্কে কোনো ভিডিও পাওয়া যায়নি।</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white/40 text-xs font-bold uppercase tracking-[0.2em] pl-4 border-l-2 border-emerald-500">Video Playlist</h4>
              <span className="text-[10px] text-emerald-500/60 font-bold">{videos.length} Videos</span>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {videos.map((video, index) => {
                const unlocked = isVideoUnlocked(index);
                const completed = userProgress?.[video.youtubeId]?.completed;
                const active = activeVideoIndex === index;

                return (
                  <button
                    key={video.id}
                    disabled={!unlocked}
                    onClick={() => setActiveVideoIndex(index)}
                    className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 text-left group relative overflow-hidden
                      ${active ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'}
                      ${!unlocked ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:border-white/10'}
                    `}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all
                      ${completed ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                        unlocked ? 'bg-white/5 border-white/10 text-white/60' : 'bg-black/20 border-white/5 text-white/20'}
                    `}>
                      {completed ? <CheckCircle2 size={20} /> : !unlocked ? <Lock size={18} /> : <Play size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-emerald-400' : 'text-white/20'}`}>Video {index + 1}</p>
                        {completed && <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-tighter">Done</span>}
                      </div>
                      <h5 className={`text-sm font-bold truncate font-bengali ${unlocked ? 'text-white' : 'text-white/40'}`}>{video.title}</h5>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
}
