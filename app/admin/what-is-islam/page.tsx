"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { Video, Plus, Trash2, ExternalLink, Play, GripVertical, Loader2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import AdminAlert from '@/components/AdminAlert';

interface IslamVideo {
  id: string;
  title: string;
  youtubeUrl: string;
  youtubeId: string;
  order?: number;
}

export default function AdminWhatIsIslam() {
  const [videos, setVideos] = useState<IslamVideo[]>([]);
  const [loading, setLoading] = useState(true);

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

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const q = query(collection(db, "whatIsIslamVideos"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as IslamVideo[];

      // Sort by order if available, otherwise by createdAt
      data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      setVideos(data);
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(videos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Optimistic UI update
    setVideos(items);

    // Save to Firestore
    try {
      const batch = writeBatch(db);
      items.forEach((video, index) => {
        const docRef = doc(db, "whatIsIslamVideos", video.id);
        batch.update(docRef, { order: index });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error updating order:", error);
      showAlert('error', 'ব্যর্থ হয়েছে', 'পজিশন সেভ করা সম্ভব হয়নি।');
      fetchVideos(); // Rollback
    }
  };

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = getYoutubeId(url);

    if (!videoId) {
      showAlert('error', 'ভুল লিঙ্ক', 'অনুগ্রহ করে একটি সঠিক ইউটিউব ভিডিও লিঙ্ক দিন।');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "whatIsIslamVideos"), {
        title,
        youtubeUrl: url,
        youtubeId: videoId,
        order: videos.length,
        createdAt: serverTimestamp()
      });
      setTitle("");
      setUrl("");
      fetchVideos();
      showAlert('success', 'সফল হয়েছে', 'ভিডিওটি সফলভাবে যোগ করা হয়েছে।');
    } catch (error) {
      console.error("Error adding video:", error);
      showAlert('error', 'ব্যর্থ হয়েছে', 'ভিডিও যোগ করা সম্ভব হয়নি।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    showAlert('confirm', 'নিশ্চিত করুন', 'আপনি কি নিশ্চিতভাবে এই ভিডিওটি ডিলিট করতে চান?', async () => {
      try {
        await deleteDoc(doc(db, "whatIsIslamVideos", id));
        fetchVideos();
        showAlert('success', 'সফল হয়েছে', 'ভিডিওটি ডিলিট করা হয়েছে।');
      } catch (error) {
        console.error("Error deleting video:", error);
        showAlert('error', 'ব্যর্থ হয়েছে', 'ভিডিও ডিলিট করা সম্ভব হয়নি।');
      }
    });
  };

  return (
    <div className="space-y-8">
      <AdminAlert
        {...alertConfig}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 font-bengali">ইসলাম কি? কেন? কিভাবে?</h2>
          <p className="text-white/40 text-sm">ভিডিও গ্যালারি ম্যানেজ করুন (Drag to Reorder)</p>
        </div>
        <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-xs font-medium">
          {videos.length} Videos
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add New Video Form - Left Side */}
        <div className="lg:col-span-1">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-xl sticky top-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Plus size={18} className="text-emerald-500" />
              নতুন ভিডিও
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-white/40 ml-1">ভিডিও শিরোনাম</label>
                <input
                  type="text"
                  placeholder="যেমন: ১ম পারা"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all font-bengali"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-white/40 ml-1">ইউটিউব লিঙ্ক</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20 mt-4 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                সেভ করুন
              </button>
            </form>
          </div>
        </div>

        {/* Draggable List - Right Side */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest">ভিডিও লিস্ট</h3>
            <p className="text-[10px] text-white/20 italic">Drag handles to change order</p>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="videos-list">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2.5"
                >
                  {loading ? (
                    <div className="py-20 text-center text-emerald-500 animate-pulse text-sm">লোড হচ্ছে...</div>
                  ) : videos.length === 0 ? (
                    <div className="py-20 text-center text-white/10 border-2 border-dashed border-white/5 rounded-2xl text-sm">
                      কোনো ভিডিও নেই
                    </div>
                  ) : (
                    videos.map((video, index) => (
                      <Draggable key={video.id} draggableId={video.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-4 bg-white/[0.03] border border-white/5 p-4 rounded-xl group transition-all ${
                              snapshot.isDragging ? 'bg-emerald-500/10 border-emerald-500/30 shadow-2xl scale-[1.02] z-50' : 'hover:border-white/10'
                            }`}
                          >
                            <div {...provided.dragHandleProps} className="text-white/10 group-hover:text-white/30 cursor-grab active:cursor-grabbing">
                              <GripVertical size={20} />
                            </div>

                            <div className="flex-1 flex items-center gap-4">
                              <span className="text-white/20 font-bold text-sm w-6">{index + 1}.</span>
                              <div className="flex-1">
                                <h4 className="text-white font-bold text-sm font-bengali">{video.title}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <a
                                    href={video.youtubeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-emerald-500/60 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                                  >
                                    <ExternalLink size={10} /> View on YouTube
                                  </a>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDelete(video.id)}
                              className="p-2 text-white/10 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
    </div>
  );
}
