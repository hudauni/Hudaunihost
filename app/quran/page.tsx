"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, BookOpen, Search, X } from 'lucide-react';
import Navbar from '@/components/Navbar';

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

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export default function QuranListPage() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then(res => res.json())
      .then(data => {
        setSurahs(data.data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  const toBengaliNumber = (num: number) => {
    const digits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().split('').map(d => digits[parseInt(d)]).join('');
  };

  const filteredSurahs = useMemo(() => {
    return surahs.filter(surah => {
      const bengaliName = BENGALI_SURAH_NAMES[surah.number] || "";
      return (
        surah.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        surah.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bengaliName.includes(searchQuery) ||
        surah.number.toString().includes(searchQuery)
      );
    });
  }, [surahs, searchQuery]);

  return (
    <div className="h-screen w-full bg-[#001a1a] flex flex-col font-sans overflow-hidden">
      <Navbar showHome={true} />

      <main className="relative flex-1 w-full flex flex-col items-center overflow-hidden">

        {/* --- MOBILE VERSION --- */}
        <div
          className="lg:hidden w-full h-[calc(100vh+2px)] flex flex-col items-center bg-no-repeat pt-0 pb-6 overflow-hidden"
          style={{
            backgroundImage: "url('/images/bgimg.webp')",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
          }}
        >
          <div className="w-full flex justify-between items-center px-6 pt-4 mb-0">
            <Link href="/" className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white shadow-lg">
              <ChevronLeft size={18} />
            </Link>

            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 bg-emerald-500 rounded-full text-white shadow-lg border border-emerald-400/30"
            >
              {isSearchOpen ? <X size={18} /> : <Search size={18} />}
            </button>
          </div>

          <div className="w-full px-6 transition-all duration-300 overflow-hidden"
               style={{ maxHeight: isSearchOpen ? '60px' : '0px', marginTop: isSearchOpen ? '10px' : '0px' }}>
            <input
              type="text"
              placeholder="সুরার নাম বা নম্বর দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50 placeholder:text-white/30 font-bengali"
            />
          </div>

          <h2 className={`text-emerald-900 text-xl font-extrabold mb-4 drop-shadow-sm font-bengali transition-all ${isSearchOpen ? 'mt-4' : '-mt-[27px]'}`}>
            আল কুরআন
          </h2>

          <div className="flex-1 w-full overflow-y-auto custom-scrollbar px-6 flex flex-col items-center space-y-3.5 mb-10">
            {loading ? (
              <div className="flex justify-center pt-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : filteredSurahs.length > 0 ? (
              filteredSurahs.map((surah) => (
                <Link
                  key={surah.number}
                  href={`/quran/${surah.number}`}
                  className="w-full max-w-[300px] p-4 bg-gradient-to-br from-[#1a472a]/70 to-[#001a1a]/90 backdrop-blur-xl rounded-2xl border-t border-white/30 border-l border-white/20 shadow-[0_8px_15px_rgba(0,0,0,0.5),inset_0_-2px_4px_rgba(0,0,0,0.3)] border border-white/10 flex items-center justify-between active:translate-y-1 transition-all"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-black font-bold shadow-inner">
                      {toBengaliNumber(surah.number)}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-[14px] font-bengali drop-shadow-md">{BENGALI_SURAH_NAMES[surah.number]}</h3>
                      <p className="text-white/40 text-[10px] font-medium">{surah.englishName} • {toBengaliNumber(surah.numberOfAyahs)} আয়াত</p>
                    </div>
                  </div>
                  <BookOpen size={16} className="text-emerald-400/40" />
                </Link>
              ))
            ) : (
              <div className="text-white/40 text-sm mt-10 font-bengali">কোনো সুরা খুঁজে পাওয়া যায়নি</div>
            )}
          </div>
        </div>

        {/* --- DESKTOP VERSION --- */}
        <div className="hidden lg:flex w-full flex-col items-center relative bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#011a1a] min-h-[calc(100vh-73px)] pt-20 pb-20 overflow-y-auto custom-scrollbar">
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>

          <div className="relative z-10 w-full max-w-6xl px-10 flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-12">
              <div className="w-10 h-10"></div> {/* Spacer */}
              <h2 className="text-5xl font-black text-white tracking-tight font-bengali">আল কুরআন</h2>

              <div className="relative flex items-center">
                <div className={`flex items-center bg-white/[0.05] border border-white/10 rounded-full px-4 py-2 transition-all duration-500 ${isSearchOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}>
                  <Search size={18} className="text-emerald-400 mr-2" />
                  <input
                    type="text"
                    placeholder="সুরা খুঁজুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none text-white text-sm focus:outline-none w-full font-bengali"
                  />
                </div>
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="ml-4 p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-full text-emerald-400 transition-all shadow-lg"
                >
                  {isSearchOpen ? <X size={20} /> : <Search size={20} />}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="animate-pulse text-emerald-400">সুরা লোড হচ্ছে...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full px-4">
                {filteredSurahs.map((surah) => (
                  <Link
                    key={surah.number}
                    href={`/quran/${surah.number}`}
                    className="group p-6 bg-gradient-to-br from-[#1a472a]/40 to-[#001a1a]/60 backdrop-blur-3xl border-t border-white/20 border-l border-white/10 rounded-2xl flex items-center justify-between transition-all duration-300 hover:-translate-y-1 shadow-[0_20px_40px_rgba(0,0,0,0.5),inset_0_-2px_6px_rgba(0,0,0,0.3)] hover:border-emerald-500/30"
                  >
                    <div className="flex items-center space-x-5 flex-1">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-black font-bold text-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors shadow-inner">
                        {surah.number}
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-xl font-bengali drop-shadow-lg">{BENGALI_SURAH_NAMES[surah.number]}</h3>
                        <p className="text-emerald-100/40 text-sm">{surah.englishName} • {surah.numberOfAyahs} Ayahs</p>
                      </div>
                    </div>
                    <BookOpen size={20} className="text-white/10 group-hover:text-emerald-400 transition-colors" />
                  </Link>
                ))}
                {filteredSurahs.length === 0 && (
                  <div className="col-span-full text-center text-emerald-100/30 py-20 font-bengali">কোনো সুরা খুঁজে পাওয়া যায়নি</div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
}
