"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Video,
  Users,
  Settings,
  LogOut,
  Award,
  Zap,
  Flag,
  Inbox,
  Home,
  ChevronDown,
  CircleDot,
  ShoppingBag,
  Package,
  Bell
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Home Page', href: '/admin/home', icon: Home },
  { name: 'প্রোডাক্ট', href: '/admin/shop', icon: ShoppingBag },
  { name: 'অর্ডারসমূহ', href: '/admin/orders', icon: Package },
  { name: 'কোর্সসমূহ', href: '/admin/courses', icon: Video },
  {
    name: 'Inbox',
    href: '#',
    icon: Inbox,
    subItems: [
      { name: 'Course Requests', href: '/admin/inbox/course' },
      { name: 'Sadaka Requests', href: '/admin/inbox/sadaka' },
    ]
  },
  { name: 'ইসলাম কি? কেন?', href: '/admin/what-is-islam', icon: Video },
  { name: 'সাফল্যের জন্য দক্ষতা', href: '/admin/skills', icon: Zap },
  { name: 'লক্ষ্য-উদ্দেশ্য', href: '/admin/goals', icon: Flag },
  { name: 'মেম্বারশিপ ম্যানেজমেন্ট', href: '/admin/membership', icon: Award },
  { name: 'আল কুরআন', href: '/admin/quran', icon: BookOpen },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'নোটিফিকেশন', href: '/admin/notifications', icon: Bell },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [isInboxOpen, setIsInboxOpen] = useState(pathname.includes('/admin/inbox'));

  return (
    <aside className="w-64 bg-[#002b2b] border-r border-white/5 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-white/5">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-sm flex items-center justify-center">
            <span className="text-sm font-black">H</span>
          </div>
          Admin Panel
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.subItems && pathname.includes(item.href));

          if (item.subItems) {
            return (
              <div key={item.name} className="space-y-1">
                <button
                  onClick={() => setIsInboxOpen(!isInboxOpen)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-sm transition-all ${
                    isInboxOpen ? 'bg-white/5 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} />
                    <span className="font-medium font-bengali">{item.name}</span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${isInboxOpen ? 'rotate-180' : ''}`} />
                </button>

                {isInboxOpen && (
                  <div className="ml-4 space-y-1 border-l border-white/10 pl-2">
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-sm transition-all text-sm ${
                          pathname === sub.href ? 'text-emerald-400 font-bold' : 'text-white/40 hover:text-white/60'
                        }`}
                      >
                        <CircleDot size={10} />
                        <span className="font-bengali">{sub.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-all ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium font-bengali">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button
          onClick={() => logout('/admin/login')}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/5 rounded-sm transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
