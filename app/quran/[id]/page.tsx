"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Search, X, ArrowRight, MoreVertical, Play, Pause, User, CheckCircle2, AlertCircle, ChevronsDown, Type, Mic2, ChevronRight, BookOpen, Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface Ayah {
  number: number;
  text: string;
  translation: string;
  audio?: string;
}

interface SurahData {
  number: number;
  name: string;
  englishName: string;
  ayahs: Ayah[];
  bismillah?: string;
}

const RECITERS = [
  { id: 'ar.alafasy', name: 'Mishary Rashid Alafasy' },
  { id: 'ar.abdulsamad', name: 'Abdul Basit' },
  { id: 'ar.mahermuaiqly', name: 'Maher Al-Muaiqly' },
  { id: 'ar.hanirifai', name: 'Hani ar-Rifai' },
];

const BENGALI_SURAH_NAMES: Record<number, string> = {
  1: "আল ফাতিহা", 2: "আল বাকারা", 3: "আল ইমরান", 4: "আন নিসা", 5: "আল মায়িদাহ", 6: "আল আনআম", 7: "আল আরাফ", 8: "আল আনফাল", 9: "আত তাওবাহ", 10: "ইউনুস",
  11: "হুদ", 12: "ইউসুফ", 13: "আর রা'দ", 14: "ইব্রাহিম", 15: "আল হিজর", 16: "আন নাহল", 17: "বনী ইসরাঈল", 18: "আল কাহফ", 19: "মারইয়াম", 20: "ত্বোয়া-হা",
  21: "আল আম্বিয়া", 22: "আল হাজ্জ", 23: "আল মু'মিনুন", 24: "আন নূর", 25: "আল ফুরকান", 26: "আশ শুয়ারা", 27: "আন নামল", 28: "আল কাসাস", 29: "আল আনকাবুত", 30: "আর রূম",
  31: "লুকমান", 32: "আস সাজদাহ", 33: "আল আহযাব", 34: "সাবা", 35: "ফাতির", 36: "ইয়াসিন", 37: "আস সাফফাত", 38: "সোয়াদ", 39: "আয যুমার", 40: "আল মু'মিন",
  41: "হামিম সাজদাহ", 42: "আশ শূরা", 43: "আয যুখরুফ", 44: "আদ দুখান", 45: "আল জাসিয়াহ", 46: "আল আহকাফ", 47: "মুহাম্মদ", 48: "আল ফাতহ", 49: "আল হুজুরাত", 50: "ক্বাফ",
  51: "আয যারিয়াত", 52: "আত তূর", 53: "আন নাজম", 54: "আল ক্বামার", 55: "আর রহমান", 56: "আল ওয়াকিয়াহ", 57: "আল হাদীদ", 58: "আল মুজাদালাহ", 59: "আল হাশর", 60: "আল মুমতাহিনাহ",
  61: "আস সাফ", 62: "আল জুমুআহ", 63: "আল মুনাফিকুন", 64: "আত তাগাবুন", 65: "আত তালাক", 66: "আত তাহরীম", 67: "আল মুলক", 68: "আল কলাম", 69: "আল হাক্কাহ", 70: "আল মা'আরিজ",
  71: "নূহ", 72: "আল জিন", 73: "আল মুযযাম্মিল", 74: "আল মুদ্দাস্সির", 75: "আল ক্বিয়ামাহ", 76: "আদ দাহর", 77: "আল মুরসালাত", 78: "আন নাবা", 79: "আন নাযিয়াত", 80: "আবাসা",
  81: "আত তাকবীর", 82: "আল ইনফিতার", 83: "আল মুতাফফিফীন", 84: "আল ইনশিক্বাক্ব", 85: "আল বুরুজ", 86: "আত তারিক্ব", 87: "আল আ'লা", 88: "আল গাশিয়াহ", 89: "আল ফাজর", 90: "আল বালাদ",
  91: "আশ শামস", 92: "আল লাইল", 93: "আদ দুহা", 94: "আল ইনশিরাহ", 95: "আত তীন", 96: "আল আলাক্ব", 97: "আল ক্বদর", 98: "আল বাইয়্যিনাহ", 99: "আয যিলযাল", 100: "আল আদিয়াত",
  101: "আল ক্বারিয়াহ", 102: "আত তাকাসুর", 103: "আল আসর", 104: "আল হুমাযাহ", 105: "আল ফীল", 106: "কুরাইশ", 107: "আল মাউন", 108: "আল কাউসার", 109: "আল কাফিরুন", 110: "আন নাসর",
  111: "আল লাহাব", 112: "আল ইখলাস", 113: "আল ফালাক্ব", 114: "আন নাস"
};

