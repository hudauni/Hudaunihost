"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Loader2, CreditCard, Clock, CheckCircle2, XCircle, Wallet } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface SadakaRequest {
  id: string;
  amount: string | number;
  transactionId: string;
  status: 'pending' | 'approved' | 'declined';
  createdAt: any;
}

export default function SadakaHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<SadakaRequest[]>([]);
  const [totalApproved, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    async function fetchHistory() {
      if (!user) return;
      try {
        // Removed orderBy to avoid Firestore Composite Index requirement
        const q = query(
          collection(db, "sadakaRequests"),
          where("uid", "==", user.uid)
        );
        const snap = await getDocs(q);

        // Sort results in-memory (descending order by createdAt)
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as SadakaRequest[];
        data.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setRequests(data);

        const total = data
          .filter(req => req.status === 'approved')
          .reduce((sum, req) => sum + (Number(req.amount) || 0), 0);
        setTotalAmount(total);
      } catch (e) {
        console.error("Error fetching sadaka history:", e);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchHistory();
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#001a1a] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="text-emerald-400" size={16} />;
      case 'declined': return <XCircle className="text-red-400" size={16} />;
      default: return <Clock className="text-yellow-400" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'declined': return 'bg-red-500/10 border-red-500/20 text-red-400';
      default: return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#001a1a] flex flex-col font-sans overflow-x-hidden">
      <Navbar showHome={true} />

      <main className="relative flex-1 w-full flex flex-col items-center">
        <div
          className="w-full min-h-screen flex flex-col items-center bg-no-repeat bg-cover bg-fixed pt-0 pb-10"
          style={{
            backgroundImage: "url('/images/mainimg.webp')",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-[#001a1a]/80 backdrop-blur-sm lg:backdrop-blur-md"></div>

          <div className="relative z-10 w-full max-w-4xl px-6 pt-4 flex flex-col items-center">
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-8">
              <Link href="/profile" className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white shadow-lg active:scale-90 transition-all">
                <ChevronLeft size={20} />
              </Link>
              <h2 className="text-white font-bold font-bengali text-xl drop-shadow-lg">সাদকা হিস্টোরি</h2>
              <div className="w-10"></div>
            </div>

            {/* Total Amount Card */}
            <div className="w-full max-w-[340px] md:max-w-none md:grid md:grid-cols-1 mb-8">
              <div className="bg-gradient-to-br from-emerald-600/40 to-emerald-900/60 backdrop-blur-xl border-t border-white/20 border-l border-white/10 rounded-2xl p-6 shadow-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white shadow-inner">
                    <Wallet size={28} />
                  </div>
                  <div>
                    <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest mb-1">Total Donated</p>
                    <h3 className="text-2xl font-black text-white tracking-tight">
                      {totalApproved.toLocaleString()} <span className="text-sm font-medium opacity-60">BDT</span>
                    </h3>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Requests</p>
                  <p className="text-white font-black text-xl">{requests.length}</p>
                </div>
              </div>
            </div>

            {/* History List */}
            <div className="w-full max-w-[340px] md:max-w-none space-y-4">
              <h3 className="text-white/40 text-xs font-bold uppercase tracking-[0.2em] mb-4 pl-4 border-l-2 border-emerald-500">Transaction Logs</h3>

              {requests.length === 0 ? (
                <div className="py-20 text-center text-white/20 border-2 border-dashed border-white/5 rounded-2xl font-bengali bg-black/20 backdrop-blur-sm">
                  আপনি এখন পর্যন্ত কোনো সাদকা রিকোয়েস্ট পাঠাননি।
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white/[0.03] border-t border-white/10 border-l border-white/5 backdrop-blur-md rounded-xl p-5 shadow-xl transition-all hover:bg-white/[0.06] group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 group-hover:scale-110 transition-transform">
                            <CreditCard size={18} />
                          </div>
                          <div>
                            <p className="text-white/40 text-[8px] uppercase font-bold tracking-widest">Amount</p>
                            <p className="text-white font-black text-base">{req.amount} BDT</p>
                          </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border ${getStatusColor(req.status)}`}>
                          {getStatusIcon(req.status)}
                          {req.status}
                        </div>
                      </div>

                      <div className="flex justify-between items-end border-t border-white/5 pt-4">
                        <div>
                          <p className="text-white/40 text-[8px] uppercase font-bold tracking-widest mb-1">Transaction ID</p>
                          <p className="text-white font-mono text-xs font-bold tracking-wider">{req.transactionId}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/20 text-[8px] uppercase font-bold tracking-widest">Date</p>
                          <p className="text-white/40 text-[9px]">
                            {req.createdAt?.toDate ? new Date(req.createdAt.toDate()).toLocaleDateString() : 'Pending...'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
