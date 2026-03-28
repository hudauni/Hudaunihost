"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import {
  User,
  Mail,
  Hash,
  Shield,
  Search,
  Trash2,
  Edit2,
  Loader2,
  Calendar,
  Check,
  X,
  ChevronRight,
  TrendingUp,
  Heart,
  CreditCard
} from 'lucide-react';

interface UserData {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: string;
  associateId: number | string;
  createdAt: string;
}

export default function AdminUsersList() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState("");

  // Drawer states
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [userStats, setUserStats] = useState({ progress: 0, totalSadaka: 0 });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, "users"), orderBy("associateId", "asc"));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as UserData[];
      setUsers(data);

      // Auto-open first user
      if (data.length > 0) {
        fetchUserDetails(data[0]);
      }
    } catch (e) {
      console.error("Error fetching users:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (user: UserData) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
    setStatsLoading(true);

    try {
      // 1. Fetch Sadaka Total for this specific user
      const sQuery = query(
        collection(db, "sadakaRequests"),
        where("uid", "==", user.id),
        where("status", "==", "approved")
      );
      const sSnap = await getDocs(sQuery);
      const totalSadaka = sSnap.docs.reduce((sum, d) => sum + (Number(d.data().amount) || 0), 0);

      // 2. Fetch Level Progress
      const tQuery = query(collection(db, "membershipTasks"), where("levelId", "==", user.role));
      const tSnap = await getDocs(tQuery);
      const totalTasksInLevel = tSnap.docs.length;

      const pRef = doc(db, "userProgress", user.id);
      const pSnap = await getDoc(pRef);
      let progress = 0;

      if (pSnap.exists() && totalTasksInLevel > 0) {
        const progressData = pSnap.data()[user.role] || {};
        const completedCount = Object.values(progressData).filter((t: any) => t.completed).length;
        progress = Math.round((completedCount / totalTasksInLevel) * 100);
      }

      setUserStats({ progress, totalSadaka });
    } catch (e) {
      console.error("Error fetching user details:", e);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleUpdateRole = async (uid: string, role: string) => {
    try {
      await updateDoc(doc(db, "users", uid), { role });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত যে এই ইউজারকে ডিলিট করতে চান?")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      setIsDrawerOpen(false);
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.associateId?.toString().includes(searchQuery)
    );
  }, [users, searchQuery]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-emerald-500 animate-pulse font-bold">লোড হচ্ছে...</div>;
  }

  return (
    <div className="relative min-h-screen">
      {/* Main List Area */}
      <div className={`space-y-6 transition-all duration-500 ${isDrawerOpen ? 'md:pr-[400px]' : ''}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1 font-bengali">ইউজার লিস্ট</h2>
            <p className="text-white/40 text-xs">Manage registered users and view details</p>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <input
              type="text"
              placeholder="নাম বা আইডি দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-sm pl-10 pr-4 py-2 text-white text-xs outline-none focus:border-emerald-500/50 transition-all w-full md:w-64 font-bengali"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => fetchUserDetails(user)}
              className={`p-3 rounded-sm border transition-all flex items-center justify-between gap-4 cursor-pointer group ${
                selectedUser?.id === user.id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/[0.04] border-white/5 hover:bg-white/[0.08]'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full border border-emerald-500/20 p-0.5 overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/20"><User size={16}/></div>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-white font-bold text-xs truncate font-bengali group-hover:text-emerald-400 transition-colors">{user.displayName}</h4>
                  <p className="text-white/20 text-[9px] truncate">{user.email}</p>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[7px] text-white/20 uppercase font-bold tracking-widest">ID</p>
                  <h4 className="text-white font-black text-[10px] tracking-widest">{user.associateId}</h4>
                </div>
                <div className="text-right w-16">
                  <p className="text-[7px] text-white/20 uppercase font-bold tracking-widest">Role</p>
                  <h4 className="text-emerald-400 font-bold text-[9px] uppercase italic">{user.role}</h4>
                </div>
              </div>

              <ChevronRight size={14} className={`transition-all ${selectedUser?.id === user.id ? 'text-emerald-500 translate-x-1' : 'text-white/10 group-hover:text-emerald-500'}`} />
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="py-20 text-center text-white/10 border-2 border-dashed border-white/5 rounded-sm font-bengali">কোনো ইউজার খুঁজে পাওয়া যায়নি</div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE DRAWER - Standardized and Compact */}
      <div className={`fixed top-0 right-0 h-screen w-full md:w-[380px] bg-[#002b2b] border-l border-white/10 shadow-2xl z-[100] transition-transform duration-500 ease-in-out transform ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedUser && (
          <div className="h-full flex flex-col p-5 space-y-6 overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white font-bengali">ইউজার ডিটেইলস</h3>
              <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 hover:bg-white/5 rounded-sm text-white/40 transition-colors"><X size={20}/></button>
            </div>

            {/* Profile Header */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-[#d4af37] p-0.5 shadow-xl bg-black/20">
                  <img src={selectedUser.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 p-1 rounded-full shadow-lg border border-[#002b2b]">
                  <Check size={10} className="text-white" strokeWidth={4} />
                </div>
              </div>
              <div>
                <h4 className="text-xl font-black text-white font-bengali">{selectedUser.displayName}</h4>
                <p className="text-emerald-400/60 font-medium text-xs tracking-tight">{selectedUser.email}</p>
              </div>
            </div>

            {/* Detailed Stats Cards - Reduced height and padding */}
            <div className="grid grid-cols-1 gap-3">
              <div className="p-4 bg-white/[0.03] border border-white/5 rounded-sm relative overflow-hidden shadow-xl">
                <TrendingUp size={32} className="absolute -right-1 -bottom-1 text-emerald-500 opacity-5" />
                <div className="relative z-10">
                  <p className="text-white/40 text-[8px] uppercase font-bold tracking-widest mb-3 flex items-center gap-2">
                    <Shield size={10} className="text-emerald-400" /> Rank Progress
                  </p>
                  {statsLoading ? (
                    <div className="flex justify-center py-2"><Loader2 className="animate-spin text-emerald-500" size={16} /></div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-emerald-400 font-black text-2xl tracking-tighter">{userStats.progress}%</span>
                        <span className="text-white/20 text-[8px] font-black uppercase tracking-[0.1em]">{selectedUser.role} Level</span>
                      </div>
                      <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000" style={{ width: `${userStats.progress}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-white/[0.03] border border-white/5 rounded-sm relative overflow-hidden shadow-xl">
                <Heart size={32} className="absolute -right-1 -bottom-1 text-red-500 opacity-5" />
                <div className="relative z-10">
                  <p className="text-white/40 text-[8px] uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
                    <CreditCard size={10} className="text-red-400" /> Donation Impact
                  </p>
                  {statsLoading ? (
                    <div className="flex justify-center py-2"><Loader2 className="animate-spin text-emerald-500" size={16} /></div>
                  ) : (
                    <div>
                      <h4 className="text-white font-black text-2xl tracking-tight">{userStats.totalSadaka.toLocaleString()} <span className="text-[10px] font-medium opacity-40">BDT</span></h4>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Management Section - Compact */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              <div className="space-y-1.5">
                <p className="text-white/40 text-[8px] uppercase font-bold tracking-widest ml-1">Change Rank</p>
                <select
                  value={selectedUser.role}
                  onChange={(e) => handleUpdateRole(selectedUser.id, e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
                >
                  <option value="associate">Associate</option>
                  <option value="member">Member</option>
                  <option value="scholar">Scholar</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button
                onClick={() => deleteUser(selectedUser.id)}
                className="w-full py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-sm font-bold transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest mt-2"
              >
                <Trash2 size={14}/> Delete User
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
