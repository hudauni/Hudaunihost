"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

interface NavbarProps {
  showHome?: boolean;
  showAdmission?: boolean;
  buttonText?: string;
}

export default function Navbar({
  showHome = false,
  showAdmission = false,
  buttonText = "প্রোফাইল"
}: NavbarProps) {
  const { user, userData } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Listen for unread notifications
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "in", [user.uid, "all"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lastRead = userData?.lastReadNotifications?.toDate() || new Date(0);

      const unread = snapshot.docs.filter(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate();
        return createdAt > lastRead;
      });

      setUnreadCount(unread.length);
    });

    return () => unsubscribe();
  }, [user, userData]);

  return (
    <nav className="hidden lg:flex w-full bg-[#064e3b]/90 backdrop-blur-xl border-b border-white/5 px-12 py-4 justify-between items-center z-50 fixed top-0 left-0 right-0 shadow-lg">
      <div className="flex items-center space-x-3">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <span className="text-white font-bold text-xl">H</span>
          </div>
          <span className="text-2xl font-bold text-white tracking-tighter italic">
            Huda <span className="text-emerald-400">Uni</span>
          </span>
        </Link>
      </div>

      <div className="flex items-center space-x-6">
        {(showHome || showAdmission) && (
          <div className="flex items-center space-x-8 text-white/70 text-sm font-medium">
            {showHome && (
              <Link href="/" className="hover:text-emerald-400 transition-colors">Home</Link>
            )}
            {showAdmission && (
              <Link href="/admission" className="hover:text-emerald-400 transition-colors">Admission</Link>
            )}
            <div className="h-6 w-[1px] bg-white/10"></div>
          </div>
        )}

        <div className="flex items-center space-x-4">
          <Link href="/notifications" className="relative p-2 text-white/70 hover:text-white transition-colors">
            <Bell size={24} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-[#064e3b] animate-pulse"></span>
            )}
          </Link>

          <Link href="/profile">
            <button className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-full transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
              <User size={18} />
              <span className="font-medium">{buttonText}</span>
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
