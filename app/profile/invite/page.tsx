"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, UserPlus, Mail, Phone, Loader2, User, Award, TrendingUp, X, CheckCircle2, Users, Circle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import AdminAlert from '@/components/AdminAlert';

export default function InvitePage() {
  const { user, loading: authLoading } = useAuth();
  const [invitedUsers, setInvitedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");

  // Alert state
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'confirm' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const showAlert = (type: 'success' | 'error' | 'confirm' | 'info', title: string, message: string) => {
    setAlertConfig({ isOpen: true, type, title, message });
  };

  const fetchInvitedUsers = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, "users"), where("referredBy", "==", user.uid));
      const snap = await getDocs(q);

      const usersList = await Promise.all(snap.docs.map(async (d) => {
        const uData = d.data();
        const uid = d.id;

        // Fetch stats for each invited user
        let progress = 0;
        try {
          // 1. Fetch total tasks for their current role
          const tQuery = query(collection(db, "membershipTasks"), where("levelId", "==", uData.role || "associate"));
          const tSnap = await getDocs(tQuery);
          const totalTasks = tSnap.docs.length;

          // 2. Fetch their progress
          const pSnap = await getDoc(doc(db, "userProgress", uid));
          if (pSnap.exists() && totalTasks > 0) {
            const pData = pSnap.data()[uData.role || "associate"] || {};
            const completedCount = Object.values(pData).filter((t: any) => t.completed).length;
            progress = Math.round((completedCount / totalTasks) * 100);
          }
        } catch (e) { console.error(e); }

        return {
          id: uid,
          ...uData,
          progress
        };
      }));

      setInvitedUsers(usersList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchInvitedUsers();
    }
  }, [user, authLoading, fetchInvitedUsers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setSubmitting(true);

    try {
      // 1. Check if user exists by email
      const q = query(collection(db, "users"), where("email", "==", inviteEmail.toLowerCase().trim()));
      const snap = await getDocs(q);

      if (snap.empty) {
        showAlert('error', 'ইউজার পাওয়া যায়নি', 'এই ইমেইল দিয়ে কোনো ইউজার রেজিস্ট্রেশন করা নেই।');
      } else {
        const targetUserDoc = snap.docs[0];
        const targetUserData = targetUserDoc.data();

        if (targetUserDoc.id === user?.uid) {
           showAlert('error', 'অসম্ভব', 'আপনি নিজেকে ইনভাইট করতে পারবেন না।');
        } else if (targetUserData.referredBy) {
          showAlert('error', 'ইতিমধ্যে রেফার করা', 'এই ইউজারকে ইতিমধ্যে অন্য কেউ রেফার করেছেন।');
        } else {
          // 2. Update the user with referredBy and referredPhone
          await updateDoc(doc(db, "users", targetUserDoc.id), {
            referredBy: user?.uid,
            referrerName: user?.displayName || "Referrer",
            referredPhone: invitePhone || ""
          });

          showAlert('success', 'সফল হয়েছে', `${targetUserData.displayName} কে সফলভাবে আপনার ইনভাইট লিস্টে যুক্ত করা হয়েছে।`);
          setIsInviteModalOpen(false);
          setInviteEmail("");
          setInvitePhone("");
          fetchInvitedUsers();
        }
      }
    } catch (e) {
      console.error(e);
      showAlert('error', 'ব্যর্থ হয়েছে', 'ইনভাইট সম্পন্ন করা সম্ভব হয়নি।');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || (user && loading)) {
    return (
      <div className="min-h-screen bg-[#001a1a] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#001a1a] flex flex-col font-sans">
      <Navbar showHome={true} />
      <AdminAlert
        {...alertConfig}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-6 lg:pt-28 pb-12">
        <div className="flex items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
             <Link href="/profile">
               <button className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all">
                 <ChevronLeft size={20} />
               </button>
             </Link>
             <h2 className="text-2xl font-bold text-white font-bengali">ইনভাইট লিস্ট</h2>
          </div>

          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95"
          >
            <Circle size={18} />
            ইনভাইট করুন
          </button>
        </div>

        {/* Invited Users List */}
        <div className="space-y-4">
          {invitedUsers.length === 0 ? (
            <div className="py-20 text-center text-white/10 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center">
               <Circle size={48} className="mb-4 opacity-20" />
               <p className="font-bengali">আপনার মাধ্যমে এখন পর্যন্ত কেউ যুক্ত হয়নি।</p>
               <p className="text-xs mt-2 uppercase tracking-widest opacity-40">Invite your friends to see their progress here</p>
            </div>
          ) : (
            invitedUsers.map((u) => (
              <div key={u.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-6 shadow-xl hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-emerald-400 font-bold text-lg">
                    {u.photoURL ? (
                      <img src={u.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      u.displayName?.charAt(0) || 'U'
                    )}
                  </div>
                  <div>
                    <h4 className="text-white font-bold font-bengali">{u.displayName}</h4>
                    <p className="text-white/30 text-xs truncate max-w-[200px]">{u.email}</p>
                    {u.referredPhone && <p className="text-purple-400/60 text-[10px] font-bold mt-0.5">Phone: {u.referredPhone}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">{u.role || 'associate'}</span>
                      <span className="text-white/20 text-[10px] font-bold">ID: {u.associateId}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Stats */}
                <div className="flex flex-col md:w-48 space-y-2">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                     <span className="text-white/40">Progress</span>
                     <span className="text-emerald-400">{u.progress}%</span>
                   </div>
                   <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000"
                        style={{ width: `${u.progress}%` }}
                      ></div>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60 animate-in fade-in duration-300">
          <div className="bg-[#002b2b] border border-white/10 w-full max-w-md rounded-[2rem] p-8 shadow-2xl relative">
            <button
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/40 transition-all"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-2xl">
                <Circle size={32} />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white font-bengali">বন্ধুকে ইনভাইট করুন</h3>
                <p className="text-white/40 text-sm font-bengali">ইউজারের ইমেইল এবং ফোন নম্বর দিয়ে রেফার করুন।</p>
              </div>

              <form onSubmit={handleInvite} className="w-full space-y-4">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] text-white/20 uppercase font-black tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input
                      type="email"
                      required
                      placeholder="user@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-[10px] text-white/20 uppercase font-black tracking-widest ml-1">Phone Number (Optional)</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input
                      type="tel"
                      placeholder="017XXXXXXXX"
                      value={invitePhone}
                      onChange={(e) => setInvitePhone(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
                >
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                  REFER INVITE
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
