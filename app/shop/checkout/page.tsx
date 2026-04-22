"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ChevronLeft, ShoppingBag, Loader2, Plus, Minus, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get('id');

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return;
      try {
        const docRef = doc(db, "shopProducts", productId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [productId]);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setIsOrdering(true);
    try {
      const orderData = {
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        productPrice: product.price,
        quantity,
        totalPrice: Number(product.price) * quantity,
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "orders"), orderData);
      setOrderSuccess(true);
    } catch (e) {
      console.error(e);
      alert("অর্ডার করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={48} className="text-emerald-500" />
        </div>
        <h1 className="text-2xl font-black text-white font-bengali mb-2">অর্ডার সফল হয়েছে!</h1>
        <p className="text-slate-400 font-bengali mb-8">আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।</p>

        <Link href="/shop" className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold font-bengali transition-all">
          শপে ফিরে যান
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold text-white font-bengali mb-4">প্রোডাক্ট পাওয়া যায়নি</h1>
        <Link href="/shop" className="text-emerald-500 font-bold font-bengali">শপে ফিরে যান</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans pb-10">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-white/5 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ChevronLeft size={24} className="text-emerald-500" />
          </button>
          <h1 className="text-xl font-bold font-bengali text-white">চেকআউট</h1>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 gap-8">
          {/* Product Summary Card */}
          <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex gap-4 items-center">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-950 border border-white/5 flex-shrink-0">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold font-bengali text-lg truncate">{product.name}</h2>
              <p className="text-emerald-400 font-black text-xl font-bengali">৳{product.price}</p>

              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center bg-slate-950 border border-white/10 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-2 hover:bg-white/5 text-slate-400 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center font-bold text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="p-2 hover:bg-white/5 text-slate-400 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-white font-bengali mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
              আপনার তথ্য দিন
            </h3>

            <form onSubmit={handleOrder} className="space-y-6">
              <div className="space-y-2">
                <label className="text-slate-400 text-xs font-bold uppercase tracking-widest font-bengali ml-1">পুরো নাম</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: মোহাম্মদ আব্দুল্লাহ"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bengali"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 text-xs font-bold uppercase tracking-widest font-bengali ml-1">মোবাইল নম্বর</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="যেমন: 017XXXXXXXX"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bengali"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 text-xs font-bold uppercase tracking-widest font-bengali ml-1">বিস্তারিত ঠিকানা</label>
                <textarea
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  placeholder="আপনার গ্রাম/রাস্তা, উপজেলা এবং জেলার নাম লিখুন"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bengali resize-none"
                />
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-slate-400 font-bengali">মোট পরিশোধযোগ্য:</span>
                  <span className="text-2xl font-black text-white font-bengali">৳{Number(product.price) * quantity}</span>
                </div>

                <button
                  type="submit"
                  disabled={isOrdering}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-2xl font-black text-lg font-bengali transition-all shadow-xl shadow-emerald-900/30 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isOrdering ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <>
                      <ShoppingBag size={20} />
                      অর্ডার করুন
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
