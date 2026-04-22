"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { Bell, ArrowLeft, Clock, Info, AlertTriangle, Sparkles, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'announcement' | 'alert' | 'update';
  createdAt: any;
  recipientId: string;
}

export default function NotificationsPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    // Mark as read when opening page
    const markAsRead = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          lastReadNotifications: serverTimestamp()
        });
      } catch (e) {
        console.error("Error marking notifications as read:", e);
      }
    };
    markAsRead();

    const q = query(
      collection(db, "notifications"),
      where("recipientId", "in", [user.uid, "all"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];

      // Sort by date locally since we can't use orderBy without a composite index yet
      data.sort((a, b) => {
        const dateA = a.createdAt?.toDate() || 0;
        const dateB = b.createdAt?.toDate() || 0;
        return dateB - dateA;
      });

      setNotifications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, router]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle size={20} className="text-red-400" />;
      case 'update': return <Sparkles size={20} className="text-emerald-400" />;
      default: return <Info size={20} className="text-blue-400" />;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "ব্যক্তিগত বার্তা";
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#001a1a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#001a1a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#001a1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl font-bold font-bengali">নোটিফিকেশন</h1>
          </div>
          <div className="relative">
            <Bell size={24} className="text-white/40" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
              <Bell size={40} className="text-white/10" />
            </div>
            <div className="space-y-1">
              <p className="text-white/60 font-bold font-bengali">কোনো নোটিফিকেশন নেই</p>
              <p className="text-white/20 text-sm font-bengali">নতুন কোনো আপডেট আসলে এখানে দেখা যাবে</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-2xl p-5 transition-all duration-300"
              >
                <div className="flex gap-4">
                  <div className="mt-1 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    {getTypeIcon(n.type)}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="font-bold font-bengali text-white/90 leading-tight">
                        {n.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/20 uppercase whitespace-nowrap bg-white/5 px-2 py-1 rounded">
                        <Clock size={12} />
                        {n.recipientId === 'all' ? 'পাবলিক' : 'ব্যক্তিগত'}
                      </div>
                    </div>

                    <p className="text-white/50 text-sm font-bengali leading-relaxed">
                      {n.message}
                    </p>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white/30 font-bengali">
                        {formatDate(n.createdAt)}
                      </span>
                      <ChevronRight size={16} className="text-white/10 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-[10px] text-white/10 uppercase tracking-[0.3em] font-black">Huda Uni Intelligence System</p>
        </div>
      </main>

      <style jsx global>{`
        body { background-color: #001a1a; }
      `}</style>
    </div>
  );
}
