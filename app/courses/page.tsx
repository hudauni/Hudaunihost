"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Play, X, Info, CreditCard, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface Course {
  id: string;
  title: string;
  youtubeId: string;
  price: number;
  details: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const q = query(collection(db, "courses"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Course[];
        setCourses(data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const openDetails = (course: Course) => {
    setSelectedCourse(course);
    setShowModal(true);
  };

  const handleEnroll = (course: Course) => {
    router.push(`/enroll?course=${encodeURIComponent(course.title)}`);
  };

  return (
    <div className="min-h-screen w-full bg-[#001a1a] flex flex-col font-sans overflow-x-hidden">
      <Navbar showHome={true} />

      <main className="relative flex-1 w-full flex flex-col items-center pb-20">

        {/* --- MOBILE VERSION --- */}
        <div
          className="lg:hidden w-full min-h-screen flex flex-col items-center pt-0 pb-10 bg-[#001a1a]"
        >
          <div className="w-full flex justify-start px-6 pt-4">
            <Link href="/" className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white shadow-lg active:scale-95 transition-all">
              <ChevronLeft size={18} />
            </Link>
          </div>

          <h2 className="text-[#8b5cf6] text-2xl font-black mb-8 font-bengali drop-shadow-lg -mt-10">আমাদের কোর্সসমূহ</h2>

          <div className="w-full px-6 space-y-8">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
              </div>
            ) : courses.length > 0 ? (
              courses.map((course) => (
                <div key={course.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                  {/* YouTube Card with Overlay */}
                  <div className="aspect-video relative overflow-hidden group">
                    <img
                      src={`https://img.youtube.com/vi/${course.youtubeId}/mqdefault.jpg`}
                      alt={course.title}
                      className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 bg-emerald-500/20 backdrop-blur-md rounded-full flex items-center justify-center border border-emerald-500/30">
                        <Play size={28} className="text-emerald-400 fill-emerald-400/20 ml-1" />
                      </div>
                    </div>
                    {/* Security Overlay */}
                    <div className="absolute inset-0 z-10 bg-transparent pointer-events-auto"></div>
                  </div>

                  <div className="p-6 flex flex-col">
                    <h3 className="text-white font-bold text-lg mb-2 font-bengali leading-tight">{course.title}</h3>
                    <div className="flex items-center gap-2 mb-6">
                      <span className="text-emerald-400 font-black text-xl">৳{course.price}</span>
                      <span className="text-white/40 text-xs font-medium font-bengali">এককালীন পরিশোধ</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => openDetails(course)}
                        className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold font-bengali text-sm transition-all border border-white/10"
                      >
                        <Info size={16} />
                        বিস্তারিত
                      </button>
                      <button
                        onClick={() => handleEnroll(course.id)}
                        className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold font-bengali text-sm transition-all shadow-lg shadow-emerald-600/20"
                      >
                        ভর্তি হন
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-white/20 font-bengali">কোনো কোর্স পাওয়া যায়নি</div>
            )}
          </div>
        </div>

        {/* --- DESKTOP VERSION --- */}
        <div className="hidden lg:flex w-full relative bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#011a1a] min-h-screen pt-[73px]">
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>

          <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col px-10 py-16">
            <div className="flex justify-between items-end mb-16">
              <div>
                <h2 className="text-6xl font-black text-white mb-4 tracking-tight font-bengali">আমাদের কোর্সসমূহ</h2>
                <p className="text-emerald-400/60 text-lg font-medium font-bengali">আপনার দক্ষতা বৃদ্ধিতে আমরা আছি আপনার পাশে।</p>
              </div>
              <Link href="/" className="flex items-center gap-2 text-white/40 hover:text-white transition-all font-bold font-bengali">
                <ChevronLeft size={20} />
                হোমে ফিরে যান
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-10">
              {loading ? (
                <div className="col-span-full flex justify-center py-20">
                  <Loader2 className="animate-spin text-emerald-500" size={48} />
                </div>
              ) : courses.length > 0 ? (
                courses.map((course) => (
                  <div key={course.id} className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2rem] overflow-hidden flex flex-col group hover:border-emerald-500/30 transition-all duration-500 transform hover:-translate-y-2 shadow-2xl">
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={`https://img.youtube.com/vi/${course.youtubeId}/maxresdefault.jpg`}
                        alt={course.title}
                        className="w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500 shadow-emerald-500/20">
                          <Play size={32} className="fill-white ml-1" />
                        </div>
                      </div>
                      {/* Security Overlay */}
                      <div className="absolute inset-0 z-10 bg-transparent pointer-events-auto"></div>
                    </div>

                    <div className="p-8 flex flex-col flex-1">
                      <h3 className="text-2xl font-black text-white mb-4 font-bengali leading-tight">{course.title}</h3>
                      <div className="flex items-center gap-3 mb-8">
                        <span className="text-3xl font-black text-emerald-400">৳{course.price}</span>
                        <div className="h-4 w-px bg-white/10"></div>
                        <span className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Lifetime Access</span>
                      </div>

                      <div className="mt-auto grid grid-cols-2 gap-4">
                        <button
                          onClick={() => openDetails(course)}
                          className="flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold font-bengali transition-all border border-white/10"
                        >
                          <Info size={20} />
                          বিস্তারিত
                        </button>
                        <button
                          onClick={() => handleEnroll(course.id)}
                          className="flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold font-bengali transition-all shadow-xl shadow-emerald-600/20"
                        >
                          ভর্তি হন
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-40 text-white/20 font-bengali text-2xl">এখনো কোনো কোর্স পাবলিশ করা হয়নি</div>
              )}
            </div>
          </div>
        </div>

        {/* --- DETAILS FULLSCREEN MODAL --- */}
        {showModal && selectedCourse && (
          <div className="fixed inset-0 z-[100] flex flex-col bg-[#001a1a] animate-in slide-in-from-bottom duration-500">
            {/* Header */}
            <div className="w-full bg-[#002b2b] border-b border-white/5 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
              <h3 className="text-white font-bold font-bengali text-lg lg:text-xl truncate pr-4">{selectedCourse.title}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="w-full max-w-4xl mx-auto px-6 py-10 flex flex-col">
                <div className="aspect-video w-full rounded-3xl overflow-hidden bg-black mb-10 shadow-2xl relative border border-white/10">
                   <iframe
                    src={`https://www.youtube.com/embed/${selectedCourse.youtubeId}?modestbranding=1&rel=0`}
                    title={selectedCourse.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                  {/* Security Overlay */}
                  <div className="absolute inset-0 z-[105] bg-transparent pointer-events-auto"></div>
                </div>

                <div className="flex flex-col space-y-8">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-white/5 pb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
                        <CreditCard size={32} />
                      </div>
                      <div>
                        <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Course Fee</p>
                        <p className="text-white font-black text-4xl">৳{selectedCourse.price}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEnroll(selectedCourse.id)}
                      className="w-full lg:w-auto px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black font-bengali text-xl transition-all shadow-2xl shadow-emerald-600/30"
                    >
                      ভর্তি হতে ক্লিক করুন
                    </button>
                  </div>

                  <div className="prose prose-invert max-w-none">
                    <h4 className="text-emerald-400 font-bold text-2xl mb-6 font-bengali">কোর্স সম্পর্কে বিস্তারিত</h4>
                    <div className="text-white/70 font-bengali text-lg leading-relaxed whitespace-pre-wrap">
                      {selectedCourse.details}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
}
