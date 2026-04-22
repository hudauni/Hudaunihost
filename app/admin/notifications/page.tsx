"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  limit,
  where
} from 'firebase/firestore';
import { Bell, Send, Users, User, Clock, CheckCircle2, Loader2, Search } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  recipientId: string; // "all" or userId
  createdAt: any;
  type: 'announcement' | 'alert' | 'update';
}

interface UserData {
  uid: string;
  displayName: string;
  email: string;
  associateId: string;
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [targetType, setTargetType] = useState<'all' | 'individual'>('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notifType, setNotifType] = useState<'announcement' | 'alert' | 'update'>('announcement');

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, []);

  const fetchNotifications = async () => {
    try {
      const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(20));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, "users"));
      const data = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as UserData[];
      setUsers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredUsers = users.filter(u =>
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.associateId?.toString().toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    if (targetType === 'individual' && !selectedUser) {
      alert("Please select a user");
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "notifications"), {
        title,
        message,
        type: notifType,
        recipientId: targetType === 'all' ? 'all' : selectedUser?.uid,
        createdAt: serverTimestamp(),
      });

      setTitle("");
      setMessage("");
      setSelectedUser(null);
      setSearchQuery("");
      fetchNotifications();
      alert("Notification Sent!");
    } catch (e) {
      console.error(e);
      alert("Failed to send notification");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1 font-bengali">নোটিফিকেশন সেন্টার</h2>
        <p className="text-white/40 text-sm">সকল ইউজার অথবা নির্দিষ্ট কাউকে নোটিফিকেশন পাঠান</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Send Notification Form */}
        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 shadow-2xl">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Send size={20} className="text-emerald-500" />
            নতুন নোটিফিকেশন
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setTargetType('all')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${targetType === 'all' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'}`}
              >
                <Users size={18} />
                <span className="font-bold">সবার জন্য</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetType('individual')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${targetType === 'individual' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'}`}
              >
                <User size={18} />
                <span className="font-bold">নির্দিষ্ট ইউজার</span>
              </button>
            </div>

            {targetType === 'individual' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-xs text-white/40 uppercase font-black tracking-widest ml-1">Select User</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input
                    type="text"
                    placeholder="নাম অথবা আইডি দিয়ে খুঁজুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 font-bengali"
                  />
                </div>
                {searchQuery && filteredUsers.length > 0 && (
                  <div className="bg-[#002b2b] border border-white/10 rounded-xl overflow-hidden divide-y divide-white/5">
                    {filteredUsers.map(u => (
                      <button
                        key={u.uid}
                        type="button"
                        onClick={() => { setSelectedUser(u); setSearchQuery(u.displayName); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all text-left ${selectedUser?.uid === u.uid ? 'bg-emerald-500/10' : ''}`}
                      >
                        <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-xs text-white/40 font-bold uppercase">{u.displayName?.charAt(0)}</div>
                        <div>
                          <p className="text-white text-sm font-bold">{u.displayName}</p>
                          <p className="text-white/30 text-[10px] uppercase font-bold">{u.associateId}</p>
                        </div>
                        {selectedUser?.uid === u.uid && <CheckCircle2 className="ml-auto text-emerald-500" size={16} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-white/40 uppercase font-black tracking-widest ml-1">Notification Title</label>
                <input
                  type="text"
                  placeholder="যেমন: নতুন কোর্স আপডেট"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 font-bengali"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white/40 uppercase font-black tracking-widest ml-1">Message Content</label>
                <textarea
                  placeholder="নোটিফিকেশন বার্তাটি এখানে লিখুন..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 font-bengali resize-none"
                ></textarea>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white/40 uppercase font-black tracking-widest ml-1">Notification Type</label>
                <div className="flex gap-2">
                  {['announcement', 'alert', 'update'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNotifType(t as any)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all ${notifType === t ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-white/30 border-white/5'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              disabled={submitting}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20"
            >
              {submitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              SEND NOTIFICATION
            </button>
          </form>
        </div>

        {/* Recent Notifications List */}
        <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 flex flex-col h-full">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Clock size={20} className="text-emerald-500" />
            সাম্প্রতিক নোটিফিকেশনসমূহ
          </h3>

          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-emerald-500" /></div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-20 text-white/20">কোনো নোটিফিকেশন পাওয়া যায়নি</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className={`text-[8px] uppercase font-black tracking-widest mb-1 px-2 py-0.5 rounded border inline-block w-fit ${n.type === 'alert' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                        {n.type}
                      </span>
                      <h4 className="text-white font-bold font-bengali">{n.title}</h4>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-white/20 font-bold uppercase">
                      {n.recipientId === 'all' ? <Users size={12} /> : <User size={12} />}
                      {n.recipientId === 'all' ? 'All' : 'Single'}
                    </div>
                  </div>
                  <p className="text-white/50 text-sm font-bengali leading-relaxed">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
}
