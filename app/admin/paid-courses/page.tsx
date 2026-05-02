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
import { Plus, Trash2, Edit, Save, X, PlayCircle, Users, Search, CheckCircle, Loader2, AlertCircle, Check } from 'lucide-react';
import AdminAlert from '@/components/AdminAlert';

interface ClassItem {
  title: string;
  youtubeId: string;
}

interface PaidCourse {
  id: string;
  title: string;
  classes: ClassItem[];
  createdAt: any;
  studentCount?: number;
}

export default function PaidCoursesAdmin() {
  const [courses, setCourses] = useState<PaidCourse[]>([]);
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

  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editCourseId, setEditCourseId] = useState<string | null>(null);

  // New Course State
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newClasses, setNewClasses] = useState<ClassItem[]>([{ title: '', youtubeId: '' }]);

  // Access Management State
  const [searchQuery, setSearchQuery] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    try {
      const q = query(collection(db, "paidCourses"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const listPromises = snapshot.docs.map(async (doc) => {
        const data = doc.data();
        // Fetch student count for this course
        const studentQuery = query(collection(db, "userPaidCourses"), where("courseId", "==", doc.id));
        const studentSnap = await getDocs(studentQuery);

        return {
          id: doc.id,
          ...data,
          studentCount: studentSnap.size
        } as PaidCourse;
      });

      const list = await Promise.all(listPromises);
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
      showToast("সবগুলো ঘর পূরণ করুন", "error");
      return;
    }

    setLoading(true);
    try {
      if (isEditing && editCourseId) {
        await updateDoc(doc(db, "paidCourses", editCourseId), {
          title: newCourseTitle,
          classes: newClasses,
          updatedAt: serverTimestamp()
        });
        showToast("কোর্সটি সফলভাবে আপডেট করা হয়েছে");
      } else {
        await addDoc(collection(db, "paidCourses"), {
          title: newCourseTitle,
          classes: newClasses,
          createdAt: serverTimestamp()
        });
        showToast("নতুন কোর্স সফলভাবে তৈরি করা হয়েছে");
      }

      setIsAdding(false);
      setIsEditing(false);
      setEditCourseId(null);
      setNewCourseTitle('');
      setNewClasses([{ title: '', youtubeId: '' }]);
      fetchCourses();
    } catch (e) {
      console.error(e);
      showToast("সমস্যা হয়েছে, পুনরায় চেষ্টা করুন", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (course: PaidCourse) => {
    setNewCourseTitle(course.title);
    setNewClasses(course.classes || [{ title: '', youtubeId: '' }]);
    setEditCourseId(course.id);
    setIsEditing(true);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCourse = async (id: string) => {
    showAlert('confirm', 'নিশ্চিত করুন', 'আপনি কি নিশ্চিতভাবে এই কোর্সটি ডিলিট করতে চান?', async () => {
      try {
        await deleteDoc(doc(db, "paidCourses", id));
        showToast("কোর্সটি ডিলিট করা হয়েছে");
        fetchCourses();
      } catch (e) {
        console.error(e);
        showToast("ডিলিট করতে সমস্যা হয়েছে", "error");
      }
    });
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
          showAlert('error', 'পাওয়া যায়নি', 'ইউজার খুঁজে পাওয়া যায়নি।');
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
        showToast("ইউজার অলরেডি এই কোর্সের এক্সেস পেয়েছে", "error");
        return;
      }

      await setDoc(doc(db, "userPaidCourses", `${foundUser.id}_${selectedCourseId}`), {
        userId: foundUser.id,
        courseId: selectedCourseId,
        grantedAt: serverTimestamp()
      });
      showToast("সফলভাবে এক্সেস দেওয়া হয়েছে");
      setFoundUser(null);
      setSearchQuery('');
    } catch (e) {
      console.error(e);
      showToast("এক্সেস দিতে সমস্যা হয়েছে", "error");
    }
  };

  return (
    <div className="space-y-8 relative">
      <AdminAlert
        {...alertConfig}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
      {/* Custom Toast Notification */}
      {toast && (
        <div className="fixed top-10 right-10 z-[100] animate-in fade-in slide-in-from-right-4 duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {toast.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            <p className="font-bold font-bengali text-sm">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white font-bengali">পেইড কোর্স ম্যানেজমেন্ট</h1>
          <p className="text-white/60">এখানে নতুন পেইড কোর্স তৈরি করুন এবং স্টুডেন্টদের এক্সেস দিন।</p>
        </div>
        <button
          onClick={() => {
            if (isAdding) {
              setIsAdding(false);
              setIsEditing(false);
              setEditCourseId(null);
              setNewCourseTitle('');
              setNewClasses([{ title: '', youtubeId: '' }]);
            } else {
              setIsAdding(true);
            }
          }}
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
              placeholder="Email দিয়ে সার্চ করুন"
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
            <label className="text-white/60 text-sm font-bold uppercase tracking-widest">
              {isEditing ? 'এডিট কোর্স টাইটেল' : 'কোর্স টাইটেল'}
            </label>
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
            {isEditing ? 'কোর্স আপডেট করুন' : 'কোর্স সেভ করুন'}
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
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider">{course.classes?.length || 0} Classes</p>
                    <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                    <p className="text-emerald-400/60 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                      <Users size={12} /> {course.studentCount || 0} Students
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditClick(course)}
                  className="p-2 text-white/20 hover:text-emerald-400 transition-colors"
                >
                  <Edit size={20} />
                </button>
                <button
                  onClick={() => handleDeleteCourse(course.id)}
                  className="p-2 text-white/20 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            {/* Class list removed as per request */}
          </div>
        ))}
      </div>
    </div>
  );
}
