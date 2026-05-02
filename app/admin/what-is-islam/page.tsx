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
  serverTimestamp
} from 'firebase/firestore';
import { Video, Plus, Trash2, ExternalLink, Play } from 'lucide-react';
import AdminAlert from '@/components/AdminAlert';

interface IslamVideo {
  id: string;
  title: string;
  youtubeUrl: string;
  youtubeId: string;
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
      setVideos(data);
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
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
          <p className="text-white/40 text-sm">ভিডিও গ্যালারি ম্যানেজ করুন</p>
        </div>
        <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-xs font-medium">
          {videos.length} Videos
        </div>
      </div>

      {/* Add New Video Form - More compact */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Plus size={18} className="text-emerald-500" />
          নতুন ভিডিও
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="ভিডিওর শিরোনাম"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all font-bengali"
          />
          <input
            type="url"
            placeholder="ইউটিউব লিংক"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20"
          >
            {submitting ? "সেভ হচ্ছে..." : "ভিডিও যুক্ত করুন"}
          </button>
        </form>
      </div>

      {/* Video List - Smaller cards in more columns */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full py-10 text-center text-emerald-500 animate-pulse text-sm">লোড হচ্ছে...</div>
        ) : videos.length === 0 ? (
          <div className="col-span-full py-10 text-center text-white/20 border-2 border-dashed border-white/5 rounded-2xl text-sm">
            কোনো ভিডিও নেই
          </div>
        ) : (
          videos.map((video) => (
            <div key={video.id} className="group bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden hover:border-emerald-500/30 transition-all">
              <div className="aspect-video relative overflow-hidden bg-black">
                <img
                  src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                  alt={video.title}
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
                    <Play size={14} fill="currentColor" />
                  </div>
                </div>
              </div>
              <div className="p-3">
                <h4 className="text-white font-bold text-xs mb-2 font-bengali truncate" title={video.title}>{video.title}</h4>
                <div className="flex justify-end gap-1.5 border-t border-white/5 pt-2">
                  <a
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-md transition-all"
                  >
                    <ExternalLink size={14} />
                  </a>
                  <button
                    onClick={() => handleDelete(video.id)}
                    className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-md transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
