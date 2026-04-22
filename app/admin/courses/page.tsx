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
  updateDoc
} from 'firebase/firestore';
import { Video, Plus, Trash2, Edit2, X, Save, Play, Info } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  youtubeId: string;
  price: number;
  details: string;
}

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [price, setPrice] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const q = query(collection(db, "courses"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[];
      setCourses(data);
    } catch (error) {
      console.error("Error fetching courses:", error);
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
      alert("Invalid YouTube URL");
      return;
    }

    setSubmitting(true);
    try {
      const courseData = {
        title,
        youtubeId: videoId,
        youtubeUrl: url,
        price: Number(price),
        details,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, "courses", editingId), courseData);
      } else {
        await addDoc(collection(db, "courses"), {
          ...courseData,
          createdAt: serverTimestamp()
        });
      }

      closeModal();
      fetchCourses();
    } catch (error) {
      console.error("Error saving course:", error);
      alert("Failed to save course");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      await deleteDoc(doc(db, "courses", id));
      fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  const openModal = (course?: Course) => {
    if (course) {
      setEditingId(course.id);
      setTitle(course.title);
      setUrl(`https://www.youtube.com/watch?v=${course.youtubeId}`);
      setPrice(course.price.toString());
      setDetails(course.details);
    } else {
      setEditingId(null);
      setTitle("");
      setUrl("");
      setPrice("");
      setDetails("");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 font-bengali">কোর্সসমূহ</h2>
          <p className="text-white/40 text-sm">সকল কোর্স ম্যানেজ করুন</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-600/20 font-bold"
        >
          <Plus size={18} />
          নতুন কোর্স
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-10 text-center text-emerald-500 animate-pulse">লোড হচ্ছে...</div>
        ) : courses.length === 0 ? (
          <div className="col-span-full py-20 text-center text-white/20 border-2 border-dashed border-white/5 rounded-3xl">
            কোনো কোর্স পাওয়া যায়নি
          </div>
        ) : (
          courses.map((course) => (
            <div key={course.id} className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden flex flex-col group">
              <div className="aspect-video relative overflow-hidden bg-black">
                <img
                  src={`https://img.youtube.com/vi/${course.youtubeId}/mqdefault.jpg`}
                  alt={course.title}
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play size={40} className="text-white/40" />
                </div>
                <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg">
                  ৳{course.price}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-white font-bold text-lg mb-2 font-bengali">{course.title}</h3>
                <p className="text-white/40 text-sm font-bengali line-clamp-2 mb-4 flex-1">{course.details}</p>
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(course)}
                      className="p-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={closeModal}></div>
          <div className="relative w-full max-w-2xl bg-[#002b2b] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white font-bengali">
                {editingId ? "কোর্স এডিট করুন" : "নতুন কোর্স যোগ করুন"}
              </h3>
              <button onClick={closeModal} className="text-white/40 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-white/60 text-xs font-bold uppercase tracking-widest ml-1 font-bengali">কোর্স শিরোনাম</label>
                <input
                  type="text"
                  placeholder="যেমন: আরবী ভাষা শিক্ষা"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-all font-bengali"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-white/60 text-xs font-bold uppercase tracking-widest ml-1 font-bengali">ইউটিউব ভিডিও লিংক</label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-white/60 text-xs font-bold uppercase tracking-widest ml-1 font-bengali">কোর্স ফি (টাকা)</label>
                  <input
                    type="number"
                    placeholder="৫০০"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-white/60 text-xs font-bold uppercase tracking-widest ml-1 font-bengali">বিস্তারিত বর্ণনা</label>
                <textarea
                  placeholder="কোর্স সম্পর্কে বিস্তারিত লিখুন..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  required
                  rows={5}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-all font-bengali resize-none"
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                {submitting ? "সেভ হচ্ছে..." : (
                  <>
                    <Save size={20} />
                    {editingId ? "আপডেট করুন" : "কোর্সটি যোগ করুন"}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
