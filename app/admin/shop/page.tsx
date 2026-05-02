"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Plus, Trash2, Package, Loader2, Image as ImageIcon, X, Link as LinkIcon } from 'lucide-react';
import AdminAlert from '@/components/AdminAlert';

export default function AdminShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

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

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const q = query(collection(db, "shopProducts"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return showAlert('error', 'অসম্পূর্ণ তথ্য', 'প্রোডাক্ট ইমেজের লিঙ্ক দিন।');

    setSaving(true);
    try {
      // Add to Firestore
      await addDoc(collection(db, "shopProducts"), {
        name,
        price,
        image: imageUrl,
        createdAt: new Date().toISOString()
      });

      // Reset
      setName('');
      setPrice('');
      setImageUrl('');
      setIsAdding(false);
      fetchProducts();
      showAlert('success', 'সফল হয়েছে', 'প্রোডাক্টটি সফলভাবে যোগ করা হয়েছে।');
    } catch (e) {
      console.error(e);
      showAlert('error', 'ব্যর্থ হয়েছে', 'প্রোডাক্ট যোগ করা সম্ভব হয়নি।');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    showAlert('confirm', 'নিশ্চিত করুন', 'আপনি কি নিশ্চিতভাবে এই প্রোডাক্টটি ডিলিট করতে চান?', async () => {
      try {
        await deleteDoc(doc(db, "shopProducts", id));
        fetchProducts();
        showAlert('success', 'সফল হয়েছে', 'প্রোডাক্টটি ডিলিট করা হয়েছে।');
      } catch (e) {
        console.error(e);
        showAlert('error', 'ব্যর্থ হয়েছে', 'প্রোডাক্টটি ডিলিট করা সম্ভব হয়নি।');
      }
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <AdminAlert
        {...alertConfig}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Package className="text-emerald-500" />
            শপ ম্যানেজমেন্ট
          </h1>
          <p className="text-white/40 text-sm mt-1 font-bengali">নতুন প্রোডাক্ট যোগ করুন অথবা আগের গুলো ম্যানেজ করুন</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-sm font-bold transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
        >
          <Plus size={20} />
          নতুন প্রোডাক্ট
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
          <div className="bg-[#0f172a] border border-white/10 w-full max-w-md rounded-sm p-8 shadow-2xl relative">
            <button onClick={() => setIsAdding(false)} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
              <X size={24} />
            </button>
            <h2 className="text-xl font-bold text-white mb-6 font-bengali">প্রোডাক্ট যোগ করুন</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-white/60 text-xs font-bold uppercase tracking-widest font-bengali">প্রোডাক্টের নাম</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-white/[0.03] border border-white/10 rounded-sm p-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all font-bengali"
                  placeholder="যেমন: তাজবীদ কুরআন"
                />
              </div>

              <div className="space-y-2">
                <label className="text-white/60 text-xs font-bold uppercase tracking-widest font-bengali">মূল্য (৳)</label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="w-full bg-white/[0.03] border border-white/10 rounded-sm p-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all font-bengali"
                  placeholder="যেমন: ৫০০"
                />
              </div>

              <div className="space-y-2">
                <label className="text-white/60 text-xs font-bold uppercase tracking-widest font-bengali">প্রোডাক্ট ইমেজ লিঙ্ক (URL)</label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    required
                    className="w-full bg-white/[0.03] border border-white/10 rounded-sm p-4 pl-12 text-white focus:outline-none focus:border-emerald-500/50 transition-all text-sm"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              {imageUrl && (
                <div className="space-y-2">
                  <label className="text-white/60 text-xs font-bold uppercase tracking-widest">Image Preview</label>
                  <div className="h-40 w-full border border-white/10 rounded-sm overflow-hidden bg-black/40">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL')} />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : "Save Product"}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-emerald-500" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white/[0.03] border border-white/5 rounded-sm overflow-hidden hover:border-white/10 transition-all group shadow-xl">
              <div className="aspect-[4/3] relative overflow-hidden bg-black/40">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <button
                  onClick={() => handleDelete(product.id)}
                  className="absolute top-4 right-4 p-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-sm backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="p-5">
                <h3 className="text-white font-bold font-bengali text-lg mb-1">{product.name}</h3>
                <p className="text-emerald-400 font-black text-xl font-bengali">৳ {product.price}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
