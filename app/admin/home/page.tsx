"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, orderBy, updateDoc, writeBatch, serverTimestamp
} from 'firebase/firestore';
import { Plus, Trash2, Edit2, Save, Loader2, RefreshCw, Video, List, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import AdminAlert from '@/components/AdminAlert';

export default function AdminHomeManagement() {
  const [activeTab, setActiveTab] = useState<'buttons' | 'videos'>('buttons');
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [homeVideos, setHomeVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);

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

  // Button Form
  const [newTitle, setNewTitle] = useState("");
  const [newHref, setNewHref] = useState("");
  const [newType, setNewType] = useState<'link' | 'hierarchy'>('link');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editHref, setEditHref] = useState("");
  const [editType, setEditType] = useState<'link' | 'hierarchy'>('link');

  // Video Form
  const [newVTitle, setNewVTitle] = useState("");
  const [newVUrl, setNewVUrl] = useState("");
  const [newVDetails, setNewVDetails] = useState("");
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editVTitle, setEditVTitle] = useState("");
  const [editVUrl, setEditVUrl] = useState("");
  const [editVDetails, setEditVDetails] = useState("");

  const fetchMenu = useCallback(async () => {
    try {
      const q = query(collection(db, "homeMenu"), orderBy("order", "asc"));
      const snap = await getDocs(q);
      setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  }, []);

  const fetchVideos = useCallback(async () => {
    try {
      const q = query(collection(db, "homeVideos"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setHomeVideos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    setIsBrowser(true);
    setLoading(true);
    Promise.all([fetchMenu(), fetchVideos()]).then(() => setLoading(false));
  }, [fetchMenu, fetchVideos]);

  const setupInitialMenu = async () => {
    setSubmitting(true);
    const batch = writeBatch(db);
    const defaults = [
      { title: "আল কুরআন", href: "/quran", type: 'link' },
      { title: "মেম্বার হতে চাই", href: "/membership", type: 'link' },
      { title: "ইসলাম কি? কেন? কিভাবে?", href: "/what-is-islam", type: 'link' },
      { title: "সাফল্যের জন্য দক্ষতা", href: "/skills", type: 'link' },
      { title: "সকল সেবা", href: "/services", type: 'link' },
      { title: "কাউন্সিলিং প্রয়োজন", href: "/counseling", type: 'link' },
      { title: "প্রতি শুক্রবার স্মরণিকা অনলাইন লাইভ ক্লাস", href: "/live-class", type: 'link' },
      { title: "হুদা ইউনি এর লক্ষ্য-উদ্দেশ্য", href: "/goals", type: 'link' },
      { title: "সাদকা প্রদান", href: "/sadaka", type: 'link' },
    ];
    defaults.forEach((item, i) => {
      const ref = doc(collection(db, "homeMenu"));
      batch.set(ref, { ...item, order: i + 1 });
    });
    try {
      await batch.commit();
      fetchMenu();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleAddButton = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, "homeMenu"), {
        title: newTitle,
        href: "", // Placeholder
        type: newType,
        order: menuItems.length + 1
      });

      const finalHref = newType === 'link' ? newHref : `/explore/category/?id=${docRef.id}`;
      await updateDoc(docRef, { href: finalHref });

      setNewTitle(""); setNewHref(""); setNewType('link');
      fetchMenu();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleUpdateVideo = async (id: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = editVUrl.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : editVUrl; // Allow direct ID if not a full URL

    setSubmitting(true);
    try {
      await updateDoc(doc(db, "homeVideos", id), {
        title: editVTitle,
        youtubeId: videoId,
        details: editVDetails,
      });
      setEditingVideoId(null);
      fetchVideos();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(menuItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update local state for immediate feedback
    setMenuItems(items);

    // Update orders in Firestore
    setSubmitting(true);
    const batch = writeBatch(db);
    items.forEach((item, index) => {
      const ref = doc(db, "homeMenu", item.id);
      batch.update(ref, { order: index + 1 });
    });

    try {
      await batch.commit();
    } catch (e) {
      console.error("Order update failed:", e);
      fetchMenu(); // Revert to server state on error
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = newVUrl.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    if (!videoId) return showAlert('error', 'ভুল লিঙ্ক', 'অনুগ্রহ করে একটি সঠিক ইউটিউব লিঙ্ক দিন।');

    setSubmitting(true);
    try {
      await addDoc(collection(db, "homeVideos"), {
        title: newVTitle,
        youtubeId: videoId,
        details: newVDetails,
        createdAt: serverTimestamp()
      });
      setNewVTitle(""); setNewVUrl(""); setNewVDetails("");
      fetchVideos();
      showAlert('success', 'সফল হয়েছে', 'ভিডিওটি সফলভাবে যোগ করা হয়েছে।');
    } catch (error) {
      console.error(error);
      showAlert('error', 'ব্যর্থ হয়েছে', 'ভিডিও যোগ করা সম্ভব হয়নি।');
    }
    finally { setSubmitting(false); }
  };

  const handleUpdate = async (id: string) => {
    await updateDoc(doc(db, "homeMenu", id), {
      title: editTitle,
      href: editType === 'link' ? editHref : `/explore/category/?id=${id}`,
      type: editType
    });
    setEditingId(null);
    fetchMenu();
  };

  const handleDelete = async (col: string, id: string) => {
    showAlert('confirm', 'নিশ্চিত করুন', 'আপনি কি এই আইটেমটি ডিলিট করতে চান?', async () => {
      await deleteDoc(doc(db, col, id));
      if (col === "homeMenu") fetchMenu();
      else fetchVideos();
      showAlert('success', 'সফল হয়েছে', 'আইটেমটি ডিলিট করা হয়েছে।');
    });
  };

  if (loading) return <div className="p-10 text-emerald-500 animate-pulse font-bold">লোড হচ্ছে...</div>;

  return (
    <div className="space-y-10 pb-20">
      <AdminAlert
        {...alertConfig}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white font-bengali">হোম পেজ ম্যানেজমেন্ট</h2>
          <p className="text-white/40 text-sm">ড্যাশবোর্ডের মেনু এবং প্রোমো ভিডিও নিয়ন্ত্রণ করুন</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-sm border border-white/10">
          <button
            onClick={() => setActiveTab('buttons')}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold transition-all ${activeTab === 'buttons' ? 'bg-emerald-500 text-white' : 'text-white/40 hover:text-white'}`}
          >
            <List size={16} /> Buttons
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold transition-all ${activeTab === 'videos' ? 'bg-emerald-500 text-white' : 'text-white/40 hover:text-white'}`}
          >
            <Video size={16} /> Promo Videos
          </button>
        </div>
      </div>

      {activeTab === 'buttons' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1">
            <div className="bg-white/[0.03] border border-white/10 p-6 rounded-sm sticky top-24">
              <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                <Plus size={18} className="text-emerald-500" />
                নতুন মেনু বাটন
              </h3>
              <form onSubmit={handleAddButton} className="space-y-4">
                <div className="flex gap-2 p-1 bg-black/20 rounded-sm mb-2">
                  <button
                    type="button"
                    onClick={() => setNewType('link')}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-sm transition-all ${newType === 'link' ? 'bg-emerald-500 text-white' : 'text-white/40'}`}
                  >
                    লিংক সিস্টেম
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('hierarchy')}
                    className={`flex-1 py-2 text-[10px] font-bold rounded-sm transition-all ${newType === 'hierarchy' ? 'bg-emerald-500 text-white' : 'text-white/40'}`}
                  >
                    হায়ারার্কি সিস্টেম
                  </button>
                </div>

                <input type="text" placeholder="বাটনের নাম" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/50 font-bengali" />

                {newType === 'link' && (
                  <input type="text" placeholder="লিংক (যেমন: /quran)" value={newHref} onChange={(e) => setNewHref(e.target.value)} required className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/50" />
                )}

                {newType === 'hierarchy' && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-sm">
                    <p className="text-[10px] text-emerald-400 font-bold leading-tight">
                      এই বাটনে ক্লিক করলে একটি সাব-পেজ ওপেন হবে যেখানে আপনি আরও বাটন যোগ করতে পারবেন।
                    </p>
                  </div>
                )}

                <button disabled={submitting} className="w-full bg-emerald-600 py-3.5 rounded-sm font-bold text-white transition-all hover:bg-emerald-500 disabled:opacity-50">
                  {submitting ? "সেভ হচ্ছে..." : "বাটন যোগ করুন"}
                </button>
              </form>
              {menuItems.length === 0 && (
                <button onClick={setupInitialMenu} className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-emerald-400/40 hover:text-emerald-400 text-[10px] font-bold uppercase transition-all border border-emerald-500/10 rounded-sm"><RefreshCw size={12}/> Setup Initial Menu</button>
              )}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-2">
            <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-2 mb-4 flex items-center gap-2">
              <GripVertical size={14}/> Drag to Reorder
            </h4>

            {isBrowser && (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="menu-items">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {menuItems.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`bg-white/[0.02] border border-white/5 p-4 flex items-center justify-between rounded-sm group transition-all ${snapshot.isDragging ? 'border-emerald-500 bg-emerald-500/10 shadow-2xl z-50 scale-[1.02]' : 'hover:border-emerald-500/30'}`}
                            >
                              <div className="flex items-center gap-4 flex-1">
                                <div {...provided.dragHandleProps} className="text-white/10 hover:text-emerald-500 transition-colors cursor-grab active:cursor-grabbing p-1">
                                  <GripVertical size={20} />
                                </div>

                                {editingId === item.id ? (
                                  <div className="flex-1 space-y-2 mr-4">
                                    <div className="flex gap-2 p-1 bg-black/40 rounded-sm w-fit">
                                      <button type="button" onClick={() => setEditType('link')} className={`px-3 py-1 text-[9px] font-bold rounded-sm ${editType === 'link' ? 'bg-emerald-500 text-white' : 'text-white/40'}`}>Link</button>
                                      <button type="button" onClick={() => setEditType('hierarchy')} className={`px-3 py-1 text-[9px] font-bold rounded-sm ${editType === 'hierarchy' ? 'bg-emerald-500 text-white' : 'text-white/40'}`}>Hierarchy</button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <input className="bg-black/60 border border-emerald-500 rounded-sm px-3 py-1 text-white text-sm font-bengali w-full" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                                      {editType === 'link' ? (
                                        <input className="bg-black/60 border border-emerald-500 rounded-sm px-3 py-1 text-white text-sm w-full" value={editHref} onChange={(e) => setEditHref(e.target.value)} />
                                      ) : (
                                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-sm px-3 py-1 text-emerald-400 text-[10px] flex items-center">Sub-page System</div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-4">
                                    <div className="text-white/20 font-black italic text-xs w-4">{index + 1}</div>
                                    <div>
                                      <h4 className="text-white font-bold font-bengali">{item.title}</h4>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${item.type === 'hierarchy' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                          {item.type || 'link'}
                                        </span>
                                        {item.type === 'hierarchy' && (
                                          <Link href={`/admin/home/explore/?id=${item.id}`} className="text-[10px] text-white/40 hover:text-white underline font-bold">
                                            ম্যানেজ সাব-পেজ
                                          </Link>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-1 ml-4">
                                {editingId === item.id ? (
                                  <button onClick={() => handleUpdate(item.id)} className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-sm"><Save size={18}/></button>
                                ) : (
                                  <button onClick={() => { setEditingId(item.id); setEditTitle(item.title); setEditHref(item.href); setEditType(item.type || 'link'); }} className="p-2 text-white/20 hover:text-white rounded-sm"><Edit2 size={16}/></button>
                                )}
                                <button onClick={() => handleDelete("homeMenu", item.id)} className="p-2 text-red-500/20 hover:text-red-500 rounded-sm"><Trash2 size={16}/></button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1">
            <div className="bg-white/[0.03] border border-white/10 p-6 rounded-sm sticky top-24">
              <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                <Plus size={18} className="text-emerald-500" />
                নতুন প্রোমো ভিডিও
              </h3>
              <form onSubmit={handleAddVideo} className="space-y-4">
                <input type="text" placeholder="ভিডিও শিরোনাম" value={newVTitle} onChange={(e) => setNewVTitle(e.target.value)} required className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/50 font-bengali" />
                <input type="url" placeholder="ইউটিউব লিংক" value={newVUrl} onChange={(e) => setNewVUrl(e.target.value)} required className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/50" />
                <textarea
                  placeholder="বিস্তারিত বর্ণনা (Description)"
                  value={newVDetails}
                  onChange={(e) => setNewVDetails(e.target.value)}
                  rows={4}
                  className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/50 font-bengali resize-none"
                ></textarea>
                <button disabled={submitting} className="w-full bg-emerald-600 py-3.5 rounded-sm font-bold text-white transition-all hover:bg-emerald-500 disabled:opacity-50">
                  {submitting ? "সেভ হচ্ছে..." : "ভিডিও যোগ করুন"}
                </button>
              </form>
            </div>
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {homeVideos.map((video) => (
              <div key={video.id} className="bg-white/[0.02] border border-white/5 p-4 rounded-sm space-y-3 relative group">
                {editingVideoId === video.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editVTitle}
                      onChange={(e) => setEditVTitle(e.target.value)}
                      className="w-full bg-black/40 border border-emerald-500 rounded-sm px-3 py-2 text-white text-xs font-bengali"
                      placeholder="ভিডিও শিরোনাম"
                    />
                    <input
                      type="text"
                      value={editVUrl}
                      onChange={(e) => setEditVUrl(e.target.value)}
                      className="w-full bg-black/40 border border-emerald-500 rounded-sm px-3 py-2 text-white text-xs"
                      placeholder="ইউটিউব আইডি বা লিংক"
                    />
                    <textarea
                      value={editVDetails}
                      onChange={(e) => setEditVDetails(e.target.value)}
                      className="w-full bg-black/40 border border-emerald-500 rounded-sm px-3 py-2 text-white text-xs font-bengali resize-none"
                      placeholder="বিস্তারিত বিবরণ"
                      rows={3}
                    ></textarea>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateVideo(video.id)}
                        disabled={submitting}
                        className="flex-1 bg-emerald-600 py-2 rounded-sm text-[10px] font-bold text-white hover:bg-emerald-500"
                      >
                        {submitting ? "সেভ হচ্ছে..." : "আপডেট করুন"}
                      </button>
                      <button
                        onClick={() => setEditingVideoId(null)}
                        className="px-4 py-2 bg-white/5 text-white/40 rounded-sm text-[10px] font-bold hover:text-white"
                      >
                        বাতিল
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <img src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`} className="w-full aspect-video object-cover rounded-sm opacity-60 group-hover:opacity-100 transition-opacity" alt=""/>
                    <div className="flex justify-between items-center gap-2">
                      <h4 className="text-white font-bold text-xs font-bengali truncate flex-1">{video.title}</h4>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingVideoId(video.id);
                            setEditVTitle(video.title);
                            setEditVUrl(video.youtubeId);
                            setEditVDetails(video.details || "");
                          }}
                          className="p-1.5 text-white/20 hover:text-white transition-colors"
                        >
                          <Edit2 size={14}/>
                        </button>
                        <button onClick={() => handleDelete("homeVideos", video.id)} className="p-1.5 text-red-500/20 hover:text-red-500 transition-colors">
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
