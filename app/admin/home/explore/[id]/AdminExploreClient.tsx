"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, orderBy, updateDoc, where, getDoc, serverTimestamp
} from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Trash2, Edit2, Save, ArrowLeft, Loader2, PlayCircle, Info, Zap } from 'lucide-react';
import Link from 'next/link';

export default function AdminExploreClient() {
  const { id } = useParams();
  const router = useRouter();

  const [parentButton, setParentButton] = useState<any>(null);
  const [subButtons, setSubButtons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Content Edit State (Level 3)
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [contentId, setContentId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videos, setVideos] = useState<{title: string, youtubeId: string, details: string}[]>([{title: '', youtubeId: '', details: ''}]);
  const [details, setDetails] = useState("");
  const [enrollText, setEnrollText] = useState("Enroll Now");
  const [enrollUrl, setEnrollUrl] = useState("");

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      // Get parent info
      const pDoc = await getDoc(doc(db, "homeMenu", id as string));
      if (pDoc.exists()) setParentButton(pDoc.data());

      // Get sub buttons
      const q = query(
        collection(db, "exploreMenu"),
        where("parentId", "==", id)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Client-side sorting to avoid manual index creation
      list.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeA - timeB;
      });

      setSubButtons(list);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSubButton = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // 1. Create sub button in exploreMenu
      const buttonRef = await addDoc(collection(db, "exploreMenu"), {
        title: newTitle,
        parentId: id,
        createdAt: serverTimestamp()
      });

      // 2. Create corresponding content doc in exploreContent
      await updateDoc(doc(db, "exploreMenu", buttonRef.id), {
        contentId: buttonRef.id // Mapping 1:1 for simplicity
      });

      await updateDoc(doc(db, "exploreMenu", buttonRef.id), {
        href: `/explore/content/${buttonRef.id}`
      });

      setNewTitle("");
      fetchData();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleEditContent = (item: any) => {
    setContentId(item.id);
    setVideoTitle(item.videoTitle || item.title);

    if (item.videos && Array.isArray(item.videos)) {
      setVideos(item.videos.map((v: any) => ({
        title: v.title || '',
        youtubeId: v.youtubeId || '',
        details: v.details || ''
      })));
    } else if (item.youtubeId) {
      setVideos([{ title: item.videoTitle || item.title, youtubeId: item.youtubeId, details: item.details || '' }]);
    } else {
      setVideos([{ title: '', youtubeId: '', details: '' }]);
    }

    setDetails(item.details || ""); // Fallback details
    setEnrollText(item.enrollText || "Enroll Now");
    setEnrollUrl(item.enrollUrl || "");
    setIsEditingContent(true);
  };

  const handleAddVideoField = () => {
    setVideos([...videos, { title: '', youtubeId: '', details: '' }]);
  };

  const handleRemoveVideoField = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index));
  };

  const handleVideoChange = (index: number, field: string, value: string) => {
    const updated = [...videos];
    if (field === 'youtubeId') {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = value.match(regExp);
      const videoId = (match && match[2].length === 11) ? match[2] : value;
      updated[index] = { ...updated[index], youtubeId: videoId };
    } else if (field === 'title') {
      updated[index] = { ...updated[index], title: value };
    } else if (field === 'details') {
      updated[index] = { ...updated[index], details: value };
    }
    setVideos(updated);
  };

  const handleSaveContent = async () => {
    if (!contentId) return;
    setSubmitting(true);

    try {
      await updateDoc(doc(db, "exploreMenu", contentId), {
        videoTitle,
        videos: videos.filter(v => v.youtubeId), // Save only valid videos
        details,
        enrollText,
        enrollUrl,
        updatedAt: serverTimestamp()
      });
      setIsEditingContent(false);
      setContentId(null);
      fetchData();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleDeleteSub = async (subId: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await deleteDoc(doc(db, "exploreMenu", subId));
      fetchData();
    } catch (e) { console.error(e); }
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
          <p className="text-white/40 text-sm">এই পেজের বাটনগুলো ম্যানেজ করুন</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Button List & Add Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/[0.03] border border-white/10 p-6 rounded-sm">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
              <Plus size={18} className="text-emerald-500" />
              নতুন বাটন যোগ করুন
            </h3>
            <form onSubmit={handleAddSubButton} className="space-y-4">
              <input
                type="text"
                placeholder="বাটনের নাম"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/50 font-bengali"
              />
              <button disabled={submitting} className="w-full bg-emerald-600 py-3.5 rounded-sm font-bold text-white transition-all hover:bg-emerald-500 disabled:opacity-50">
                {submitting ? "সেভ হচ্ছে..." : "বাটন যোগ করুন"}
              </button>
            </form>
          </div>

          <div className="space-y-2">
            <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-2">বর্তমান বাটনসমূহ</h4>
            {subButtons.map((item) => (
              <div key={item.id} className={`bg-white/[0.02] border p-4 flex items-center justify-between rounded-sm group transition-all ${contentId === item.id ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/5 hover:border-emerald-500/30'}`}>
                <div>
                  <h4 className="text-white font-bold font-bengali">{item.title}</h4>
                  <p className="text-[10px] text-white/20">ID: {item.id}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEditContent(item)} className="p-2 text-white/20 hover:text-emerald-400 rounded-sm"><Edit2 size={16}/></button>
                  <button onClick={() => handleDeleteSub(item.id)} className="p-2 text-red-500/20 hover:text-red-500 rounded-sm"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Editor (Level 3) */}
        <div className="lg:col-span-2">
          {isEditingContent ? (
            <div className="bg-white/[0.03] border border-white/10 p-8 rounded-sm space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-center border-b border-white/5 pb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Edit2 size={20} className="text-emerald-400" />
                  কন্টেন্ট এডিট: {videoTitle}
                </h3>
                <button onClick={() => setIsEditingContent(false)} className="text-white/20 hover:text-white">বন্ধ করুন</button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                    <PlayCircle size={12} /> ভিডিওসমূহ (Multiple Videos)
                  </label>
                  <button
                    onClick={handleAddVideoField}
                    className="text-emerald-400 hover:text-emerald-300 text-[10px] font-bold uppercase border border-emerald-500/20 px-2 py-1 rounded"
                  >
                    + ভিডিও যোগ করুন
                  </button>
                </div>

                <div className="space-y-4">
                  {videos.map((v, idx) => (
                    <div key={idx} className="bg-black/20 p-4 rounded-sm border border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] text-emerald-500 font-bold uppercase">Card / Module #{idx + 1}</p>
                        <button
                          onClick={() => handleRemoveVideoField(idx)}
                          className="p-1 text-red-500/40 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-[9px] text-white/20 font-bold uppercase">Title</p>
                          <input
                            type="text"
                            value={v.title}
                            placeholder="Card Title"
                            onChange={(e) => handleVideoChange(idx, 'title', e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-emerald-500/50 font-bengali"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] text-white/20 font-bold uppercase">YouTube Link/ID</p>
                          <input
                            type="text"
                            value={v.youtubeId}
                            placeholder="YouTube ID"
                            onChange={(e) => handleVideoChange(idx, 'youtubeId', e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-emerald-500/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[9px] text-white/20 font-bold uppercase">Description</p>
                        <textarea
                          value={v.details}
                          placeholder="Short description for this card..."
                          rows={2}
                          onChange={(e) => handleVideoChange(idx, 'details', e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-emerald-500/50 font-bengali resize-none"
                        ></textarea>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest">ডিটেইলস (বিস্তারিত বর্ণনা)</label>
                <textarea
                  rows={6}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/50 font-bengali resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                    <Zap size={12} /> এনরোল বাটন টেক্সট
                  </label>
                  <input
                    type="text"
                    value={enrollText}
                    onChange={(e) => setEnrollText(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest">এনরোল বাটন লিংক (URL)</label>
                  <input
                    type="text"
                    value={enrollUrl}
                    onChange={(e) => setEnrollUrl(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveContent}
                disabled={submitting}
                className="w-full bg-emerald-600 py-4 rounded-sm font-bold text-white transition-all hover:bg-emerald-500 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                কন্টেন্ট সেভ করুন
              </button>
            </div>
          ) : (
            <div className="h-full min-h-[400px] border-2 border-dashed border-white/5 rounded-sm flex flex-col items-center justify-center text-center p-10">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/20 mb-4">
                <Edit2 size={30} />
              </div>
              <h3 className="text-white font-bold mb-2">এডিট করার জন্য বাটন সিলেক্ট করুন</h3>
              <p className="text-white/20 text-sm max-w-xs">বাম পাশের লিস্ট থেকে কোনো বাটনের এডিট আইকনে ক্লিক করে তার ভেতরের ভিডিও এবং ডিটেইলস সেট করুন।</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
