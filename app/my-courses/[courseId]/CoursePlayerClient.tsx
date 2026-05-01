"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import YouTubePlayer from '@/components/YouTubePlayer';
import { Play, List, ChevronLeft, Loader2, Lock, CheckCircle2 } from 'lucide-react';

interface ClassItem {
  title: string;
  youtubeId: string;
}

interface Course {
  id: string;
  title: string;
  classes: ClassItem[];
}

export default function CoursePlayerClient() {
  const { user, loading: authLoading } = useAuth();
  const { courseId } = useParams();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [activeClassIndex, setActiveClassIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && courseId) {
      checkAccessAndFetchCourse();
    }
  }, [user, authLoading, courseId]);

  async function checkAccessAndFetchCourse() {
    try {
      // 1. Check access
      const accessQuery = query(
        collection(db, "userPaidCourses"),
        where("userId", "==", user.uid),
        where("courseId", "==", courseId)
      );
      const accessSnap = await getDocs(accessQuery);

      if (accessSnap.empty) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setHasAccess(true);

      // 2. Fetch course data
      const courseDoc = await getDoc(doc(db, "paidCourses", courseId as string));
      if (courseDoc.exists()) {
        setCourse({ id: courseDoc.id, ...courseDoc.data() } as Course);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#001a1a] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#001a1a] flex flex-col items-center justify-center p-10 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6">
          <Lock size={40} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">আপনার এই কোর্সে এক্সেস নেই</h1>
        <p className="text-white/40 mb-8 max-w-md">দয়া করে এডমিনের সাথে যোগাযোগ করুন অথবা পেমেন্ট ভেরিফাই করুন।</p>
        <button
          onClick={() => router.push('/my-courses')}
          className="bg-white text-black px-8 py-3 rounded-full font-bold"
        >
          ফিরে যান
        </button>
      </div>
    );
  }

  if (!course) return null;

  const activeClass = course.classes[activeClassIndex];

  return (
    <div className="min-h-screen bg-[#001a1a] flex flex-col font-sans">
      <Navbar showHome={true} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-10 py-24 lg:py-32 flex flex-col lg:flex-row gap-8">

        {/* Left Side: Video Player */}
        <div className="flex-[2] space-y-6">
          <button
            onClick={() => router.push('/my-courses')}
            className="flex items-center gap-2 text-white/40 hover:text-emerald-400 transition-colors font-bold mb-4"
          >
            <ChevronLeft size={20} /> ফিরে যান
          </button>

          <YouTubePlayer
            videoId={activeClass.youtubeId}
            onComplete={() => {
              if (activeClassIndex < course.classes.length - 1) {
                // Optionally auto-play next video
              }
            }}
          />

          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h1 className="text-3xl font-black text-white font-bengali mb-2">{activeClass.title}</h1>
            <p className="text-emerald-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              {course.title} • Class {activeClassIndex + 1}
            </p>
          </div>
        </div>

        {/* Right Side: Class List */}
        <div className="flex-1 space-y-6">
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden flex flex-col h-[600px] shadow-2xl">
            <div className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <List size={24} className="text-emerald-400" />
                <span className="font-bengali">ক্লাস লিস্ট</span>
              </h2>
              <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
                {course.classes.length} Classes
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
              {course.classes.map((cls, idx) => {
                const isActive = idx === activeClassIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveClassIndex(idx)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left group ${
                      isActive
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-white/20' : 'bg-black/20 group-hover:bg-emerald-500/20'
                    }`}>
                      {isActive ? <Play size={18} fill="currentColor" /> : <span className="font-bold">{idx + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold font-bengali leading-tight ${isActive ? 'text-white' : 'text-white/80'}`}>
                        {cls.title}
                      </p>
                      <p className={`text-[10px] mt-1 uppercase font-black tracking-widest ${isActive ? 'text-white/60' : 'text-white/20'}`}>
                        YouTube Video
                      </p>
                    </div>
                    {isActive && <CheckCircle2 size={18} className="text-white" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.4);
        }
      `}</style>
    </div>
  );
}