export default function SurahDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loadedSurahs, setSurahs] = useState<SurahData[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextSurahId, setNextSurahId] = useState<number | null>(null);
  const [isFetchingNext, setIsFetchingNext] = useState(false);

  // UI States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<'main' | 'qari' | 'font' | 'surahList'>('main');
  const [selectedQari, setSelectedQari] = useState('ar.alafasy');
  const [playingAyahKey, setPlayingAyahKey] = useState<string | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [surahInput, setSurahInput] = useState("");
  const [ayahInput, setAyahInput] = useState("");
  const [highlightedAyah, setHighlightedAyah] = useState<string | null>(null);

  // Manual Save State (Now using Ref for Performance)
  const currentVisibleAyahRef = useRef<{sId: number, aId: number} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Appearance States
  const [arabicSize, setArabicSize] = useState(26);
  const [bengaliSize, setBengaliSize] = useState(18);

  // Auto-Scroll States
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const progressObserver = useRef<IntersectionObserver | null>(null);
  const scrollAccumulatorRef = useRef<number>(0);

  const toBengaliNumber = (num: number) => {
    const digits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().split('').map(d => digits[parseInt(d)]).join('');
  };

  const checkDownloadStatus = useCallback(async (id: string | number) => {
    if ('caches' in window) {
      const cache = await caches.open('quran-audio-cache');
      const audioUrl = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${id}.mp3`;
      const response = await cache.match(audioUrl);
      setIsDownloaded(!!response);
    }
  }, []);

  const fetchSurahData = async (id: string | number, qari: string) => {
    const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰনِ ٱلرَّحِيمِ";
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${id}/editions/quran-uthmani,bn.bengali,${qari}`);
    const json = await response.json();

    const arabicData = json.data[0];
    const translationData = json.data[1];
    const audioData = json.data[2];

    let surahBismillah = "";
    const combinedAyahs = arabicData.ayahs.map((ayah: any, index: number) => {
      let text = ayah.text;
      if (index === 0 && id.toString() !== '1' && id.toString() !== '9') {
        if (text.startsWith(BISMILLAH)) {
          surahBismillah = BISMILLAH;
          text = text.replace(BISMILLAH, "").trim();
        }
      }
      return {
        number: ayah.numberInSurah,
        text: text,
        translation: translationData.ayahs[index].text,
        audio: audioData.ayahs[index].audio
      };
    });

    return {
      number: arabicData.number,
      name: arabicData.name,
      englishName: arabicNameTranslation(id),
      ayahs: combinedAyahs,
      bismillah: surahBismillah
    };
  };

  const arabicNameTranslation = (id: string | number) => {
    const surah = BENGALI_SURAH_NAMES[Number(id)];
    return surah || "";
  }

  const scrollToAyah = useCallback((sId: string | number, aId: string | number) => {
    const elementId = window.innerWidth >= 1024 ? `ayah-desktop-${sId}-${aId}` : `ayah-${sId}-${aId}`;
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedAyah(`${sId}-${aId}`);
      setTimeout(() => setHighlightedAyah(null), 3500);
    }
  }, []);

  const playAyahAudio = useCallback((ayah: Ayah, surahNum: number) => {
    const key = `${surahNum}-${ayah.number}`;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.src = "";
      audioRef.current.load();
    }

    if (playingAyahKey === key) {
      setPlayingAyahKey(null);
      return;
    }

    const audio = new Audio(ayah.audio);
    audioRef.current = audio;
    setPlayingAyahKey(key);
    scrollToAyah(surahNum, ayah.number);

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        if (error.name !== 'AbortError') console.error("Audio play failed:", error);
      });
    }

    audio.onended = () => {
      setPlayingAyahKey(null);
      setSurahs(prev => {
        const surahIndex = prev.findIndex(s => s.number === surahNum);
        if (surahIndex !== -1) {
          const surahObj = prev[surahIndex];
          if (ayah.number < surahObj.ayahs.length) {
            playAyahAudio(surahObj.ayahs[ayah.number], surahNum);
          }
        }
        return prev;
      });
    };
  }, [playingAyahKey, scrollToAyah]);

  const handleManualSave = async () => {
    const current = currentVisibleAyahRef.current;
    if (!user || !current) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        lastRead: {
          surahId: current.sId,
          ayahNum: current.aId,
          timestamp: serverTimestamp(),
          surahName: BENGALI_SURAH_NAMES[current.sId]
        }
      });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    } catch (err) {
      console.error("Error manual saving:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surahInput) return;
    const sNum = parseInt(surahInput);
    if (isNaN(sNum) || sNum < 1 || sNum > 114) { alert("সঠিক সুরা নম্বর দিন (১-১১৪)"); return; }
    const aNum = parseInt(ayahInput);
    if (sNum.toString() === params.id) {
      if (!isNaN(aNum)) scrollToAyah(sNum, aNum);
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push(`/quran/${sNum}${!isNaN(aNum) ? `#ayah-${sNum}-${aNum}` : ""}`);
    }
    setIsSearchOpen(false);
  };

  const loadNextSurah = useCallback(async () => {
    if (!nextSurahId || isFetchingNext || loading) return;
    setIsFetchingNext(true);
    try {
      const data = await fetchSurahData(nextSurahId, selectedQari);
      setSurahs(prev => [...prev, data]);
      setNextSurahId(data.number < 114 ? data.number + 1 : null);
    } catch (err) { console.error(err); } finally { setIsFetchingNext(false); }
  }, [nextSurahId, isFetchingNext, loading, selectedQari]);

  const loaderRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && nextSurahId && !isFetchingNext) loadNextSurah();
    }, { rootMargin: '800px' });
    if (node) observer.current.observe(node);
  }, [loading, nextSurahId, isFetchingNext, loadNextSurah]);

  // Track Centered Ayah using Ref (Optimized for Fast Scrolling)
  useEffect(() => {
    if (loadedSurahs.length === 0) return;

    if (progressObserver.current) progressObserver.current.disconnect();

    progressObserver.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sId = entry.target.getAttribute('data-surah');
          const aId = entry.target.getAttribute('data-ayah');
          if (sId && aId) {
            // Update Ref ONLY - NO Re-render during scroll
            currentVisibleAyahRef.current = { sId: parseInt(sId), aId: parseInt(aId) };
          }
        }
      });
    }, { threshold: 0.5, rootMargin: '-40% 0% -40% 0%' });

    const elements = document.querySelectorAll('[data-ayah]');
    elements.forEach(el => progressObserver.current?.observe(el));

    return () => progressObserver.current?.disconnect();
  }, [loadedSurahs]);

  // Handle Auto-Scrolling Effect
  useEffect(() => {
    let animationFrameId: number;

    const scroll = () => {
      if (isAutoScrolling) {
        scrollAccumulatorRef.current += (scrollSpeed * 0.15);
        if (scrollAccumulatorRef.current >= 1 || scrollAccumulatorRef.current <= -1) {
          const pixelsToScroll = Math.floor(scrollAccumulatorRef.current);
          window.scrollBy(0, pixelsToScroll);
          scrollAccumulatorRef.current -= pixelsToScroll;
        }
        animationFrameId = requestAnimationFrame(scroll);
      }
    };

    if (isAutoScrolling) {
      animationFrameId = requestAnimationFrame(scroll);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isAutoScrolling, scrollSpeed]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setLoading(true);
      setSurahs([]);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      try {
        const data = await fetchSurahData(params.id as string, selectedQari);
        if (isMounted) {
          setSurahs([data]);
          setNextSurahId(data.number < 114 ? data.number + 1 : null);
          checkDownloadStatus(params.id as string);

          // Small delay for rendering before scroll
          setTimeout(() => {
            const hash = window.location.hash;
            if (hash.startsWith('#ayah-')) {
              const parts = hash.replace('#ayah-', '').split('-');
              if (parts.length === 2) scrollToAyah(parts[0], parts[1]);
            }
          }, 1000);
        }
      } catch (err) { console.error(err); } finally { if (isMounted) setLoading(false); }
    };
    init();
    return () => { isMounted = false; };
  }, [params.id, selectedQari, scrollToAyah, checkDownloadStatus]);

  return (
    <div className="min-h-screen w-full bg-[#001a1a] flex flex-col font-sans overflow-x-hidden relative">
      <Navbar showHome={true} />

      {/* --- FIXED TOPBAR --- */}
      <div className="fixed top-0 lg:top-[73px] left-0 right-0 z-[60] w-full bg-[#002b2b]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex flex-col items-center shadow-lg">
        <div className="w-full max-w-4xl flex justify-between items-center">
          <Link href="/quran" className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"><ChevronLeft size={20} /></Link>
          <div className="flex flex-col items-center">
            <h1 className="text-emerald-400 font-bold font-bengali text-sm lg:text-base">{BENGALI_SURAH_NAMES[Number(params.id)] || "আল কুরআন"}</h1>
            {isDownloaded ? <div className="flex items-center space-x-1 text-[8px] text-emerald-500 font-bold uppercase tracking-tighter"><CheckCircle2 size={8}/><span>Downloaded</span></div> : <div className="flex items-center space-x-1 text-[8px] text-white/20 font-bold uppercase tracking-tighter"><AlertCircle size={8}/><span>Not Downloaded</span></div>}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              className={`p-2 rounded-full transition-all ${isAutoScrolling ? 'bg-emerald-500 text-white animate-pulse' : 'bg-white/5 text-white hover:bg-white/10'}`}
              title="Auto Scroll"
            >
              <ChevronsDown size={20} />
            </button>
            <button
              onClick={handleManualSave}
              disabled={isSaving}
              className={`p-2 rounded-full transition-all ${justSaved ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white hover:bg-white/10'}`}
              title="Save Progress"
            >
              {isSaving ? <Loader2 size={20} className="animate-spin" /> : justSaved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
            </button>
            <button onClick={() => setIsSearchOpen(!isSearchOpen)} className={`p-2 rounded-full transition-all ${isSearchOpen ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white hover:bg-white/10'}`}><Search size={20} /></button>
            <button onClick={() => { setIsMenuOpen(!isMenuOpen); setMenuView('main'); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"><MoreVertical size={20} /></button>
          </div>
        </div>

        {isSearchOpen && (
          <form onSubmit={handleSearch} className="w-full max-w-md mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col space-y-3 bg-black/40 p-4 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-2xl">
              <div className="flex items-center justify-center space-x-3">
                <input type="text" placeholder="সুরা (যেমন: ১)" value={surahInput} onChange={(e) => setSurahInput(e.target.value)} className="w-32 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 font-bengali" />
                <input type="text" placeholder="আয়াত" value={ayahInput} onChange={(e) => setAyahInput(e.target.value)} className="w-24 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 font-bengali" />
                <button type="submit" className="p-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors shadow-lg"><ArrowRight size={20} /></button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* --- MENU SIDEBAR --- */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="relative w-72 h-full bg-[#002b2b] border-l border-white/10 shadow-2xl p-6 flex flex-col animate-in slide-in-from-right duration-300">

            {/* Header */}
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-white font-bold font-bengali text-lg">
                {menuView === 'main' ? 'সেটিংস' : menuView === 'qari' ? 'ক্বারী নির্বাচন' : menuView === 'font' ? 'ফন্ট সাইজ' : 'সকল সুরা'}
              </h3>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-white/40 transition-colors"><X size={20} /></button>
            </div>

            {/* View Switching */}
            <div className="flex-1 overflow-hidden">
              {menuView === 'main' && (
                <div className="space-y-3">
                  <button
                    onClick={() => setMenuView('surahList')}
                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <BookOpen size={18} className="text-emerald-500" />
                      <span className="font-medium font-bengali">সকল সুরা</span>
                    </div>
                    <ChevronRight size={16} className="text-white/20 group-hover:text-emerald-500" />
                  </button>

                  <button
                    onClick={() => setMenuView('qari')}
                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <Mic2 size={18} className="text-emerald-500" />
                      <span className="font-medium font-bengali">ক্বারী নির্বাচন</span>
                    </div>
                    <ChevronRight size={16} className="text-white/20 group-hover:text-emerald-500" />
                  </button>

                  <button
                    onClick={() => setMenuView('font')}
                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <Type size={18} className="text-emerald-500" />
                      <span className="font-medium font-bengali">ফন্ট সাইজ</span>
                    </div>
                    <ChevronRight size={16} className="text-white/20 group-hover:text-emerald-500" />
                  </button>
                </div>
              )}

              {menuView === 'surahList' && (
                <div className="flex flex-col h-full overflow-hidden">
                  <button onClick={() => setMenuView('main')} className="text-emerald-500 text-xs font-bold uppercase tracking-widest flex items-center gap-1 mb-4 hover:underline shrink-0">
                    <ChevronLeft size={14} /> Back to Menu
                  </button>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {Array.from({ length: 114 }, (_, i) => i + 1).map((id) => (
                      <Link
                        key={id}
                        href={`/quran/${id}`}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center space-x-3 p-3 rounded-xl transition-all ${params.id === id.toString() ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${params.id === id.toString() ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {toBengaliNumber(id)}
                        </div>
                        <span className="font-medium text-sm font-bengali">{BENGALI_SURAH_NAMES[id]}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {menuView === 'qari' && (
                <div className="space-y-6">
                  <button onClick={() => setMenuView('main')} className="text-emerald-500 text-xs font-bold uppercase tracking-widest flex items-center gap-1 mb-4 hover:underline">
                    <ChevronLeft size={14} /> Back to Menu
                  </button>
                  <div className="flex flex-col space-y-2">
                    {RECITERS.map((qari) => (
                      <button
                        key={qari.id}
                        onClick={() => { setSelectedQari(qari.id); setIsMenuOpen(false); }}
                        className={`flex items-center space-x-3 p-3 rounded-xl transition-all ${selectedQari === qari.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                      >
                        <User size={16} /><span className="font-medium text-sm">{qari.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {menuView === 'font' && (
                <div className="space-y-10">
                  <button onClick={() => setMenuView('main')} className="text-emerald-500 text-xs font-bold uppercase tracking-widest flex items-center gap-1 mb-4 hover:underline">
                    <ChevronLeft size={14} /> Back to Menu
                  </button>

                  {/* Arabic Size Slider */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] text-white/40 uppercase font-black tracking-widest">
                      <span>Arabic Font</span>
                      <span className="text-emerald-400">{arabicSize}px</span>
                    </div>
                    <input
                      type="range" min="20" max="60" step="1"
                      value={arabicSize}
                      onChange={(e) => setArabicSize(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  {/* Bengali Size Slider */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] text-white/40 uppercase font-black tracking-widest">
                      <span>Bengali Font</span>
                      <span className="text-emerald-400">{bengaliSize}px</span>
                    </div>
                    <input
                      type="range" min="14" max="36" step="1"
                      value={bengaliSize}
                      onChange={(e) => setBengaliSize(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- AUTO-SCROLL SPEED CONTROL - SLIM VERSION --- */}
      {isAutoScrolling && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-64 bg-black/60 backdrop-blur-2xl px-5 py-3 rounded-2xl border border-white/10 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[8px] text-white/40 uppercase font-black tracking-[0.2em]">Scroll Speed</span>
              <span className="text-emerald-400 font-bold text-[10px]">{scrollSpeed}x</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={scrollSpeed}
              onChange={(e) => setScrollSpeed(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>
      )}

      <main className="flex-1 w-full flex flex-col items-center pt-[65px] lg:pt-[138px]">
        {/* --- MOBILE VERSION --- */}
        <div className="lg:hidden w-full min-h-screen flex flex-col items-center bg-gradient-to-b from-[#002b2b] via-[#001a1a] to-[#000d0d] pb-10">
          {loading ? ( <div className="flex justify-center pt-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div> ) : (
            <div className="w-full px-6 flex flex-col">
              {loadedSurahs.map((surah) => (
                <div key={surah.number} id={`surah-${surah.number}`} className="w-full flex flex-col mb-12">
                  <div className="text-center mb-8 pt-8">
                    <h2 className="text-emerald-400 text-3xl font-bold font-bengali">{BENGALI_SURAH_NAMES[surah.number] || surah.name}</h2>
                    <p className="text-white/30 text-[10px] uppercase tracking-widest leading-none mt-1">{surah.englishName}</p>
                  </div>
                  {surah.bismillah && <div className="w-full text-center py-6"><p className="text-emerald-400 text-4xl font-serif">{surah.bismillah}</p></div>}
                  <div className="space-y-6">
                    {surah.ayahs.map((ayah) => {
                      const ayahKey = `${surah.number}-${ayah.number}`;
                      const isPlaying = playingAyahKey === ayahKey;
                      return (
                        <div key={ayahKey} data-surah={surah.number} data-ayah={ayah.number} id={`ayah-${surah.number}-${ayah.number}`} className={`w-full p-6 backdrop-blur-3xl rounded-2xl border flex flex-col space-y-5 shadow-xl transition-all duration-700 ${highlightedAyah === ayahKey ? 'border-emerald-500 bg-emerald-500/10 scale-[1.02] shadow-emerald-500/30' : isPlaying ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01] border-emerald-500/20' : 'bg-white/[0.03] border-white/5'}`}>
                          <div className="flex justify-between items-center">
                            <span className="text-emerald-500/60 font-bold text-[10px] bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">আয়াত {toBengaliNumber(ayah.number)}</span>
                            <button onClick={() => playAyahAudio(ayah, surah.number)} className={`p-2 rounded-full transition-all ${isPlaying ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-emerald-500'}`}>{isPlaying ? <Pause size={16} fill="currentColor"/> : <Play size={16} fill="currentColor"/>}</button>
                          </div>
                          <p style={{ fontSize: `${arabicSize}px` }} className="text-white text-right leading-[1.5] font-serif dir-rtl pr-2">{ayah.text}</p>
                          <p style={{ fontSize: `${bengaliSize}px` }} className="text-emerald-100/70 font-bengali leading-relaxed border-t border-white/5 pt-4">{ayah.translation}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- DESKTOP VERSION --- */}
        <div className="hidden lg:flex w-full flex-col items-center relative bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#011a1a] min-h-screen">
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>
          <div className="relative z-10 w-full max-w-4xl px-10 flex flex-col items-center pt-10 pb-20">
            {loading ? ( <div className="animate-pulse text-emerald-400">আয়াত লোড হচ্ছে...</div> ) : (
              <div className="flex flex-col w-full">
                {loadedSurahs.map((surah) => (
                  <div key={surah.number} id={`surah-desktop-${surah.number}`} className="w-full flex flex-col mb-20 border-b border-white/5 pb-20">
                    <h2 className="text-6xl font-black text-white mb-2 font-bengali text-center">{BENGALI_SURAH_NAMES[surah.number] || surah.name}</h2>
                    <p className="text-emerald-100/40 text-lg mb-12 text-center">{surah.englishName}</p>
                    {surah.bismillah && <div className="w-full text-center mb-12"><p className="text-emerald-400 text-6xl font-serif">{surah.bismillah}</p></div>}
                    <div className="flex flex-col space-y-10">
                      {surah.ayahs.map((ayah) => {
                        const ayahKey = `${surah.number}-${ayah.number}`;
                        const isPlaying = playingAyahKey === ayahKey;
                        return (
                          <div key={ayahKey} data-surah={surah.number} data-ayah={ayah.number} id={`ayah-desktop-${surah.number}-${ayah.number}`} className={`w-full p-8 backdrop-blur-3xl border rounded-3xl flex flex-col space-y-6 shadow-2xl transition-all duration-700 ${highlightedAyah === ayahKey ? 'border-emerald-500 bg-emerald-500/10 scale-[1.02] shadow-emerald-500/40' : isPlaying ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01] border-emerald-500/20' : 'bg-white/[0.03] border-white/5'}`}>
                            <div className="flex justify-between items-center">
                              <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 font-bold">{ayah.number}</div>
                              <button onClick={() => playAyahAudio(ayah, surah.number)} className={`p-3 rounded-full transition-all ${isPlaying ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-emerald-500'}`}>{isPlaying ? <Pause size={20} fill="currentColor"/> : <Play size={20} fill="currentColor"/>}</button>
                            </div>
                            <p style={{ fontSize: `${arabicSize}px` }} className="text-white text-right leading-[1.5] font-serif">{ayah.text}</p>
                            <p style={{ fontSize: `${bengaliSize}px` }} className="text-emerald-100/70 font-bengali leading-relaxed border-t border-white/10 pt-6">{ayah.translation}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {!loading && (
          <div ref={loaderRef} className="w-full py-16 flex justify-center min-h-[120px] relative z-20">
            {isFetchingNext ? ( <div className="flex flex-col items-center space-y-3"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div><span className="text-emerald-500/60 text-xs font-bengali">পরবর্তী সুরা লোড হচ্ছে...</span></div> ) : nextSurahId ? (
              <div className="flex flex-col items-center"><button onClick={loadNextSurah} className="text-emerald-500/40 text-[10px] uppercase tracking-widest hover:text-emerald-500 transition-colors">নিচে স্ক্রল করুন অথবা ক্লিক করুন... </button></div>
            ) : ( <div className="text-white/20 text-xs font-bengali">কুরআন সমাপ্ত</div> )}
          </div>
        )}
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
}
