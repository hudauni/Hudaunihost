"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Search, X, ArrowRight, MoreVertical, Play, Pause, User, CheckCircle2, AlertCircle, ChevronsDown, Type, Mic2, ChevronRight, BookOpen, Bookmark, BookmarkCheck, Loader2, ChevronDown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

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
  revelationType: string;
  ayahs: Ayah[];
  bismillah?: string;
}

const RECITERS = [
  { id: 'ar.alafasy', name: 'Mishary Rashid Alafasy' },
  { id: 'ar.abdulsamad', name: 'Abdul Basit' },
  { id: 'ar.mahermuaiqly', name: 'Maher Al-Muaiqly' },
  { id: 'ar.hanirifai', name: 'Hani ar-Rifai' },
];

const TRANSLATORS = [
  { id: '163', name: 'মাওলানা মুজিবুর রহমান' },
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

const SURAH_AYAH_COUNTS: Record<number, number> = {
  1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
  11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135,
  21: 112, 22: 78, 23: 118, 24: 64, 25: 77, 26: 227, 27: 93, 28: 88, 29: 69, 30: 60,
  31: 34, 32: 30, 33: 73, 34: 54, 35: 45, 36: 83, 37: 182, 38: 88, 39: 75, 40: 85,
  41: 54, 42: 53, 43: 89, 44: 59, 45: 37, 46: 35, 47: 38, 48: 29, 49: 18, 50: 45,
  51: 60, 52: 49, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29, 58: 22, 59: 24, 60: 13,
  61: 14, 62: 11, 63: 11, 64: 18, 65: 12, 66: 12, 67: 30, 68: 52, 69: 52, 70: 44,
  71: 28, 72: 28, 73: 20, 74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42,
  81: 29, 82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20,
  91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11,
  101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3,
  111: 5, 112: 4, 113: 5, 114: 6
};

export default function QuranClient() {
  const params = useParams();
  const router = useRouter();
  const { user, userCollection } = useAuth();

  // Use a derived initial ID to prevent Al-Fatiha glitch
  const initialId = params?.id ? Number(params.id) : null;

  const [loadedSurahs, setSurahs] = useState<SurahData[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextSurahId, setNextSurahId] = useState<number | null>(null);
  const [prevSurahId, setPrevSurahId] = useState<number | null>(null);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [isFetchingPrev, setIsFetchingPrev] = useState(false);

  // UI States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<'main' | 'qari' | 'font' | 'surahList'>('main');
  const [selectedQari, setSelectedQari] = useState('ar.alafasy');
  const [selectedTranslator, setSelectedTranslator] = useState('163');
  const [playingAyahKey, setPlayingAyahKey] = useState<string | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [surahInput, setSurahInput] = useState(initialId ? initialId.toString() : "1");
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
  const [activeSurahId, setActiveSurahId] = useState<number>(initialId || 1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const prevObserver = useRef<IntersectionObserver | null>(null);
  const progressObserver = useRef<IntersectionObserver | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<{sId: number, aId: number} | null>(null);
  const scrollAccumulatorRef = useRef<number>(0);

  const isDesktop = () => typeof window !== 'undefined' && window.innerWidth >= 1024;

  const toBengaliNumber = (num: number) => {
    const digits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().split('').map(d => digits[parseInt(d)]).join('');
  };

  const fromBengaliNumber = (str: string) => {
    const digits: Record<string, string> = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
    };
    return str.toString().split('').map(char => digits[char] || char).join('');
  };

  // Sync activeSurahId and surahInput with URL params
  useEffect(() => {
    if (params?.id) {
      const id = Number(params.id);
      if (!isNaN(id)) {
        setActiveSurahId(id);
        setSurahInput(id.toString());
      }
    }
  }, [params?.id]);

  const checkDownloadStatus = useCallback(async (id: string | number) => {
    if ('caches' in window) {
      const cache = await caches.open('quran-audio-cache');
      const audioUrl = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${id}.mp3`;
      const response = await cache.match(audioUrl);
      setIsDownloaded(!!response);
    }
  }, []);

  const fetchSurahData = async (id: string | number, qari: string, translator: string) => {
    // Check local storage cache first for offline support
    const cacheKey = `surah_data_${id}_${qari}_${translator}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        return JSON.parse(cachedData);
      } catch (e) {
        console.error("Error parsing cached surah data", e);
      }
    }

    const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰনِ ٱلرَّحِيمِ";

    // Build Al Quran Cloud URL (Arabic + Audio always)
    const alCloudUrl = `https://api.alquran.cloud/v1/surah/${id}/editions/quran-uthmani,${qari}`;
    const quranComUrl = `https://api.quran.com/api/v4/verses/by_chapter/${id}?translations=163&per_page=300`;

    const [alCloudRes, quranComRes] = await Promise.all([
      fetch(alCloudUrl),
      fetch(quranComUrl)
    ]);

    const alCloudJson = await alCloudRes.json();
    const quranComJson = await quranComRes.json();

    const arabicData = alCloudJson.data[0];
    const audioData = alCloudJson.data[1];
    const quranComTranslationData = quranComJson?.verses || [];

    let surahBismillah = "";
    const combinedAyahs = arabicData.ayahs.map((ayah: any, index: number) => {
      let text = ayah.text;
      if (index === 0 && id.toString() !== '1' && id.toString() !== '9') {
        if (text.startsWith(BISMILLAH)) {
          surahBismillah = BISMILLAH;
          text = text.replace(BISMILLAH, "").trim();
        }
      }

      // Get translation from Quran.com and strip HTML tags
      const rawTranslation = quranComTranslationData[index]?.translations?.[0]?.text || "অনুবাদ পাওয়া যায়নি";
      const cleanTranslation = rawTranslation.replace(/<\/?[^>]+(>|$)/g, "");

      return {
        number: ayah.numberInSurah,
        text: text,
        translation: cleanTranslation,
        audio: audioData.ayahs[index].audio
      };
    });

    const finalData = {
      number: arabicData.number,
      name: arabicData.name,
      englishName: arabicNameTranslation(id),
      revelationType: arabicData.revelationType,
      ayahs: combinedAyahs,
      bismillah: surahBismillah
    };

    // Save to cache for offline use
    try {
      localStorage.setItem(cacheKey, JSON.stringify(finalData));
    } catch (e) {
      console.warn("Local storage full, could not cache surah", e);
    }

    return finalData;
  };

  const arabicNameTranslation = (id: string | number) => {
    const surah = BENGALI_SURAH_NAMES[Number(id)];
    return surah || "";
  }

  const scrollToAyah = useCallback((sId: string | number, aId: string | number) => {
    const isDesktop = window.innerWidth >= 1024;
    const elementId = isDesktop ? `ayah-desktop-${sId}-${aId}` : `ayah-${sId}-${aId}`;

    // Attempt to find element multiple times as it might still be rendering
    let attempts = 0;
    const tryScroll = () => {
      const element = document.getElementById(elementId);
      if (element) {
        // Use scrollIntoView with block: 'center' to bring it to the middle of the screen
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

        setHighlightedAyah(`${sId}-${aId}`);
        setTimeout(() => setHighlightedAyah(null), 3500);
      } else if (attempts < 10) {
        attempts++;
        setTimeout(tryScroll, 200);
      }
    };

    tryScroll();
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
    if (!user) {
      alert("সেভ করতে লগইন করুন");
      return;
    }
    if (!current) {
      alert("আয়াত লোড হওয়া পর্যন্ত অপেক্ষা করুন");
      return;
    }
    if (!userCollection) {
      console.error("userCollection is missing");
      return;
    }

    setIsSaving(true);
    try {
      await setDoc(doc(db, userCollection, user.uid), {
        lastRead: {
          surahId: current.sId,
          ayahNum: current.aId,
          timestamp: serverTimestamp(),
          surahName: BENGALI_SURAH_NAMES[current.sId] || "আল কুরআন"
        }
      }, { merge: true });

      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    } catch (err: any) {
      console.error("Error manual saving:", err);
      if (err.message?.includes('network')) {
        alert("নেটওয়ার্ক সমস্যা! ইন্টারনেট কানেকশন চেক করুন।");
      } else {
        alert("সেভ করা সম্ভব হয়নি। আবার চেষ্টা করুন।");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Support Bengali digits in inputs
    const sInputClean = fromBengaliNumber(surahInput);
    const aInputClean = fromBengaliNumber(ayahInput);

    // Default to current active surah if none selected
    const sId = sInputClean || activeSurahId.toString();
    const sNum = parseInt(sId);

    if (isNaN(sNum) || sNum < 1 || sNum > 114) {
      alert("সঠিক সুরা নম্বর দিন (১-১১৪)");
      return;
    }

    const aNum = parseInt(aInputClean);

    // Validate Ayah number if provided
    if (!isNaN(aNum)) {
      const maxAyahs = SURAH_AYAH_COUNTS[sNum];
      if (aNum < 1 || aNum > maxAyahs) {
        alert(`${BENGALI_SURAH_NAMES[sNum]} সূরায় ১ থেকে ${toBengaliNumber(maxAyahs)} পর্যন্ত আয়াত আছে।`);
        return;
      }
    }

    setIsSearchOpen(false);

    // Check if the surah is already loaded in the infinite list
    const isSurahLoaded = loadedSurahs.some(s => s.number === sNum);

    if (isSurahLoaded) {
      if (!isNaN(aNum)) {
        scrollToAyah(sNum, aNum);
      } else {
        // Scroll to top of the surah
        const isDesktop = window.innerWidth >= 1024;
        const elementId = isDesktop ? `surah-desktop-${sNum}` : `surah-${sNum}`;
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    } else {
      // Not loaded, need to navigate
      // We don't clear surahs here to avoid flicker; the useEffect will handle it
      router.push(`/quran/${sNum}${!isNaN(aNum) ? `#ayah-${sNum}-${aNum}` : ""}`);
    }
  };

  const loadNextSurah = useCallback(async () => {
    if (!nextSurahId || isFetchingNext || loading) return;
    setIsFetchingNext(true);
    try {
      const data = await fetchSurahData(nextSurahId, selectedQari, selectedTranslator);
      setSurahs(prev => [...prev, data]);
      setNextSurahId(data.number < 114 ? data.number + 1 : null);
    } catch (err) { console.error(err); } finally { setIsFetchingNext(false); }
  }, [nextSurahId, isFetchingNext, loading, selectedQari, selectedTranslator]);

  const loadPrevSurah = useCallback(async () => {
    if (!prevSurahId || isFetchingPrev || loading) return;
    setIsFetchingPrev(true);

    // Save current scroll and height
    const currentScroll = window.scrollY;
    const currentHeight = document.documentElement.scrollHeight;

    try {
      const data = await fetchSurahData(prevSurahId, selectedQari, selectedTranslator);

      // Update state
      setSurahs(prev => [data, ...prev]);
      setPrevSurahId(data.number > 1 ? data.number - 1 : null);

      // Adjust scroll position after state update to maintain view
      setTimeout(() => {
        const newHeight = document.documentElement.scrollHeight;
        const heightDiff = newHeight - currentHeight;
        if (heightDiff > 0) {
          window.scrollTo(0, currentScroll + heightDiff);
        }
      }, 50);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingPrev(false);
    }
  }, [prevSurahId, isFetchingPrev, loading, selectedQari, selectedTranslator]);

  const loaderRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && nextSurahId && !isFetchingNext) loadNextSurah();
    }, { rootMargin: '800px' });
    if (node) observer.current.observe(node);
  }, [loading, nextSurahId, isFetchingNext, loadNextSurah]);

  const prevLoaderRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (prevObserver.current) prevObserver.current.disconnect();
    prevObserver.current = new IntersectionObserver((entries) => {
      // Proactive loading while scrolling up
      if (entries[0].isIntersecting && prevSurahId && !isFetchingPrev) loadPrevSurah();
    }, { rootMargin: '100px' });
    if (node) prevObserver.current.observe(node);
  }, [loading, prevSurahId, isFetchingPrev, loadPrevSurah]);

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
            const sIdNum = parseInt(sId);
            const aIdNum = parseInt(aId);
            // Update Ref ONLY - NO Re-render during scroll
            currentVisibleAyahRef.current = { sId: sIdNum, aId: aIdNum };
            setActiveSurahId(sIdNum);
            setSurahInput(sIdNum.toString());
          }
        }
      });
    }, { threshold: 0.1, rootMargin: '-10% 0% -10% 0%' });

    const elements = document.querySelectorAll('[data-ayah]');
    elements.forEach(el => progressObserver.current?.observe(el));

    return () => {
      progressObserver.current?.disconnect();
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [loadedSurahs, user, userCollection]);

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
    if (!params?.id) return;

    let isMounted = true;

    // Reset all infinite scroll states synchronously when ID changes
    setNextSurahId(null);
    setPrevSurahId(null);
    setIsFetchingNext(false);
    setIsFetchingPrev(false);
    setSurahs([]);
    setLoading(true);

    const init = async () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }

      // Ensure we are at the top for the new Surah
      if (!window.location.hash) {
        window.scrollTo(0, 0);
      }

      try {
        const surahId = params.id as string;
        const data = await fetchSurahData(surahId, selectedQari, selectedTranslator);
        if (isMounted) {
          setSurahs([data]);
          setActiveSurahId(data.number);
          setSurahInput(data.number.toString());
          setNextSurahId(data.number < 114 ? data.number + 1 : null);
          setPrevSurahId(data.number > 1 ? data.number - 1 : null);
          checkDownloadStatus(surahId);

          // Initialize the current visible ayah ref correctly for save
          currentVisibleAyahRef.current = { sId: data.number, aId: 1 };
          lastSavedRef.current = null;

          // Handle initial hash scroll more reliably
          if (typeof window !== 'undefined' && window.location.hash) {
            const hash = window.location.hash;
            if (hash.startsWith('#ayah-')) {
              const parts = hash.replace('#ayah-', '').split('-');
              if (parts.length === 2) {
                // Ensure IDs match correctly
                scrollToAyah(parts[0], parts[1]);
              }
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    init();
    return () => { isMounted = false; };
  }, [params.id, selectedQari, selectedTranslator, scrollToAyah, checkDownloadStatus]);

  return (
    <div className="min-h-screen w-full bg-[#001a1a] flex flex-col font-sans overflow-x-hidden relative">
      <Navbar showHome={true} />

      {/* --- FIXED TOPBAR --- */}
      <div className="fixed top-0 lg:top-[73px] left-0 right-0 z-[60] w-full bg-[#002b2b]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex flex-col items-center shadow-lg">
        <div className="w-full max-w-4xl flex justify-between items-center">
          <Link href="/quran" className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"><ChevronLeft size={20} /></Link>
          <div className="flex flex-col items-center">
            <h1 className="text-emerald-400 font-bold font-bengali text-sm lg:text-base">{BENGALI_SURAH_NAMES[activeSurahId] || "আল কুরআন"}</h1>
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
              <div className="flex items-center justify-center space-x-2">
                <div className="relative group">
                  <select
                    value={surahInput}
                    onChange={(e) => setSurahInput(e.target.value)}
                    className="w-[160px] bg-white/5 border border-white/10 rounded-lg pl-4 pr-10 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 font-bengali appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-[#002b2b]">সুরা নির্বাচন</option>
                    {Array.from({ length: 114 }, (_, i) => i + 1).map((id) => (
                      <option key={id} value={id} className="bg-[#002b2b]">
                        {toBengaliNumber(id)}. {BENGALI_SURAH_NAMES[id]}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 group-focus-within:text-emerald-500 transition-colors">
                    <ChevronDown size={16} />
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="আয়াত"
                  value={ayahInput}
                  onChange={(e) => setAyahInput(e.target.value)}
                  className="w-20 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 font-bengali"
                />

                <button type="submit" className="p-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors shadow-lg">
                  <ArrowRight size={20} />
                </button>
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
        {/* Top Loader for Bi-directional Infinite Scroll */}
        {!loading && prevSurahId && (
          <div ref={prevLoaderRef} className="w-full py-10 flex justify-center h-20">
            {isFetchingPrev && (
              <div className="flex flex-col items-center space-y-2">
                <Loader2 size={24} className="animate-spin text-emerald-500" />
                <span className="text-emerald-500/60 text-[10px] font-bengali">পূর্ববর্তী সুরা লোড হচ্ছে...</span>
              </div>
            )}
          </div>
        )}

        {/* --- UNIFIED QURAN VIEW (Mobile & Desktop) --- */}
        <div className="w-full min-h-screen flex flex-col items-center bg-gradient-to-b from-[#002b2b] via-[#001a1a] to-[#000d0d] lg:bg-gradient-to-br lg:from-[#064e3b] lg:via-[#022c22] lg:to-[#011a1a] pb-10 relative">
          {/* Desktop background pattern */}
          <div className="hidden lg:block absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>

          <div className="relative z-10 w-full max-w-4xl px-6 lg:px-10 flex flex-col items-center">
            {loading && loadedSurahs.length === 0 ? (
              <div className="fixed inset-0 z-[100] bg-[#001a1a] flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                  <BookOpen className="absolute inset-0 m-auto text-emerald-500 animate-pulse" size={24} />
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-emerald-500 font-bold font-bengali text-lg">সুরা লোড হচ্ছে...</p>
                  <p className="text-white/20 text-xs uppercase tracking-[0.2em] mt-1">Please wait a moment</p>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col pt-10">
                {loading && (
                  <div className="w-full flex flex-col items-center justify-center py-8 space-y-2 animate-pulse">
                    <Loader2 className="text-emerald-500 animate-spin" size={20} />
                    <p className="text-emerald-400 text-xs font-bengali">ডেটা সিঙ্ক করা হচ্ছে...</p>
                  </div>
                )}

                {loadedSurahs.map((surah) => (
                  <div key={surah.number} id={`surah-${surah.number}`} className="w-full flex flex-col mb-12 lg:mb-20 lg:border-b lg:border-white/5 lg:pb-20">
                    <div className="text-center mb-8 pt-8 lg:mb-12">
                      <h2 className="text-emerald-400 lg:text-white text-3xl lg:text-6xl font-bold lg:font-black font-bengali">{BENGALI_SURAH_NAMES[surah.number] || surah.name}</h2>
                      <p className="text-white/30 lg:text-emerald-100/40 text-[10px] lg:text-lg uppercase tracking-widest leading-none mt-1 lg:mt-2">{surah.englishName}</p>
                    </div>

                    {surah.bismillah && (
                      <div className="w-full text-center py-6 lg:mb-12">
                        <p className="text-emerald-400 text-4xl lg:text-6xl font-serif">{surah.bismillah}</p>
                      </div>
                    )}

                    <div className="space-y-6 lg:space-y-10">
                      {surah.ayahs.map((ayah) => {
                        const ayahKey = `${surah.number}-${ayah.number}`;
                        const isPlaying = playingAyahKey === ayahKey;
                        const isHighlighted = highlightedAyah === ayahKey;

                        return (
                          <div
                            key={ayahKey}
                            data-surah={surah.number}
                            data-ayah={ayah.number}
                            id={`ayah-${surah.number}-${ayah.number}`}
                            className={`w-full p-6 lg:p-8 backdrop-blur-3xl rounded-2xl lg:rounded-3xl border flex flex-col space-y-5 lg:space-y-6 shadow-xl lg:shadow-2xl transition-all duration-700
                              ${isHighlighted ? 'border-emerald-500 bg-emerald-500/10 scale-[1.02] shadow-emerald-500/30 lg:shadow-emerald-500/40' :
                                isPlaying ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01] border-emerald-500/20' :
                                'bg-white/[0.03] border-white/5'}`}
                          >
                            <div className="flex justify-between items-center">
                              {/* Info Badge (Mobile Style) / Icon (Desktop Style) */}
                              <div className="flex items-center gap-3 lg:gap-4">
                                <div className="hidden lg:flex w-10 h-10 bg-emerald-500/20 rounded-full items-center justify-center text-emerald-400 font-bold">
                                  {ayah.number}
                                </div>
                                <div className="lg:hidden flex">
                                  <span className="text-emerald-500/60 font-bold text-[12px] bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-2">
                                    <span className="font-bengali">{BENGALI_SURAH_NAMES[surah.number]}</span>
                                    <span className="opacity-40">|</span>
                                    <span>{toBengaliNumber(surah.number)}:{toBengaliNumber(ayah.number)}</span>
                                  </span>
                                </div>
                                <div className="hidden lg:flex flex-col">
                                  <span className="text-white/60 font-bold text-sm font-bengali">{BENGALI_SURAH_NAMES[surah.number]} ({toBengaliNumber(surah.number)})</span>
                                  <span className="text-emerald-500/40 text-[10px] font-bold uppercase tracking-widest">{surah.revelationType}</span>
                                </div>
                              </div>

                              <button
                                onClick={() => playAyahAudio(ayah, surah.number)}
                                className={`p-2 lg:p-3 rounded-full transition-all ${isPlaying ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-emerald-500'}`}
                              >
                                {isPlaying ? <Pause size={isDesktop() ? 20 : 16} fill="currentColor"/> : <Play size={isDesktop() ? 20 : 16} fill="currentColor"/>}
                              </button>
                            </div>

                            <p style={{ fontSize: `${arabicSize}px` }} className="text-white text-right leading-[1.5] font-serif dir-rtl pr-2">{ayah.text}</p>
                            <p style={{ fontSize: `${bengaliSize}px` }} className="text-emerald-100/70 font-bengali leading-relaxed border-t border-white/5 lg:border-white/10 pt-4 lg:pt-6">{ayah.translation}</p>
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
