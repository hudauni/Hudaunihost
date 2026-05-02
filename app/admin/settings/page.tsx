"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Settings, Save, Image as ImageIcon, Loader2, Video, List, Plus, Trash2, Copy, GripVertical, ChevronDown } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import AdminAlert from '@/components/AdminAlert';

export default function AdminSettings() {
  const [logoUrl, setLogoUrl] = useState("");
  const [enrollVideoId, setEnrollVideoId] = useState("");
  const [enrollSteps, setEnrollSteps] = useState<{ id: string; type: 'text' | 'number'; text?: string; number?: string }[]>([]);
  const [liveClassText, setLiveClassText] = useState("");
  const [liveClassButtonText, setLiveClassButtonText] = useState("");
  const [liveClassLink, setLiveClassLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

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

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, "settings", "general");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setLogoUrl(data.logoUrl || "");
          setEnrollVideoId(data.enrollVideoId || "");
          setLiveClassText(data.liveClassText || "");
          setLiveClassButtonText(data.liveClassButtonText || "Join Meeting");
          setLiveClassLink(data.liveClassLink || "");
          setEnrollSteps(data.enrollSteps || [
            { id: '1', type: 'text', text: "অ্যাপে লগইন করে ‘Send Money’ অপশনে ক্লিক করুন।" },
            { id: '2', type: 'number', number: "01977-889080" },
            { id: '3', type: 'text', text: "পরিমাণে কোর্স ফি বা নির্ধারিত টাকা লিখুন।" },
            { id: '4', type: 'text', text: "রেফারেন্সে আপনার আইডি দিন।" },
            { id: '5', type: 'text', text: "পেমেন্ট সম্পন্ন হলে নিচের ফর্মটি পূরণ করে পাঠান।" }
          ]);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const addStep = (type: 'text' | 'number') => {
    const newId = Date.now().toString();
    const newStep = type === 'text'
      ? { id: newId, type: 'text' as const, text: "" }
      : { id: newId, type: 'number' as const, number: "" };

    setEnrollSteps([...enrollSteps, newStep]);
    setShowAddMenu(false);
  };

  const removeStep = (index: number) => {
    showAlert('confirm', 'নিশ্চিত করুন', 'আপনি কি এই ধাপটি মুছে ফেলতে চান?', () => {
      const updated = [...enrollSteps];
      updated.splice(index, 1);
      setEnrollSteps(updated);
    });
  };

  const updateStep = (index: number, field: string, value: string) => {
    const updated = [...enrollSteps];
    updated[index] = { ...updated[index], [field]: value };
    setEnrollSteps(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const videoId = extractVideoId(enrollVideoId);

    try {
      await setDoc(doc(db, "settings", "general"), {
        logoUrl: logoUrl,
        enrollVideoId: videoId,
        enrollSteps: enrollSteps,
        liveClassText,
        liveClassButtonText,
        liveClassLink
      }, { merge: true });

      setEnrollVideoId(videoId);
      showAlert('success', 'সফল হয়েছে', 'সেটিংস সফলভাবে সেভ করা হয়েছে।');
    } catch (error) {
      console.error("Error saving settings:", error);
      showAlert('error', 'ব্যর্থ হয়েছে', 'সেটিংস সেভ করা সম্ভব হয়নি।');
    } finally {
      setSaving(false);
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(enrollSteps);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setEnrollSteps(items);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  const extractVideoId = (input: string) => {
    if (!input) return "";
    if (input.length === 11 && !input.includes('/') && !input.includes('?')) return input;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = input.match(regExp);
    return (match && match[2].length === 11) ? match[2] : input;
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl">
      <AdminAlert
        {...alertConfig}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />
      <div>
        <h2 className="text-2xl font-bold text-white mb-1 font-bengali">সেটিংস</h2>
        <p className="text-white/40 text-xs">Manage website configuration</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white/[0.03] border border-white/10 rounded-lg p-6 backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleSave} className="space-y-8">
            {/* Logo & Video in one row to save space */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ImageIcon size={16} className="text-emerald-500" /> লোগো
                </h3>
                <input
                  type="url"
                  placeholder="URL"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-md px-4 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Video size={16} className="text-emerald-500" /> ভিডিও ID
                </h3>
                <input
                  type="text"
                  placeholder="YouTube ID"
                  value={enrollVideoId}
                  onChange={(e) => setEnrollVideoId(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-md px-4 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {/* Live Class Settings */}
            <div className="space-y-4 pt-6 border-t border-white/5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Video size={18} className="text-emerald-500" /> লাইভ ক্লাস পেজ সেটিংস
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/20 uppercase font-black tracking-widest ml-1">পেজ ডেসক্রিপশন টেক্সট</label>
                  <textarea
                    placeholder="লাইভ ক্লাস সম্পর্কে কিছু লিখুন..."
                    value={liveClassText}
                    onChange={(e) => setLiveClassText(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-md px-4 py-3 text-white text-xs focus:outline-none focus:border-emerald-500/30 font-bengali resize-none"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/20 uppercase font-black tracking-widest ml-1">বাটন টেক্সট</label>
                    <input
                      type="text"
                      placeholder="Join Live Class"
                      value={liveClassButtonText}
                      onChange={(e) => setLiveClassButtonText(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-md px-4 py-3 text-white text-xs focus:outline-none focus:border-emerald-500/30 font-bengali"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-white/20 uppercase font-black tracking-widest ml-1">মিটিং লিঙ্ক (Zoom/Meet)</label>
                    <input
                      type="url"
                      placeholder="https://zoom.us/j/..."
                      value={liveClassLink}
                      onChange={(e) => setLiveClassLink(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-md px-4 py-3 text-white text-xs focus:outline-none focus:border-emerald-500/30"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Enroll Steps */}
            <div className="space-y-4 pt-6 border-t border-white/5">
              <div className="flex justify-between items-center relative">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <List size={18} className="text-emerald-500" /> এনরোলমেন্ট স্টেপস
                </h3>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-md transition-all text-[10px] font-bold border border-emerald-500/20"
                  >
                    <Plus size={14} /> স্টেপ যোগ করুন <ChevronDown size={14} />
                  </button>

                  {showAddMenu && (
                    <div className="absolute right-0 mt-1 w-40 bg-[#002b2b] border border-white/10 rounded-lg shadow-2xl z-[100] p-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      <button type="button" onClick={() => addStep('text')} className="w-full text-left px-3 py-2 hover:bg-white/5 text-white text-[10px] font-bold rounded-md flex items-center gap-2 transition-all">
                        <List size={12} className="text-emerald-500" /> ১. টেক্সট স্টেপ
                      </button>
                      <button type="button" onClick={() => addStep('number')} className="w-full text-left px-3 py-2 hover:bg-white/5 text-white text-[10px] font-bold rounded-md flex items-center gap-2 transition-all">
                        <Copy size={12} className="text-emerald-500" /> ২. নম্বর স্টেপ
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="enroll-steps">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                      {enrollSteps.map((step, index) => (
                        <Draggable key={step.id} draggableId={step.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="bg-white/[0.02] border border-white/5 rounded-md p-3 flex items-center gap-3 group hover:border-white/10 transition-all"
                            >
                              <div {...provided.dragHandleProps} className="text-white/10 hover:text-emerald-500 cursor-grab active:cursor-grabbing">
                                <GripVertical size={18} />
                              </div>

                              <div className="w-7 h-7 shrink-0 bg-emerald-500/10 text-emerald-400 rounded-md flex items-center justify-center font-black text-xs border border-emerald-500/10">
                                {index + 1}
                              </div>

                              <div className="flex-1">
                                {step.type === 'text' ? (
                                  <input
                                    type="text"
                                    placeholder="ধাপের বর্ণনা লিখুন..."
                                    value={step.text}
                                    onChange={(e) => updateStep(index, 'text', e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-md px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500/30 font-bengali"
                                  />
                                ) : (
                                  <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 rounded-md px-3 py-2">
                                    <Copy size={14} className="text-emerald-500" />
                                    <input
                                      type="text"
                                      placeholder="নম্বর লিখুন (যেমন: 01977-889080)"
                                      value={step.number || ""}
                                      onChange={(e) => updateStep(index, 'number', e.target.value)}
                                      className="flex-1 bg-transparent border-none text-emerald-400 font-bold tracking-widest text-xs focus:outline-none"
                                    />
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => removeStep(index)}
                                className="p-1.5 text-red-500/20 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all"
                              >
                                <Trash2 size={16} />
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

            <div className="pt-6 border-t border-white/5 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-md transition-all shadow-xl text-sm flex items-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
