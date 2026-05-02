"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
  deleteDoc
} from 'firebase/firestore';
import { Check, X, Trash2, Clock, User, Hash, Phone, Wallet } from 'lucide-react';
import AdminAlert from '@/components/AdminAlert';

interface SadakaRequest {
  id: string;
  status: string;
  amount: string | number;
  displayName: string;
  email: string;
  associateId: string | number;
  senderNumber: string;
  role?: string;
  createdAt: any;
}

export default function AdminSadakaInbox() {
  const [requests, setRequests] = useState<SadakaRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

  // Alert state
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'confirm' | 'info';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const showAlert = (type: 'success' | 'error' | 'confirm' | 'info', title: string, message: string, onConfirm?: () => void) => {
    setAlertConfig({ isOpen: true, type, title, message, onConfirm });
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const q = query(collection(db, "sadakaRequests"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as SadakaRequest[];
      setRequests(data);

      const total = data
        .filter(req => req.status === 'approved')
        .reduce((sum, req) => sum + (Number(req.amount) || 0), 0);
      setTotalAmount(total);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (id: string, status: 'approved' | 'declined') => {
    try {
      await updateDoc(doc(db, "sadakaRequests", id), { status });
      fetchRequests();
      showAlert('success', status === 'approved' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত', `সাদকা অনুরোধটি সফলভাবে ${status === 'approved' ? 'অ্যাপ্রুভ' : 'ডিক্লাইন'} করা হয়েছে।`);
    } catch (e) {
      console.error(e);
      showAlert('error', 'ব্যর্থ হয়েছে', 'স্ট্যাটাস আপডেট করা সম্ভব হয়নি।');
    }
  };

  const deleteRequest = async (id: string) => {
    showAlert('confirm', 'নিশ্চিত করুন', 'আপনি কি নিশ্চিতভাবে এই রেকর্ডটি মুছে ফেলতে চান?', async () => {
      try {
        await deleteDoc(doc(db, "sadakaRequests", id));
        fetchRequests();
        showAlert('success', 'সফল হয়েছে', 'রেকর্ডটি মুছে ফেলা হয়েছে।');
      } catch (e) {
        console.error(e);
        showAlert('error', 'ব্যর্থ হয়েছে', 'রেকর্ড মুছে ফেলা সম্ভব হয়নি।');
      }
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-emerald-500 animate-pulse font-bold">লোড হচ্ছে...</div>;
  }

  return (
    <div className="space-y-10">
      <AdminAlert
        {...alertConfig}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 font-bengali">সাদকা ইনবক্স</h2>
          <p className="text-white/40">Manage donation verification requests</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-emerald-900 p-6 rounded-xl shadow-xl border-t border-white/20 flex items-center gap-6 min-w-[280px]">
          <div className="w-14 h-14 bg-white/10 rounded-lg flex items-center justify-center text-white shadow-inner">
            <Wallet size={32} />
          </div>
          <div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Total Approved</p>
            <h3 className="text-3xl font-black text-white tracking-tight">
              {totalAmount.toLocaleString()} <span className="text-sm font-medium opacity-60">BDT</span>
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {requests.length === 0 ? (
          <div className="py-20 text-center text-white/10 border-2 border-dashed border-white/5 rounded-xl font-bengali">কোনো রিকোয়েস্ট নেই</div>
        ) : requests.map((req) => (
          <div
            key={req.id}
            className={`p-5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg ${
              req.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/30' :
              req.status === 'declined' ? 'bg-red-500/10 border-red-500/30' :
              'bg-white/[0.06] border-white/10'
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1">
              {/* 1. Name & Email */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-white/40 shadow-inner"><User size={20}/></div>
                <div className="min-w-0">
                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">User Details</p>
                  <h4 className="text-white font-bold text-sm truncate font-bengali">{req.displayName}</h4>
                  <p className="text-white/30 text-[10px] truncate">{req.email}</p>
                </div>
              </div>

              {/* 2. Sender Number & Amount */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-emerald-400/40 shadow-inner"><Phone size={20}/></div>
                <div className="min-w-0">
                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Payment</p>
                  <h4 className="text-emerald-400 font-mono text-sm font-bold truncate select-all">{req.senderNumber}</h4>
                  <p className="text-white font-black text-xs">Amount: {req.amount} BDT</p>
                </div>
              </div>

              {/* 3. Level & ID */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-[#d4af37]/40 shadow-inner"><Hash size={20}/></div>
                <div className="min-w-0">
                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Membership</p>
                  <h4 className="text-white font-black text-sm tracking-widest italic uppercase">{req.role || 'Associate'}</h4>
                  <p className="text-white/40 text-[10px]">ID: {req.associateId}</p>
                </div>
              </div>

              {/* 4. Status */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-inner ${
                  req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                  req.status === 'declined' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {req.status === 'approved' ? <Check size={20}/> : req.status === 'declined' ? <X size={20}/> : <Clock size={20}/>}
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Verification</p>
                  <h4 className={`text-sm font-bold uppercase tracking-widest ${
                    req.status === 'approved' ? 'text-emerald-400' :
                    req.status === 'declined' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>{req.status}</h4>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
              {req.status === 'pending' ? (
                <>
                  <button
                    onClick={() => handleStatus(req.id, 'approved')}
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-lg active:scale-95"
                    title="Approve"
                  >
                    <Check size={20} strokeWidth={3} />
                  </button>
                  <button
                    onClick={() => handleStatus(req.id, 'declined')}
                    className="p-2.5 bg-white/5 hover:bg-red-500 text-white/40 hover:text-white rounded-lg transition-all active:scale-95"
                    title="Decline"
                  >
                    <X size={20} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => deleteRequest(req.id)}
                  className="p-2.5 text-white/10 hover:text-red-500 transition-colors rounded-lg"
                  title="Delete Record"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
