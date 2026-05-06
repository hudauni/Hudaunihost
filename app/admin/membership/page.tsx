"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, where, serverTimestamp, updateDoc, setDoc, writeBatch
} from 'firebase/firestore';
import { Plus, Trash2, Edit2, X, Settings2, GripVertical, Loader2, Video as VideoIcon } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import AdminAlert from '@/components/AdminAlert';

export default function AdminMembership() {
  const [levels, setLevels] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);

  const [selectedLevelId, setSelectedLevelId] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");

  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

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

  const onDragEndTasks = async (result: DropResult) => {
    if (!result.destination || !selectedLevelId) return;

    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setTasks(items);
    setIsUpdatingOrder(true);

    try {
      const batch = writeBatch(db);
      items.forEach((task, index) => {
        const docRef = doc(db, "membershipTasks", task.id);
        batch.update(docRef, { order: index + 1 });
      });
      await batch.commit();
    } catch (e) {
      console.error(e);
      showAlert('error', 'ব্যর্থ হয়েছে', 'টাস্ক পজিশন সেভ করা সম্ভব হয়নি।');
      fetchTasks();
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const onDragEndVideos = async (result: DropResult) => {
    if (!result.destination || !selectedTaskId) return;

    const items = Array.from(videos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setVideos(items);
    setIsUpdatingOrder(true);

    try {
      const batch = writeBatch(db);
      items.forEach((video, index) => {
        const docRef = doc(db, "membershipVideos", video.id);
        batch.update(docRef, { order: index + 1 });
      });
      await batch.commit();
    } catch (e) {
      console.error(e);
      showAlert('error', 'ব্যর্থ হয়েছে', 'ভিডিও পজিশন সেভ করা সম্ভব হয়নি।');
      fetchVideos();
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const addLevel = async () => {
    const title = prompt("লেভেলের নাম:");
    if (!title) return;
    const id = title.toLowerCase().replace(/\s+/g, '-');
    await setDoc(doc(db, "membershipLevels", id), { title, order: levels.length + 1 });
    fetchLevels();
  };

  const addTask = async () => {
    const title = prompt("টাস্কের নাম লিখুন:");
    if (!title) return;
    await addDoc(collection(db, "membershipTasks"), { title, levelId: selectedLevelId, order: tasks.length + 1, createdAt: serverTimestamp() });
    fetchTasks();
  };

  const addVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = newVideoUrl.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    if (!videoId) return showAlert('error', 'ভুল লিঙ্ক', 'অনুগ্রহ করে একটি সঠিক ইউটিউব লিঙ্ক দিন।');

    await addDoc(collection(db, "membershipVideos"), { title: newVideoTitle, youtubeId: videoId, taskId: selectedTaskId, levelId: selectedLevelId, order: videos.length + 1, createdAt: serverTimestamp() });
    setNewVideoTitle(""); setNewVideoUrl("");
    fetchVideos();
    showAlert('success', 'সফল হয়েছে', 'ভিডিওটি সফলভাবে যোগ করা হয়েছে।');
  };

  const deleteItem = async (col: string, id: string) => {
    showAlert('confirm', 'নিশ্চিত করুন', 'আপনি কি নিশ্চিতভাবে এই আইটেমটি ডিলিট করতে চান?', async () => {
      try {
        await deleteDoc(doc(db, col, id));
        if (col === "membershipLevels") fetchLevels();
        else if (col === "membershipTasks") fetchTasks();
        else fetchVideos();
        showAlert('success', 'সফল হয়েছে', 'আইটেমটি ডিলিট করা হয়েছে।');
      } catch (e) {
        console.error(e);
        showAlert('error', 'ব্যর্থ হয়েছে', 'ডিলিট করা সম্ভব হয়নি।');
      }
    });
  };

  return (
    <div className="space-y-10 pb-20">
      <AdminAlert
        {...alertConfig}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white font-bengali">মেম্বারশিপ ম্যানেজমেন্ট</h2>
        <div className="flex gap-2">
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
          <div className="flex items-center gap-3">
            {isUpdatingOrder && <Loader2 size={16} className="text-emerald-500 animate-spin" />}
            <button onClick={addTask} className="px-4 py-2 bg-white/5 text-emerald-400 rounded-sm text-xs font-bold border border-white/5 transition-all hover:bg-emerald-500/10">+ নতুন টাস্ক</button>
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEndTasks}>
          <Droppable droppableId="tasks-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                {tasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`py-3 px-4 rounded-sm border cursor-pointer transition-all flex justify-between items-center group ${
                          snapshot.isDragging ? 'bg-emerald-500/20 border-emerald-500 shadow-2xl z-50' :
                          selectedTaskId === task.id ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-white/[0.03] border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div {...provided.dragHandleProps} className="text-white/10 group-hover:text-white/30">
                            <GripVertical size={16} />
                          </div>
                          <span className={`font-bold font-bengali text-sm truncate ${selectedTaskId === task.id ? 'text-emerald-400' : 'text-white/70'}`}>
                            {index + 1}. {task.title}
                          </span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deleteItem("membershipTasks", task.id); }} className="p-1 text-red-500/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {selectedTaskId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t border-white/10">
          <div className="lg:col-span-1">
            <div className="bg-white/[0.03] border border-white/10 p-6 rounded-sm sticky top-10">
              <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                <VideoIcon size={18} className="text-emerald-500" />
                নতুন ভিডিও যোগ করুন
              </h4>
              <form onSubmit={addVideo} className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest ml-1">ভিডিও শিরোনাম</p>
                  <input type="text" placeholder="ভিডিও শিরোনাম" value={newVideoTitle} onChange={(e) => setNewVideoTitle(e.target.value)} required className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/50 font-bengali transition-all" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest ml-1">ইউটিউব লিংক</p>
                  <input type="url" placeholder="ইউটিউব লিংক" value={newVideoUrl} onChange={(e) => setNewVideoUrl(e.target.value)} required className="w-full bg-black/40 border border-white/10 rounded-sm px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/50 transition-all" />
                </div>
                <button className="w-full bg-emerald-600 py-3 rounded-sm font-bold text-white transition-all hover:bg-emerald-500 shadow-lg shadow-emerald-500/10">সেভ করুন</button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">প্লেলিস্ট ভিডিওসমূহ</h4>
              <p className="text-[10px] text-white/20 italic">Drag to reorder playlist</p>
            </div>

            <DragDropContext onDragEnd={onDragEndVideos}>
              <Droppable droppableId="videos-list">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2.5"
                  >
                    {videos.map((v, i) => (
                      <Draggable key={v.id} draggableId={v.id} index={i}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`bg-white/[0.02] p-4 rounded-sm flex items-center justify-between border transition-all group ${
                              snapshot.isDragging ? 'bg-emerald-500/10 border-emerald-500 shadow-2xl z-50' : 'border-white/5 hover:border-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div {...provided.dragHandleProps} className="text-white/10 group-hover:text-white/30">
                                <GripVertical size={18} />
                              </div>
                              <span className="text-white text-sm font-bengali flex-1">
                                <span className="text-white/20 mr-2 font-mono">{i + 1}.</span>
                                {v.title}
                              </span>
                            </div>
                            <button onClick={() => deleteItem("membershipVideos", v.id)} className="p-2 text-red-500/20 hover:text-red-500 transition-colors">
                              <Trash2 size={18}/>
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {videos.length === 0 && (
              <div className="py-20 border-2 border-dashed border-white/5 rounded-sm flex flex-col items-center justify-center text-white/10">
                <VideoIcon size={40} className="mb-2 opacity-10" />
                <p className="font-bengali">কোনো ভিডিও যোগ করা হয়নি</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
