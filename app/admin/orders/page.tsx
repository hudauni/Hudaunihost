"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Package, Loader2, Phone, MapPin, User, Calendar, Trash2, CheckCircle, Clock } from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", id), { status: newStatus });
      fetchOrders();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই অর্ডারটি ডিলিট করতে চান?")) return;
    try {
      await deleteDoc(doc(db, "orders", id));
      fetchOrders();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Package className="text-emerald-500" />
          অর্ডার ম্যানেজমেন্ট
        </h1>
        <p className="text-white/40 text-sm mt-1 font-bengali">গ্রাহকদের সকল অর্ডার এখানে দেখুন এবং স্ট্যাটাস আপডেট করুন</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-emerald-500" size={40} />
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all">
              <div className="p-6 flex flex-col md:flex-row gap-6">
                {/* Product Info */}
                <div className="flex gap-4 md:w-1/3">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/40 flex-shrink-0 border border-white/5">
                    <img src={order.productImage} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold font-bengali line-clamp-1">{order.productName}</h3>
                    <p className="text-emerald-400 font-bold">৳{order.productPrice} x {order.quantity}</p>
                    <p className="text-white font-black text-lg mt-1 font-bengali">মোট: ৳{order.totalPrice}</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 border-l border-white/5 pl-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <User size={14} className="text-emerald-500" />
                      <span className="font-bengali">{order.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Phone size={14} className="text-emerald-500" />
                      <span>{order.customerPhone}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-slate-400 text-sm">
                      <MapPin size={14} className="text-emerald-500 mt-1 flex-shrink-0" />
                      <span className="font-bengali line-clamp-2">{order.customerAddress}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      <Calendar size={12} />
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('bn-BD') : 'Loading...'}
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex flex-col justify-between items-end gap-4 min-w-[150px]">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold font-bengali ${
                    order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {order.status === 'completed' ? 'অর্ডার সম্পন্ন' : 'অপেক্ষমান'}
                  </span>

                  <div className="flex items-center gap-2">
                    {order.status !== 'completed' && (
                      <button
                        onClick={() => updateStatus(order.id, 'completed')}
                        className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
                        title="Mark as Completed"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-colors"
                      title="Delete Order"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
          <Clock size={64} className="mb-4" />
          <h3 className="text-xl font-bold font-bengali">এখনও কোনো অর্ডার আসেনি</h3>
        </div>
      )}
    </div>
  );
}
