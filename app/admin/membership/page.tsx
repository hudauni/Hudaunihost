"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, where, serverTimestamp, updateDoc, setDoc, writeBatch
} from 'firebase/firestore';
import { Plus, Trash2, Edit2, X, Settings2, RotateCcw } from 'lucide-react';

export default function AdminMembership() {
  const [levels, setLevels] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);

  const [selectedLevelId, setSelectedLevelId] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");

  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");

  const fetchLevels = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "membershipLevels"));
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      setLevels(data);
      if (data.length > 0 && !selectedLevelId) setSelectedLevelId(data[0].id);
    } catch (e) { console.error(e); }
  }, [selectedLevelId]);

  const fetchTasks = useCallback(async () => {
    if (!selectedLevelId) {
      setTasks([]);
      return;
    }
    try {
      const q = query(
        collection(db, "membershipTasks"),
        where("levelId", "==", selectedLevelId)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      setTasks(data);
      if (data.length > 0 && !selectedTaskId) setSelectedTaskId(data[0].id);
    } catch (e) { console.error(e); }
  }, [selectedLevelId, selectedTaskId]);

  const fetchVideos = useCallback(async () => {
    if (!selectedTaskId) {
      setVideos([]);
      return;
    }
    try {
      const q = query(
        collection(db, "membershipVideos"),
        where("taskId", "==", selectedTaskId)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      setVideos(data);
    } catch (e) { console.error(e); }
  }, [selectedTaskId]);

  useEffect(() => { fetchLevels(); }, [fetchLevels]);
  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const seedData = async () => {
    if (!confirm("আপনি কি ডিফল্ট ১০টি লেভেল এবং এসোসিয়েট সিলেবাস টাস্কগুলো ডাটাবেসে যোগ করতে চান?")) return;

    const batch = writeBatch(db);

    const defaultLevels = ["Associate", "Member", "Scholar", "Graduate", "Ambassador", "Instructor", "Advisor", "Mentor", "Master", "Principal"];
    defaultLevels.forEach((title, i) => {
      const id = title.toLowerCase().replace(/\s+/g, '-');
      batch.set(doc(db, "membershipLevels", id), { title, order: i + 1 });
    });

    const defaultTasks = ["পবিত্র কুরআন তিলাওয়াত শুনে শেষ করা", "কুরআনের বাংলা অনুবাদ শুনে শেষ করা", "ইসলামের অলৌকিক নিদর্শনের ক্লাস দেখা", "নিদর্শন ভিত্তিক বইয়ের অডিও শোনা", "ইসলামের গ্রহণের গল্প দেখা", "রাসূল (সাঃ) এর জীবনী", "প্রতিদিন স্মরণিকা অডিও ট্র্যাক শোনা", "নিয়মিত সদকা করা", "প্রতি শুক্রবার স্মরণিকা অনলাইন লাইভ ক্লাস", "লাইভ ক্লাসে নিজের পরিজনদের আমন্ত্রণ"];
    defaultTasks.forEach((title, i) => {
      const ref = doc(collection(db, "membershipTasks"));
      batch.set(ref, { title, levelId: "associate", order: i + 1, createdAt: serverTimestamp() });
    });

    await batch.commit();
    alert("সাফল্যের সাথে ডিফল্ট ডাটা যোগ করা হয়েছে!");
    fetchLevels();
  };

  const addLevel = async () => {
    const title = prompt("লেভেলের নাম:");
    if (!title) return;
    const id = title.toLowerCase().replace(/\s+/g, '-');
    await setDoc(doc(db, "membershipLevels", id), { title, order: levels.length + 1 });
    fetchLevels();
  };

  const addTask = async () => {
    const title = prompt("টাস্কের নাম:");
    if (!title) return;
    await addDoc(collection(db, "membershipTasks"), { title, levelId: selectedLevelId, order: tasks.length + 1, createdAt: serverTimestamp() });
    fetchTasks();
  };

  const addVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = newVideoUrl.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    if (!videoId) return alert("Invalid URL");

    await addDoc(collection(db, "membershipVideos"), { title: newVideoTitle, youtubeId: videoId, taskId: selectedTaskId, levelId: selectedLevelId, order: videos.length + 1, createdAt: serverTimestamp() });
    setNewVideoTitle(""); setNewVideoUrl("");
    fetchVideos();
  };

  const deleteItem = async (col: string, id: string) => {
    if (!confirm("ডিলিট করতে নিশ্চিত?")) return;
    await deleteDoc(doc(db, col, id));
    if (col === "membershipLevels") fetchLevels();
    else if (col === "membershipTasks") fetchTasks();
    else fetchVideos();
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white font-bengali">মেম্বারশিপ ম্যানেজমেন্ট</h2>
        <div className="flex gap-2">
          <button onClick={seedData} className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 text-emerald-400 rounded-sm text-xs font-bold border border-emerald-500/20 hover:bg-emerald-600/30 transition-all"><RotateCcw size={16} /> Restore Defaults</button>
          <button onClick={() => setIsLevelModalOpen(!isLevelModalOpen)} className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-sm border border-white/10"><Settings2 size={20} /></button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pb-4">
        {levels.map((level) => (
          <button key={level.id} onClick={() => { setSelectedLevelId(level.id); setSelectedTaskId(""); }} className={`px-6 py-2 rounded-sm transition-all font-bold text-sm border ${selectedLevelId === level.id ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white/5 text-white/40 border-white/5'}`}>{level.title}</button>
        ))}
      </div>

      {isLevelModalOpen && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {levels.map(l => (
              <div key={l.id} className="bg-black/40 p-2 rounded-sm border border-white/10 flex justify-between items-center group">
                <span className="text-white text-xs font-bold truncate">{l.title}</span>
                <button onClick={() => deleteItem("membershipLevels", l.id)} className="text-red-500/40 hover:text-red-500"><Trash2 size={14}/></button>
              </div>
            ))}
            <button onClick={addLevel} className="p-2 border-2 border-dashed border-white/10 rounded-sm text-white/40 hover:text-emerald-400 text-xs font-bold">+ New</button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white font-bengali">সিলেবাস টাস্ক লিস্ট</h3>
          <button onClick={addTask} className="px-4 py-2 bg-white/5 text-emerald-400 rounded-sm text-xs font-bold border border-white/5">+ নতুন টাস্ক</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <div key={task.id} onClick={() => setSelectedTaskId(task.id)} className={`py-2 px-3 rounded-sm border cursor-pointer transition-all flex justify-between items-center group ${selectedTaskId === task.id ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-white/[0.03] border-white/5'}`}>
              <span className={`font-bold font-bengali text-sm ${selectedTaskId === task.id ? 'text-emerald-400' : 'text-white/70'}`}>{task.title}</span>
              <button onClick={(e) => { e.stopPropagation(); deleteItem("membershipTasks", task.id); }} className="p-1 text-red-500/20 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
            </div>
          ))}
        </div>
      </div>

      {selectedTaskId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6 border-t border-white/5">
          <div className="lg:col-span-1">
            <div className="bg-white/[0.03] border border-white/10 p-6 rounded-md">
              <form onSubmit={addVideo} className="space-y-4">
                <input type="text" placeholder="ভিডিও শিরোনাম" value={newVideoTitle} onChange={(e) => setNewVideoTitle(e.target.value)} required className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-2 text-white text-sm outline-none font-bengali" />
                <input type="url" placeholder="ইউটিউব লিংক" value={newVideoUrl} onChange={(e) => setNewVideoUrl(e.target.value)} required className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-2 text-white text-sm outline-none" />
                <button className="w-full bg-emerald-600 py-2 rounded-sm font-bold text-white">সেভ করুন</button>
              </form>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-3">
            {videos.map((v, i) => (
              <div key={v.id} className="bg-white/[0.02] p-3 rounded-sm flex items-center justify-between border border-white/5">
                <span className="text-white text-sm font-bengali">{i+1}. {v.title}</span>
                <button onClick={() => deleteItem("membershipVideos", v.id)} className="text-red-500/40 hover:text-red-500"><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
