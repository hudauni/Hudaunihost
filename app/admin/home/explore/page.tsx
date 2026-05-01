"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { db } from '@/lib/firebase';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, orderBy, updateDoc, where, getDoc, serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Trash2, Edit2, Save, ArrowLeft, Loader2, PlayCircle, Info, Zap, Video, Layout } from 'lucide-react';
import Link from 'next/link';

function AdminExploreContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();

  const [parentButton, setParentButton] = useState<any>(null);
  const [subButtons, setSubButtons] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State for Buttons
  const [newTitle, setNewTitle] = useState("");

  // Service Management State
  const [selectedButtonId, setSelectedButtonId] = useState<string | null>(null);
  const [isAddingService, setIsAddingService] = useState(false);

  // New Service Form
  const [sTitle, setSTitle] = useState("");
  const [sVideo, setSVideo] = useState("");
  const [sDetails, setSDetails] = useState("");
  const [sEnrollText, setSEnrollText] = useState("Enroll Now");
  const [sEnrollUrl, setSEnrollUrl] = useState("");

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const pDoc = await getDoc(doc(db, "homeMenu", id));
      if (pDoc.exists()) setParentButton(pDoc.data());

      const q = query(collection(db, "exploreMenu"), where("parentId", "==", id));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setSubButtons(list);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [id]);

  // Listen for services when a button is selected
  useEffect(() => {
    if (!selectedButtonId) {
      setServices([]);
      return;
    }

    const q = query(collection(db, "exploreMenu", selectedButtonId, "services"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsubscribe();
  }, [selectedButtonId]);

  useEffect(() => { if (id) fetchData(); }, [id, fetchData]);

  const handleAddSubButton = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    try {
      const buttonRef = await addDoc(collection(db, "exploreMenu"), {
        title: newTitle,
        parentId: id,
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, "exploreMenu", buttonRef.id), {
        href: `/explore/content/?id=${buttonRef.id}`
      });
      setNewTitle("");
      fetchData();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedButtonId) return;

    // Extract Video ID
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = sVideo.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : sVideo;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "exploreMenu", selectedButtonId, "services"), {
        title: sTitle,
        youtubeId: videoId,
        details: sDetails,
        enrollText: sEnrollText,
        enrollUrl: sEnrollUrl,
        createdAt: serverTimestamp()
      });
      setSTitle(""); setSVideo(""); setSDetails("");
      setSEnrollText("Enroll Now"); setSEnrollUrl("");
      setIsAddingService(false);
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleDeleteService = async (sId: string) => {
    if (!confirm("Are you sure?")) return;
    await deleteDoc(doc(db, "exploreMenu", selectedButtonId!, "services", sId));
  };

  const handleDeleteSub = async (subId: string) => {
    if (!confirm("Delete this button and all its contents?")) return;
    await deleteDoc(doc(db, "exploreMenu", subId));
    if (selectedButtonId === subId) setSelectedButtonId(null);
    fetchData();
  };

  if (loading) return <div className="p-20 text-emerald-500 animate-pulse font-bold">লোড হচ্ছে...</div>;

  return (
    <div className="space-y-10 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/admin/home">
          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all">
            <ArrowLeft size={20} />
          </button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-white font-bengali">{parentButton?.title} - সাব পেজ</h2>
          <p className="text-white/40 text-sm">বাটন এবং সার্ভিস কার্ড ম্যানেজ করুন</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Column 1: Sub Buttons */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/[0.03] border border-white/10 p-6 rounded-sm">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
              <Plus size={18} className="text-emerald-500" />
              নতুন বাটন যোগ করুন
            </h3>
            <form onSubmit={handleAddSubButton} className="space-y-4">
              <input type="text" placeholder="বাটনের নাম" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/50 font-bengali" />
              <button disabled={submitting} className="w-full bg-emerald-600 py-3.5 rounded-sm font-bold text-white transition-all hover:bg-emerald-500 disabled:opacity-50">
                বাটন যোগ করুন
              </button>
            </form>
          </div>

          <div className="space-y-2">
            <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-2">বর্তমান বাটনসমূহ</h4>
            {subButtons.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedButtonId(item.id)}
                className={`bg-white/[0.02] border p-4 flex items-center justify-between rounded-sm cursor-pointer transition-all ${selectedButtonId === item.id ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/5 hover:border-emerald-500/30'}`}
              >
                <div>
                  <h4 className="text-white font-bold font-bengali">{item.title}</h4>
                  <p className="text-[10px] text-white/20">আইডি: {item.id}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteSub(item.id); }} className="p-2 text-red-500/20 hover:text-red-500"><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2 & 3: Service Cards Management */}
        <div className="lg:col-span-2 space-y-6">
          {selectedButtonId ? (
            <div className="bg-white/[0.03] border border-white/10 p-8 rounded-sm min-h-[500px]">
              <div className="flex justify-between items-center border-b border-white/5 pb-6 mb-8">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                   <Layout size={20} className="text-emerald-400" />
                   সার্ভিস কার্ড লিস্ট (কন্টেন্ট)
                </h3>
                <button
                  onClick={() => setIsAddingService(!isAddingService)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-sm text-xs font-bold flex items-center gap-2 transition-all"
                >
                  <Plus size={16} /> নতুন সার্ভিস যোগ করুন
                </button>
              </div>

              {isAddingService && (
                <form onSubmit={handleAddService} className="bg-white/5 border border-emerald-500/30 p-6 rounded-sm mb-10 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                   <div className="flex justify-between items-center mb-2">
                     <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">New Service / Card Information</p>
                     <button type="button" onClick={() => setIsAddingService(false)} className="text-white/20 hover:text-white"><Plus size={16} className="rotate-45" /></button>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[9px] text-white/40 uppercase font-bold">Service Title</p>
                        <input type="text" placeholder="Title" value={sTitle} onChange={(e) => setSTitle(e.target.value)} required className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500/50 font-bengali" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] text-white/40 uppercase font-bold">YouTube Link / ID</p>
                        <input type="text" placeholder="Link or ID" value={sVideo} onChange={(e) => setSVideo(e.target.value)} required className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500/50" />
                      </div>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] text-white/40 uppercase font-bold">Description</p>
                      <textarea placeholder="Service Details..." rows={4} value={sDetails} onChange={(e) => setSDetails(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500/50 font-bengali resize-none"></textarea>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[9px] text-white/40 uppercase font-bold">Enroll Button Text</p>
                        <input type="text" placeholder="Enroll Now" value={sEnrollText} onChange={(e) => setSEnrollText(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500/50" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] text-white/40 uppercase font-bold">Custom Enroll Link (Optional)</p>
                        <input type="text" placeholder="Leave empty for default" value={sEnrollUrl} onChange={(e) => setSEnrollUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500/50" />
                      </div>
                   </div>
                   <button disabled={submitting} className="w-full bg-emerald-600 py-3 rounded-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
                      {submitting ? "সেভ হচ্ছে..." : "সার্ভিস সেভ করুন"}
                   </button>
                </form>
              )}

              <div className="space-y-4">
                {services.map((s, idx) => (
                  <div key={s.id} className="bg-black/40 border border-white/5 p-5 rounded-sm flex gap-6 group hover:border-emerald-500/30 transition-all">
                    <div className="w-40 aspect-video bg-black rounded-sm overflow-hidden shrink-0 relative">
                       <img src={`https://img.youtube.com/vi/${s.youtubeId}/mqdefault.jpg`} className="w-full h-full object-cover opacity-60" alt=""/>
                       <div className="absolute inset-0 flex items-center justify-center text-white/40"><Video size={20} /></div>
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className="text-white font-bold text-lg font-bengali mb-1">{s.title}</h4>
                       <p className="text-white/40 text-xs font-bengali line-clamp-2">{s.details}</p>
                    </div>
                    <button onClick={() => handleDeleteService(s.id)} className="p-2 text-red-500/20 hover:text-red-500 self-start transition-all"><Trash2 size={18}/></button>
                  </div>
                ))}

                {services.length === 0 && !isAddingService && (
                  <div className="py-20 text-center text-white/10 italic">No services added to this button yet.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] border-2 border-dashed border-white/5 rounded-sm flex flex-col items-center justify-center text-center p-10">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/20 mb-4">
                <Layout size={30} />
              </div>
              <h3 className="text-white font-bold mb-2">বাটন সিলেক্ট করুন</h3>
              <p className="text-white/20 text-sm max-w-xs">বাম পাশের লিস্ট থেকে একটি বাটন সিলেক্ট করে তার আন্ডারে সার্ভিস কার্ড ম্যানেজ করুন।</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminExplorePage() {
  return (
    <Suspense fallback={<div className="p-20 text-emerald-500 animate-pulse font-bold">লোড হচ্ছে...</div>}>
      <AdminExploreContent />
    </Suspense>
  );
}
