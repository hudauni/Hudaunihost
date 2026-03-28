"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import GlassButton from '@/components/GlassButton';

export default function ServicesPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const services = [
    { title: "রুকইয়াহ", sub: "সেবা নিতে/প্রশিক্ষণ নিতে", id: "4.1" },
    { title: "কুরআন ক্লাস", sub: "শুদ্ধ উচ্চারণ ও নাজেরা", id: "4.2" },
    { title: "হিজামা", sub: "সেবা নিতে/প্রশিক্ষণ নিতে", id: "4.3" },
    { title: "আরবি ভাষা প্রশিক্ষণ", sub: "বেসিক ও এডভান্স", id: "4.4" },
    { title: "উদ্যোক্তা হতে চাই", sub: "প্রশিক্ষণ কোর্স", id: "4.5" },
    { title: "বিনিয়োগ করতে চাই", sub: "এক কালিন/মাসিক", id: "4.6" },
    { title: "চাকরি করতে চাই", sub: "সিভি জমা দিন", id: "4.7" },
    { title: "বিয়ে করতে চাই", sub: "পাত্র/পাত্রী", id: "4.8" },
    { title: "সুস্থ থাকতে চাই", sub: "সচেতনতামূলক প্রশিক্ষণ", id: "4.9" },
    { title: "সুখী দাম্পত্য", sub: "ফ্যামিলি ম্যানেজমেন্ট", id: "4.10" },
    { title: "ঘুমাতে চাই", sub: "", id: "4.11" },
    { title: "আদর্শ পিতা-মাতা", sub: "প্যারেন্টিং প্রশিক্ষণ", id: "4.12" },
    { title: "আসক্তি মুক্তি", sub: "", id: "4.14" },
    { title: "জানতে চাই", sub: "", id: "4.15" },
    { title: "লাইভ ক্লাস", sub: "", id: "4.16" },
    { title: "নামাজের সময়", sub: "", id: "4.17" },
    { title: "সকলের অগ্রগতি", sub: "", id: "4.18" },
    { title: "হোয়াটসঅ্যাপ গ্রুপ", sub: "", id: "4.20" },
  ];

  if (!mounted) return null;

  return (
    <div className="h-screen w-full bg-[#001a1a] flex flex-col font-sans overflow-hidden">

      <Navbar />

      <main className="relative flex-1 w-full flex flex-col items-center overflow-hidden">

        {/* --- MOBILE VERSION --- */}
        <div
          className="lg:hidden w-full h-full flex flex-col items-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/bgimg.webp')",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
          }}
        >
          {/* Back Button */}
          <div className="w-full flex justify-start p-4 flex-shrink-0">
            <Link href="/" className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white shadow-lg">
              <ChevronLeft size={20} />
            </Link>
          </div>

          {/* Scrollable Container - Increased Bottom Margin to control vanish point */}
          <div className="w-full max-w-[310px] flex-1 overflow-y-auto custom-scrollbar px-2 flex flex-col items-center mb-14">
            <div className="grid grid-cols-2 gap-x-3 gap-y-3.5 w-full pb-10">
              {services.map((service) => (
                <GlassButton
                  key={service.id}
                  title={service.title}
                  subtitle={service.sub}
                  variant="service-mobile"
                />
              ))}
            </div>
          </div>
        </div>

        {/* --- DESKTOP VERSION --- */}
        <div
          className="hidden lg:flex w-full flex-1 items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#064e3b] via-[#022c22] to-[#011a1a]"
        >
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>

          <div className="relative z-10 w-full max-w-6xl flex flex-col items-center h-full pt-2">

            {/* Scrollable Grid for Desktop */}
            <div className="flex-1 overflow-y-auto custom-scrollbar w-full px-10 py-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {services.map((service) => (
                  <GlassButton
                    key={service.id}
                    title={service.title}
                    subtitle={service.sub}
                    variant="service-desktop"
                  />
                ))}
              </div>
            </div>

            <Link href="/" className="flex-shrink-0 text-emerald-400 hover:text-emerald-300 flex items-center space-x-2 transition-all hover:-translate-x-1 mt-2 mb-2">
              <ChevronLeft size={20} />
              <span className="font-medium tracking-wide">Back to Campus</span>
            </Link>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.5);
        }
      `}</style>
    </div>
  );
}
