"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ShoppingBag, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export default function ShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const q = query(collection(db, "shopProducts"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Error fetching products:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#020617] text-slate-200 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* Topbar - Center Aligned */}
      <div className="w-full bg-slate-900/50 border-b border-white/5 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 relative flex items-center justify-center">
          <Link href="/" className="absolute left-6 p-2 hover:bg-white/5 rounded-full transition-colors">
            <ChevronLeft size={24} className="text-emerald-500" />
          </Link>

          <h1 className="text-xl md:text-2xl font-black font-bengali tracking-tight text-white flex items-center gap-2">
            <ShoppingBag size={24} className="text-emerald-500" />
            হুদা শপ
          </h1>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="relative">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
                <ShoppingBag className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500/50" size={20} />
            </div>
            <p className="text-slate-500 font-bengali animate-pulse">প্রোডাক্ট লোড হচ্ছে...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {products.map((product) => (
              <div key={product.id} className="group flex flex-col bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden hover:border-emerald-500/30 hover:bg-slate-900/60 transition-all duration-300 shadow-xl">
                {/* Image Container 1:1 */}
                <div className="aspect-square relative overflow-hidden bg-slate-950">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>

                {/* Content Area */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-white font-bold font-bengali text-sm md:text-base line-clamp-1 group-hover:text-emerald-400 transition-colors">
                    {product.name}
                  </h3>

                  <div className="mt-1 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-black text-lg md:text-xl font-bengali">৳{product.price}</span>
                    </div>

                    <Link
                      href={`/shop/checkout?id=${product.id}`}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl font-bold font-bengali text-sm transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                    >
                      <ShoppingBag size={16} />
                      কিনুন
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center mb-6 border border-white/5 rotate-12">
              <ShoppingBag size={48} className="text-slate-700 -rotate-12" />
            </div>
            <h3 className="text-2xl font-bold text-white font-bengali">কোনো প্রোডাক্ট পাওয়া যায়নি</h3>
            <p className="text-slate-500 mt-2 font-bengali max-w-xs mx-auto">দুঃখিত, বর্তমানে আমাদের সংগ্রহে কোনো প্রোডাক্ট নেই।</p>
          </div>
        )}
      </main>

      {/* Footer - Simplified */}
      <footer className="py-8 border-t border-white/5 bg-slate-950/50 mt-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <p className="text-slate-500 text-[11px] font-bengali opacity-50">© ২০২৪ হুদা ইউনিভার্সিটি - সর্বস্বত্ব সংরক্ষিত</p>
        </div>
      </footer>
    </div>
  );
}
