"use client";

import React, { useState, useEffect, useCallback, useId } from 'react';

type PrayerTimes = {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
};

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const toBengaliNumber = (num: number | string) => {
  return num.toString().split('').map(d => BENGALI_DIGITS[parseInt(d)] || d).join('');
};

const PRAYER_NAMES: Record<string, string> = {
  Fajr: "ফজর",
  Sunrise: "সূর্যোদয়",
  Dhuhr: "যোহর",
  Asr: "আসর",
  Maghrib: "মাগরিব",
  Isha: "ইশা",
  Tahajjud: "তাহাজ্জুদ",
  Ishraq: "ইশরাক",
  Chasht: "চাশত",
  Forbidden: "নিষিদ্ধ সময়"
};

export default function PrayerTimeCircle({ size = 200 }: { size?: number }) {
  const componentId = useId().replace(/:/g, ""); // Standard way to generate unique IDs
  const [mounted, setMounted] = useState(false);
  const [timings, setTimings] = useState<PrayerTimes | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ h: number, m: number, s: number } | null>(null);
  const [currentPrayer, setCurrentPrayer] = useState<string>("");
  const [isForbidden, setIsForbidden] = useState(false);
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    setMounted(true);
    const cached = localStorage.getItem('prayer_timings');
    if (cached) setTimings(JSON.parse(cached));
  }, []);

  const fetchTimings = useCallback(async () => {
    const getUrl = (lat?: number, lng?: number) => {
      if (lat && lng) {
        return `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=1&school=1`;
      }
      return 'https://api.aladhan.com/v1/timingsByCity?city=Dhaka&country=Bangladesh&method=1&school=1';
    };

    const performFetch = async (lat?: number, lng?: number) => {
      try {
        const res = await fetch(getUrl(lat, lng));
        const data = await res.json();
        if (data.data) {
          setTimings(data.data.timings);
          localStorage.setItem('prayer_timings', JSON.stringify(data.data.timings));
        }
      } catch (error) {
        console.error("Failed to fetch timings:", error);
      }
    };

    // Try to get user location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          performFetch(latitude, longitude);
        },
        (error) => {
          console.warn("Location access denied or error, falling back to Dhaka:", error.message);
          performFetch(); // Fallback to Dhaka
        },
        { timeout: 10000 }
      );
    } else {
      performFetch(); // Geolocation not supported, fallback to Dhaka
    }
  }, []);

  useEffect(() => {
    if (mounted) fetchTimings();
  }, [mounted, fetchTimings]);

  useEffect(() => {
    if (!timings) return;

    const timer = setInterval(() => {
      const now = new Date();
      const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

      const timeToSeconds = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 3600 + m * 60;
      };

      const sunrise = timeToSeconds(timings.Sunrise);
      const dhuhr = timeToSeconds(timings.Dhuhr);
      const maghrib = timeToSeconds(timings.Maghrib);

      // সালাতের নিষিদ্ধ সময় ক্যালকুলেশন (আপনার ইমেজ অনুযায়ী সুনির্দিষ্ট অফসেট)
      const forbiddenRanges = [
        // ১. সূর্যোদয়ের সময় (সকাল): সূর্যোদয় থেকে ১৫ মিনিট পর্যন্ত
        { start: sunrise, end: sunrise + 15 * 60 },

        // ২. দ্বিপ্রহরের সময় (দুপুর): যুহর শুরুর ১৪ মিনিট আগে থেকে ১ মিনিট আগে পর্যন্ত
        { start: dhuhr - 14 * 60, end: dhuhr - 1 * 60 },

        // ৩. সূর্যাস্তের সময় (সন্ধ্যা): মাগরিব শুরুর ১৫ মিনিট আগে থেকে ১ মিনিট আগে পর্যন্ত
        { start: maghrib - 15 * 60, end: maghrib - 1 * 60 }
      ];

      const activeForbidden = forbiddenRanges.find(r => currentSeconds >= r.start && currentSeconds < r.end);

      const prayerSequence = [
        { name: 'Fajr', time: timeToSeconds(timings.Fajr) },
        { name: 'Sunrise', time: sunrise },
        { name: 'Ishraq', time: sunrise + 15 * 60 }, // সূর্যোদয়ের ১৫ মিনিট পর
        { name: 'Chasht', time: sunrise + 60 * 60 }, // সূর্যোদয়ের ৬০ মিনিট পর
        { name: 'Dhuhr', time: dhuhr },
        { name: 'Asr', time: timeToSeconds(timings.Asr) },
        { name: 'Maghrib', time: maghrib },
        { name: 'Isha', time: timeToSeconds(timings.Isha) }
      ];

      let currentIdx = -1;
      for (let i = 0; i < prayerSequence.length; i++) {
        if (currentSeconds >= prayerSequence[i].time) currentIdx = i;
      }

      const nextIdx = (currentIdx + 1) % prayerSequence.length;
      let nextTime = prayerSequence[nextIdx].time;
      let startTime = prayerSequence[currentIdx === -1 ? 5 : currentIdx].time;

      if (currentSeconds > prayerSequence[5].time || currentIdx === -1) {
        if (currentIdx === 5) nextTime += 24 * 3600;
        else startTime -= 24 * 3600;
      }

      const diff = nextTime - currentSeconds;
      const totalPeriod = nextTime - startTime;

      const prayerKey = activeForbidden
        ? 'Forbidden'
        : (currentIdx === -1 ? 'Tahajjud' : prayerSequence[currentIdx].name);

      setIsForbidden(!!activeForbidden);
      setCurrentPrayer(prayerKey);

      setTimeLeft({
        h: Math.floor(diff / 3600),
        m: Math.floor((diff % 3600) / 60),
        s: diff % 60
      });
      setPercentage(Math.max(0, Math.min(100, 100 - (diff / totalPeriod) * 100)));

    }, 1000);

    return () => clearInterval(timer);
  }, [timings]);

  const radius = size * 0.4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center font-bengali select-none">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="absolute transform -rotate-90" width={size} height={size}>
          <defs>
            <linearGradient id={`liquidGrad-${componentId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isForbidden ? "#ef4444" : "#0ea5e9"} />
              <stop offset="50%" stopColor={isForbidden ? "#f87171" : "#22d3ee"} />
              <stop offset="100%" stopColor={isForbidden ? "#ef4444" : "#0ea5e9"} />
            </linearGradient>
          </defs>

          {/* Tube Case */}
          <circle cx={size/2} cy={size/2} r={radius} stroke="rgba(0,0,0,0.2)" strokeWidth={size*0.12} fill="transparent" />

          {/* Progress Liquid - Using unique ID */}
          {timeLeft && (
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              stroke={`url(#liquidGrad-${componentId})`}
              strokeWidth={size * 0.1}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              fill="transparent"
              className="transition-all duration-1000 ease-linear"
            />
          )}

          {/* Highlights */}
          <circle cx={size/2} cy={size/2} r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth={size*0.04} fill="transparent" />
        </svg>

        <div className="z-10 text-center flex flex-col items-center justify-center w-full px-6 pointer-events-none">
          <p className={`font-black leading-tight drop-shadow-md ${isForbidden ? 'text-red-400' : 'text-white'}`}
             style={{ fontSize: size * 0.11 }}>
            {timeLeft ? PRAYER_NAMES[currentPrayer] : "---"}
          </p>
          <p className="text-white/40 font-semibold mb-1" style={{ fontSize: size * 0.055 }}>
            {isForbidden ? "নামাজ পড়া নিষেধ" : "শেষ হতে বাকি"}
          </p>
          <div className="text-white font-bold leading-none flex items-center justify-center" style={{ fontSize: size * 0.11 }}>
            {timeLeft ? (
              <>
                <span className="w-[1.1em] text-center">{toBengaliNumber(timeLeft.h.toString().padStart(2, '0'))}</span>
                <span className="mx-0.5 opacity-70 font-black">:</span>
                <span className="w-[1.1em] text-center">{toBengaliNumber(timeLeft.m.toString().padStart(2, '0'))}</span>
                <span className="mx-0.5 opacity-70 font-black">:</span>
                <span className={`${isForbidden ? 'text-red-400' : 'text-cyan-400'} w-[1.1em] text-center`}>{toBengaliNumber(timeLeft.s.toString().padStart(2, '0'))}</span>
              </>
            ) : (
              <span className="opacity-10">০০:০০:০০</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
