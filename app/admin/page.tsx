"use client";

import React from 'react';
import { LayoutDashboard, Video, BookOpen, Users } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    { name: 'Total Videos', value: '0', icon: Video, color: 'text-blue-400' },
    { name: 'Quran Chapters', value: '114', icon: BookOpen, color: 'text-emerald-400' },
    { name: 'Registered Users', value: '0', icon: Users, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Welcome Back, Admin</h2>
        <p className="text-white/40">Here is what's happening with Huda Uni today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl bg-white/5 ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
            <p className="text-white/40 text-sm font-medium mb-1 uppercase tracking-wider">{stat.name}</p>
            <h3 className="text-4xl font-bold text-white tracking-tight">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-10 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500 mb-6">
            <LayoutDashboard size={40} />
          </div>
          <h3 className="text-2xl font-bold text-white">Select a Module</h3>
          <p className="text-white/40">Use the sidebar to manage different sections of the website. You can add videos, manage Quran data, and more.</p>
        </div>
      </div>
    </div>
  );
}
