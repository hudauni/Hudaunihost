"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { Plus, Trash2, Edit, Save, X, PlayCircle, Users, Search, CheckCircle, Loader2 } from 'lucide-react';

interface ClassItem {
  title: string;
  youtubeId: string;
}

interface PaidCourse {
  id: string;
  title: string;
  classes: ClassItem[];
  createdAt: any;
}

export default function PaidCoursesAdmin() {
  const [courses, setCourses] = useState<PaidCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // New Course State
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newClasses, setNewClasses] = useState<ClassItem[]>([{ title: '', youtubeId: '' }]);

  // Access Management State
  const [searchQuery, setSearchQuery] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    try {
      const q = query(collection(db, "paidCourses"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaidCourse));
      setCourses(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleAddClassField = () => {
    setNewClasses([...newClasses, { title: '', youtubeId: '' }]);
  };

  const handleClassChange = (index: number, field: keyof ClassItem, value: string) => {
    const updated = [...newClasses];
    updated[index][field] = value;
    setNewClasses(updated);
  };

  const handleRemoveClassField = (index: number) => {
    setNewClasses(newClasses.filter((_, i) => i !== index));
  };

  const handleSaveCourse = async () => {
    if (!newCourseTitle || newClasses.some(c => !c.title || !c.youtubeId)) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "paidCourses"), {
        title: newCourseTitle,
        classes: newClasses,
        createdAt: serverTimestamp()
      });
      setIsAdding(false);
      setNewCourseTitle('');
      setNewClasses([{ title: '', youtubeId: '' }]);
      fetchCourses();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await deleteDoc(doc(db, "paidCourses", id));
      fetchCourses();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchUser = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    setFoundUser(null);
    try {
      // Search by Associate ID or Email
      const q = query(collection(db, "users"), where("associateId", "==", searchQuery));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setFoundUser({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        // Try searching by email
        const qEmail = query(collection(db, "users"), where("email", "==", searchQuery));
        const snapEmail = await getDocs(qEmail);
        if (!snapEmail.empty) {
          setFoundUser({ id: snapEmail.docs[0].id, ...snapEmail.docs[0].data() });
        } else {
          alert("User not found");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGrantAccess = async () => {
    if (!foundUser || !selectedCourseId) return;
    try {
      // Check if already has access
      const q = query(
        collection(db, "userPaidCourses"),
        where("userId", "==", foundUser.id),
        where("courseId", "==", selectedCourseId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        alert("User already has access to this course");
        return;
      }

      await setDoc(doc(db, "userPaidCourses", `${foundUser.id}_${selectedCourseId}`), {
        userId: foundUser.id,
        courseId: selectedCourseId,
        grantedAt: serverTimestamp()
      });
      alert("Access granted successfully!");
      setFoundUser(null);
      setSearchQuery('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white font-bengali">পেইড কোর্স ম্যানেজমেন্ট</h1>
          <p className="text-white/60">এখানে নতুন পেইড কোর্স তৈরি করুন এবং স্টুডেন্টদের এক্সেস দিন।</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-bold transition-all"
        >
          {isAdding ? <X size={20} /> : <Plus size={20} />}
          {isAdding ? 'বাতিল' : 'নতুন কোর্স'}
        </button>
      </div>

      {/* Grant Access Section */}
      <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 font-bengali">
          <Users size={20} className="text-emerald-400" /> স্টুডেন্টকে এক্সেস দিন
        </h2>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Associate ID অথবা Email দিয়ে সার্চ করুন"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <button
            onClick={handleSearchUser}
            disabled={isSearching}
            className="bg-white text-black px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-white/90 disabled:opacity-50"
          >
            {isSearching ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
            সার্চ
          </button>
        </div>

        {foundUser && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {foundUser.displayName?.charAt(0)}
              </div>
              <div>
                <p className="text-white font-bold">{foundUser.displayName}</p>
                <p className="text-white/40 text-sm">{foundUser.email} | ID: {foundUser.associateId}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-lg px-4 py-2 text-white outline-none"
              >
                <option value="">কোর্স সিলেক্ট করুন</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <button
                onClick={handleGrantAccess}
                className="bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-600 transition-all"
              >
                এক্সেস দিন
              </button>
            </div>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="bg-white/5 p-8 rounded-2xl border border-white/10 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="space-y-2">
            <label className="text-white/60 text-sm font-bold uppercase tracking-widest">কোর্স টাইটেল</label>
            <input
              type="text"
              placeholder="কোর্সের নাম দিন"
              value={newCourseTitle}
              onChange={(e) => setNewCourseTitle(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-6 py-4 text-white text-xl font-bold focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-white/60 text-sm font-bold uppercase tracking-widest">ক্লাস সমূহ</label>
              <button
                onClick={handleAddClassField}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-sm font-bold"
              >
                <Plus size={16} /> ক্লাস যোগ করুন
              </button>
            </div>

            {newClasses.map((cls, idx) => (
              <div key={idx} className="flex gap-4 items-end bg-black/20 p-4 rounded-xl border border-white/5">
                <div className="flex-[2] space-y-2">
                  <p className="text-white/40 text-[10px] uppercase font-bold">Class Title</p>
                  <input
                    type="text"
                    placeholder={`Class ${idx + 1} Title`}
                    value={cls.title}
                    onChange={(e) => handleClassChange(idx, 'title', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-emerald-500/30"
                  />
                </div>
                <div className="flex-[1] space-y-2">
                  <p className="text-white/40 text-[10px] uppercase font-bold">YouTube Video ID</p>
                  <input
                    type="text"
                    placeholder="e.g. dQw4w9WgXcQ"
                    value={cls.youtubeId}
                    onChange={(e) => handleClassChange(idx, 'youtubeId', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-emerald-500/30"
                  />
                </div>
                <button
                  onClick={() => handleRemoveClassField(idx)}
                  className="p-3 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveCourse}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
            কোর্স সেভ করুন
          </button>
        </div>
      )}

      {/* Courses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                  <PlayCircle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-bengali">{course.title}</h3>
                  <p className="text-white/40 text-sm">{course.classes?.length || 0} Classes</p>
                </div>
              </div>
              <button
                onClick={() => handleDeleteCourse(course.id)}
                className="p-2 text-white/20 hover:text-red-400 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {course.classes?.map((cls, idx) => (
                <div key={idx} className="text-white/60 text-sm flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                  <span className="text-emerald-400 font-bold">{idx + 1}.</span>
                  <span className="truncate">{cls.title}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
