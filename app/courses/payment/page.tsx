"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, CreditCard, ShieldCheck, CheckCircle2, Loader2, Smartphone, Building2 } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface Course {
  id: string;
  title: string;
  price: number;
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'card' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, "courses", courseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCourse({ id: docSnap.id, ...docSnap.data() } as Course);
        }
      } catch (error) {
        console.error("Error fetching course:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const handlePayment = async () => {
    if (!method) return;
    setIsProcessing(true);
    // Simulate payment gateway redirect
    setTimeout(() => {
      alert("This is a demo payment gateway. In a real application, you would be redirected to bKash/Nagad/SSLCommerz.");
      setIsProcessing(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-white px-6 text-center">
        <h2 className="text-2xl font-bold mb-4 font-bengali">কোর্সটি পাওয়া যায়নি</h2>
        <Link href="/courses" className="text-emerald-400 font-bold font-bengali flex items-center gap-2">
          <ChevronLeft size={20} /> কোর্সে ফিরে যান
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-10 lg:py-20 flex flex-col">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => router.back()} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-3xl font-black text-white font-bengali">পেমেন্ট সম্পন্ন করুন</h1>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Course Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
            <h2 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">নির্বাচিত কোর্স</h2>
            <h3 className="text-xl font-bold text-white mb-6 font-bengali leading-tight">{course.title}</h3>

            <div className="space-y-4 pt-6 border-t border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-white/60 font-bengali">কোর্স ফি</span>
                <span className="text-white font-bold">৳{course.price}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-400 font-bold text-xl pt-2 border-t border-white/5">
                <span className="font-bengali">সর্বমোট</span>
                <span>৳{course.price}</span>
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 flex gap-4">
            <ShieldCheck className="text-emerald-500 shrink-0" size={24} />
            <div>
              <p className="text-white font-bold text-sm mb-1 font-bengali">নিরাপদ পেমেন্ট</p>
              <p className="text-white/50 text-xs font-bengali">আপনার পেমেন্ট তথ্য সম্পূর্ণ সুরক্ষিত থাকবে।</p>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col h-full">
            <h2 className="text-white font-bold text-lg mb-6 font-bengali">পেমেন্ট মেথড নির্বাচন করুন</h2>

            <div className="grid grid-cols-1 gap-4 mb-10">
              <button
                onClick={() => setMethod('bkash')}
                className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${method === 'bkash' ? 'border-pink-500 bg-pink-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
              >
                <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center text-white">
                  <Smartphone size={24} />
                </div>
                <div className="text-left">
                  <p className="text-white font-bold font-bengali">bKash (বিকাশ)</p>
                  <p className="text-white/40 text-xs uppercase font-bold tracking-widest">Mobile Banking</p>
                </div>
                {method === 'bkash' && <CheckCircle2 className="ml-auto text-pink-500" size={24} />}
              </button>

              <button
                onClick={() => setMethod('nagad')}
                className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${method === 'nagad' ? 'border-orange-500 bg-orange-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
              >
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white">
                  <Smartphone size={24} />
                </div>
                <div className="text-left">
                  <p className="text-white font-bold font-bengali">Nagad (নগদ)</p>
                  <p className="text-white/40 text-xs uppercase font-bold tracking-widest">Mobile Banking</p>
                </div>
                {method === 'nagad' && <CheckCircle2 className="ml-auto text-orange-500" size={24} />}
              </button>

              <button
                onClick={() => setMethod('card')}
                className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${method === 'card' ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
              >
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                  <Building2 size={24} />
                </div>
                <div className="text-left">
                  <p className="text-white font-bold font-bengali">Card (কার্ড)</p>
                  <p className="text-white/40 text-xs uppercase font-bold tracking-widest">Credit/Debit Card</p>
                </div>
                {method === 'card' && <CheckCircle2 className="ml-auto text-emerald-500" size={24} />}
              </button>
            </div>

            <button
              onClick={handlePayment}
              disabled={!method || isProcessing}
              className={`w-full py-5 rounded-2xl font-black font-bengali text-xl transition-all shadow-2xl flex items-center justify-center gap-3 ${
                !method || isProcessing
                ? 'bg-white/10 text-white/20 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  অপেক্ষা করুন...
                </>
              ) : (
                <>
                  <CreditCard size={24} />
                  পেমেন্ট করুন
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <div className="min-h-screen w-full bg-[#001a1a] flex flex-col font-sans overflow-x-hidden">
      <Navbar showHome={true} />
      <main className="relative flex-1 w-full flex flex-col">
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-emerald-500" size={48} />
          </div>
        }>
          <PaymentContent />
        </Suspense>
      </main>
    </div>
  );
}
