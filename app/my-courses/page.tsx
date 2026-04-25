"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { BookOpen, ChevronRight, PlayCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Course {
  id: string;
  title: string;
  classesCount: number;
}

export default function MyCoursesPage() {
  const { user, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchMyCourses();
    }
  }, [user, authLoading]);

  async function fetchMyCourses() {
    try {
      const q = query(collection(db, "userPaidCourses"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);

      const coursePromises = snapshot.docs.map(async (d) => {
        const courseId = d.data().courseId;
        const courseDoc = await getDoc(doc(db, "paidCourses", courseId));
        if (courseDoc.exists()) {
          const data = courseDoc.data();
          return {
            id: courseDoc.id,
            title: data.title,
            classesCount: data.classes?.length || 0
          };
        }
        return null;
      });

      const results = await Promise.all(coursePromises);
      setCourses(results.filter(c => c !== null) as Course[]);
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

  return (
    <div className="min-h-screen bg-[#001a1a] flex flex-col font-sans">
      <Navbar showHome={true} />

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 pt-6 lg:pt-28 pb-12">
        {/* Compact Header at the Top */}
        <div className="flex items-center justify-between gap-4 mb-8 border-b border-white/5 pb-4">
          <div className="relative">
            <h1 className="text-2xl lg:text-3xl font-black text-white italic tracking-tighter drop-shadow-lg">
              MY <span className="text-emerald-400">COURSES</span>
            </h1>
            <div className="absolute -bottom-2 left-0 h-1 w-12 bg-emerald-500 rounded-full"></div>
          </div>
          <Link href="/profile">
            <button className="flex items-center gap-2 text-white/50 hover:text-white transition-all font-bold uppercase tracking-widest text-[10px] bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/10 shadow-lg">
              <ArrowLeft size={14} /> Back to Profile
            </button>
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-20 text-center flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/20">
              <BookOpen size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">আপনি এখনও কোনো কোর্সে এনরোল করেননি</h2>
              <p className="text-white/40 max-w-sm text-sm">আপনার পছন্দের কোর্সে এনরোল করতে এডমিনের সাথে যোগাযোগ করুন।</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {courses.map((course) => (
              <Link key={course.id} href={`/my-courses/${course.id}`}>
                <div className="group relative bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-xl p-5 hover:bg-emerald-500/[0.08] hover:border-emerald-500/30 transition-all duration-500 overflow-hidden shadow-xl">
                  {/* Smaller Background Icon */}
                  <div className="absolute top-0 right-0 p-4 text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors">
                    <PlayCircle size={80} />
                  </div>

                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400 shadow-inner">
                        <BookOpen size={16} />
                      </div>
                      <span className="text-emerald-400/60 font-black text-[9px] uppercase tracking-widest">Premium Access</span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-xl font-bold text-white font-bengali group-hover:text-emerald-400 transition-colors truncate pr-8">
                        {course.title}
                      </h3>
                      <p className="text-white/30 text-[11px] mt-0.5 font-bold uppercase tracking-wider">
                        {course.classesCount} Classes Available
                      </p>
                    </div>

                    <div className="pt-2 flex items-center text-emerald-400 font-bold text-xs gap-1 group-hover:gap-2 transition-all">
                      <span>ক্লাস শুরু করুন</span>
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
