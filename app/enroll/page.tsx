"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Send, CheckCircle2, Loader2, BookOpen, Play, Copy, Check } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

function EnrollContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, userData } = useAuth();

  const courseTitle = searchParams.get('course') || "Islamic Course";
  const type = searchParams.get('type') || "course";

  const [senderNumber, setSenderNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [enrollVideoId, setEnrollVideoId] = useState<string | null>(null);
  const [enrollSteps, setEnrollSteps] = useState<{ id: string; type: 'text' | 'number'; text?: string; number?: string }[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const settingsSnap = await getDoc(doc(db, "settings", "general"));
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          setEnrollVideoId(data.enrollVideoId || null);
          setEnrollSteps(data.enrollSteps || []);
        }
      } catch (e) {
        console.error("Error fetching enroll data:", e);
      } finally {
        setDataLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toBengaliNumber = (num: number | string) => {
    const digits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().split('').map(d => digits[parseInt(d)] || d).join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !senderNumber || !amount) return;

    // Strict Associate ID check before submission
    const finalAssociateId = userData?.associateId || (typeof window !== 'undefined' ? localStorage.getItem('cached_associate_id') : null);

    if (!finalAssociateId || finalAssociateId === "N/A") {
      alert("অ্যাসোসিয়েট আইডি পাওয়া যায়নি। দয়া করে কিছুক্ষণ অপেক্ষা করুন অথবা আবার লগইন করুন।");
      return;
    }

    setLoading(true);
    try {
      const collectionName = type === 'service' ? "serviceRequests" : "courseRequests";
      await addDoc(collection(db, collectionName), {
        uid: user.uid,
        displayName: userData?.displayName || user.displayName,
        email: user.email,
        associateId: finalAssociateId,
        role: userData?.role || "associate",
        courseName: courseTitle,
        amount: amount,
        senderNumber: senderNumber,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting enrollment:", error);
      alert("রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const VideoCard = () => {
    if (!enrollVideoId) return null;
    return (
      <div className="w-full mb-8">
        <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-white/10 shadow-xl bg-black">
          {isPlaying ? (
            <div className="relative w-full h-full">
              <iframe
                src={`https://www.youtube.com/embed/${enrollVideoId}?autoplay=1&modestbranding=1&rel=0&enablejsapi=1&playsinline=1`}
                title="How to enroll"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              ></iframe>

              {/* --- RESPONSIVE OVERLAYS --- */}
              <div className="absolute top-0 left-0 right-0 h-[30%] z-10 bg-transparent pointer-events-auto cursor-default"></div>
              <div className="absolute bottom-0 left-0 right-0 h-[20%] z-10 bg-transparent pointer-events-auto cursor-default"></div>
              <div className="absolute top-0 bottom-0 right-0 w-[30%] z-10 bg-transparent pointer-events-auto cursor-default"></div>
              <div className="absolute top-0 bottom-0 left-0 w-[30%] z-10 bg-transparent pointer-events-auto cursor-default"></div>
            </div>
          ) : (
            <div onClick={() => setIsPlaying(true)} className="relative w-full h-full group cursor-pointer">
              <img
                src={`https://img.youtube.com/vi/${enrollVideoId}/hqdefault.jpg`}
                alt="Tutorial Thumbnail"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play size={24} className="text-white fill-white ml-1" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-center text-white">
                <h4 className="text-xs font-bold font-bengali">কিভাবে এনরোল করবেন? ভিডিওটি দেখুন</h4>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (dataLoading) {
    return <div className="flex items-center justify-center min-h-screen text-emerald-500"><Loader2 className="animate-spin" size={40} /></div>;
  }

  return (
    <main className="relative flex-1 w-full flex flex-col items-center">
      {/* --- MOBILE VERSION --- */}
      <div className="lg:hidden w-full min-h-screen flex flex-col items-center bg-gradient-to-b from-[#002b2b] to-[#001a1a] pt-0 pb-10">
        <div className="w-full flex justify-start px-6 pt-6 relative z-50">
          <button onClick={() => router.back()} className="p-2.5 bg-white/5 border border-white/10 rounded-sm text-white shadow-lg active:scale-90 transition-all">
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="w-full max-w-[350px] mt-4 px-4">
          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-sm p-8 shadow-2xl">
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-sm flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/20">
                <BookOpen size={32} />
              </div>
              <h2 className="text-2xl font-black text-white font-bengali tracking-tight">কোর্স এনরোলমেন্ট</h2>
              <p className="text-emerald-400 font-bold text-sm mt-1 font-bengali">{courseTitle}</p>
            </div>

            {!submitted && <VideoCard />}

            {!submitted ? (
              <div className="space-y-8">
                <div className="space-y-5 text-white/90 font-bengali text-[15px] leading-relaxed">
                  {enrollSteps.map((step, index) => (
                    <div key={step.id || index} className="flex gap-4 items-start">
                      <span className="w-6 h-6 shrink-0 bg-emerald-500 text-[#001a1a] rounded-sm flex items-center justify-center text-xs font-black">
                        {toBengaliNumber(index + 1)}
                      </span>
                      <div className="flex-1">
                        <div className="pt-0.5 flex flex-wrap items-center gap-x-2">
                          {step.type === 'text' ? (
                            <span>{step.text}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                              <span className="text-emerald-400 font-bold tracking-wider font-sans">{step.number}</span>
                              <button
                                onClick={() => handleCopy(step.number!, `step-${index}`)}
                                className="p-1 hover:bg-white/10 rounded transition-all text-emerald-400"
                              >
                                {copiedId === `step-${index}` ? <Check size={12} /> : <Copy size={12} />}
                              </button>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {enrollSteps.length === 0 && (
                    <p className="text-white/20 text-center text-xs">No enrollment steps configured.</p>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 uppercase font-bold ml-1 tracking-widest">Fee Amount</label>
                    <input
                      type="number"
                      placeholder="৫০০"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-sm px-5 py-4 text-white text-base outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 uppercase font-bold ml-1 tracking-widest">Sender Number</label>
                    <input
                      type="tel"
                      placeholder="017xxxxxxxx"
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-sm px-5 py-4 text-white text-base outline-none focus:border-emerald-500/50 font-mono"
                    />
                  </div>
                  <button
                    disabled={loading}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-2xl"
                  >
                    {loading ? <Loader2 className="animate-spin" size={22} /> : <Send size={22} />}
                    এনরোল করুন
                  </button>
                </form>
              </div>
            ) : (
              <div className="py-10 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-sm flex items-center justify-center text-emerald-400">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-2xl font-bold text-white font-bengali">আবেদন সফল হয়েছে!</h3>
                <p className="text-white/40 text-sm font-bengali">যাচাই শেষে আপনার কোর্সটি আনলক করে দেওয়া হবে।</p>
                <button onClick={() => router.push('/')} className="text-emerald-400 font-bold font-bengali pt-4 underline underline-offset-8 text-lg">হোমে ফিরে যান</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- DESKTOP VERSION --- */}
      <div className="hidden lg:flex w-full min-h-[calc(100vh-73px)] relative bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#011a1a] items-center justify-center p-20">
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>

        <div className="relative z-10 w-full max-w-5xl bg-white/[0.03] border border-white/10 backdrop-blur-3xl rounded-sm p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] flex gap-16 items-center">
          <div className="flex-1 space-y-10">
            <div className="space-y-2">
              <h2 className="text-5xl font-black text-white font-bengali italic tracking-tight">এনরোলমেন্ট গাইডলাইন</h2>
              <p className="text-emerald-400 font-bold text-xl font-bengali">কোর্স: {courseTitle}</p>
              <div className="w-24 h-1.5 bg-emerald-500 rounded-full mt-4"></div>
            </div>

            {!submitted && <VideoCard />}

            <div className="space-y-8 text-white/80 font-bengali text-xl leading-relaxed">
               {enrollSteps.map((step, index) => (
                <div key={step.id || index} className="flex gap-5 items-start">
                  <span className="w-10 h-10 shrink-0 bg-emerald-500 text-[#001a1a] rounded-sm flex items-center justify-center font-black">
                    {toBengaliNumber(index + 1)}
                  </span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-x-3">
                      {step.type === 'text' ? (
                        <span>{step.text}</span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                          <span className="text-emerald-400 font-black tracking-widest font-sans">{step.number}</span>
                          <button
                            onClick={() => handleCopy(step.number!, `step-desktop-${index}`)}
                            className="p-1.5 hover:bg-white/10 rounded transition-all text-emerald-400"
                          >
                            {copiedId === `step-desktop-${index}` ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-[350px]">
            {!submitted ? (
              <div className="bg-black/40 p-10 rounded-sm border border-white/10 shadow-2xl space-y-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white font-bengali mb-2">এনরোলমেন্ট ফর্ম</h3>
                  <p className="text-white/20 text-xs uppercase tracking-widest font-bold font-sans">Verification</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-xs text-white/40 uppercase font-bold ml-1 font-sans tracking-widest">Course Fee</label>
                    <input
                      type="number"
                      placeholder="Ex: 500"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-sm px-6 py-5 text-white text-lg outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs text-white/40 uppercase font-bold ml-1 font-sans tracking-widest">Sender Number</label>
                    <input
                      type="tel"
                      placeholder="017xxxxxxxx"
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-sm px-6 py-5 text-white text-lg outline-none focus:border-emerald-500/50 transition-all font-mono"
                    />
                  </div>
                  <button
                    disabled={loading}
                    className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm font-black uppercase tracking-[0.2em] transition-all active:translate-y-1 active:shadow-none flex items-center justify-center gap-3 shadow-xl"
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                    SUBMIT
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-emerald-500/10 p-12 rounded-sm border border-emerald-500/20 text-center space-y-8 animate-in zoom-in-95 shadow-2xl">
                <div className="w-20 h-20 bg-emerald-500 rounded-sm flex items-center justify-center text-[#001a1a] mx-auto shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-bold text-white font-bengali">সাবমিট হয়েছে!</h3>
                <p className="text-white/40 text-sm font-bengali">আপনার আবেদনটি এডমিন ভেরিফাই করছেন।</p>
                <button onClick={() => router.push('/')} className="inline-block px-10 py-3 bg-white text-black rounded-sm font-black transition-all text-sm uppercase tracking-widest">হোমে ফিরে যান</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CourseEnrollPage() {
  return (
    <div className="min-h-screen w-full bg-[#001a1a] flex flex-col font-sans">
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-emerald-500">Loading...</div>}>
        <EnrollContent />
      </Suspense>
    </div>
  );
}
