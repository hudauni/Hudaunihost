"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Settings, Save, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function AdminSettings() {
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, "settings", "general");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLogoUrl(docSnap.data().logoUrl || "");
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "general"), {
        logoUrl: logoUrl
      }, { merge: true });
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2 font-bengali">সেটিংস</h2>
        <p className="text-white/40">Manage your website configuration</p>
      </div>

      <div className="max-w-2xl bg-white/[0.03] border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <ImageIcon size={20} className="text-emerald-500" />
              লোগো সেটিংস
            </h3>

            <div className="space-y-2">
              <label className="text-sm text-white/60 ml-1">লোগো ইমেজ লিংক (URL)</label>
              <input
                type="url"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>

            {logoUrl && (
              <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center">
                <p className="text-white/40 text-xs mb-3 uppercase tracking-widest font-bold">Logo Preview</p>
                <img
                  src={logoUrl}
                  alt="Logo Preview"
                  className="max-h-20 object-contain drop-shadow-lg"
                  onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Invalid+Image+URL')}
                />
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {saving ? "সংরক্ষণ হচ্ছে..." : "সেভ করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
