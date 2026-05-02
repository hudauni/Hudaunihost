"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Play, Loader2, User, Zap, Bell, FileText, X, Info } from 'lucide-react';
import Navbar from '@/components/Navbar';
import AssociateId from '@/components/AssociateId';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, orderBy, getDocs, where, onSnapshot } from 'firebase/firestore';
import { getCache, setCache } from '@/lib/cache';

// Lazy load heavy components
const PrayerTimeCircle = dynamic(() => import('@/components/PrayerTimeCircle'), {
  ssr: false,
  loading: () => <div className="w-[150px] h-[150px] rounded-full bg-white/5 animate-pulse flex items-center justify-center text-[10px] text-white/20">Loading Times...</div>
});

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const { user, userData, loading: authLoading } = useAuth();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [promoVideos, setPromoVideos] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // Modal State for Video Details
  const [selectedVideoDetails, setSelectedVideoDetails] = useState<{title: string, details: string} | null>(null);

  const [isDesktop, setIsDesktop] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    // Listen for unread notifications
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "in", [user.uid, "all"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lastRead = userData?.lastReadNotifications?.toDate() || new Date(0);

      const unread = snapshot.docs.filter(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate();
        return createdAt > lastRead;
      });

      setUnreadCount(unread.length);
    });

    return () => unsubscribe();
  }, [user, userData]);

  // Refs for Autoplay Logic
  const videoElementsRef = useRef<{[key: string]: HTMLDivElement | null}>({});

  useEffect(() => {
    setMounted(true);
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Facebook-style Autoplay on Scroll Logic (Plays only when in the center)
  useEffect(() => {
    if (promoVideos.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '-45% 0% -45% 0%',
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        const videoId = entry.target.getAttribute('data-video-id');
        if (entry.isIntersecting) {
          if (videoId) {
            setPlayingVideoId(videoId);
          }
        } else {
          // If the video that was playing leaves the center area, stop it
          setPlayingVideoId(current => (current === videoId ? null : current));
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all video card elements
    Object.values(videoElementsRef.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [promoVideos]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      const cachedLogo = getCache('logoUrl');
      const cachedMenu = getCache('homeMenu');
      const cachedVideos = getCache('homeVideos');

      if (cachedLogo) setLogoUrl(cachedLogo);
      if (cachedMenu) setMenuItems(cachedMenu);
      if (cachedVideos) setPromoVideos(cachedVideos);

      if (cachedLogo && cachedMenu && cachedVideos) {
        setDataLoading(false);
      }

      try {
        const [settingsSnap, menuSnap, videosSnap] = await Promise.all([
          getDoc(doc(db, "settings", "general")),
          getDocs(query(collection(db, "homeMenu"), orderBy("order", "asc"))),
          getDocs(query(collection(db, "homeVideos"), orderBy("createdAt", "desc")))
        ]);

        const fetchedLogo = settingsSnap.exists() ? settingsSnap.data().logoUrl : null;
        const fetchedMenu = menuSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const fetchedVideos = videosSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        setLogoUrl(fetchedLogo);
        setMenuItems(fetchedMenu);
        setPromoVideos(fetchedVideos);

        setCache('logoUrl', fetchedLogo);
        setCache('homeMenu', fetchedMenu);
        setCache('homeVideos', fetchedVideos);

      } catch (e) {
        console.error("Error fetching homepage data:", e);
      } finally {
        setDataLoading(false);
      }
    }

    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  if (!mounted || authLoading || (dataLoading && menuItems.length === 0)) {
    return (
      <div className="min-h-screen bg-[#001a1a] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen w-full bg-[#001a1a] flex flex-col font-sans" suppressHydrationWarning>
      <Navbar />

      <main className="relative flex-1 w-full flex flex-col items-center lg:pt-[73px]">

        {/* --- MOBILE VERSION --- */}
        <div
          className="lg:hidden w-full min-h-screen flex flex-col items-center bg-no-repeat overflow-hidden relative bg-[#002b2b]"
          style={{
            backgroundImage: "url('/images/mainimg.webp')",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
          }}
        >
          {/* Header Action Buttons Wrapper */}
          <div className="absolute top-6 right-6 flex items-center gap-2 z-50 p-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-2xl">
            {/* Notification Icon */}
            <Link
              href="/notifications"
              className="relative p-2.5 bg-white/5 hover:bg-white/10 rounded-full active:scale-90 transition-all"
            >
              <Bell size={20} className="text-white" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-black animate-pulse"></span>
              )}
            </Link>

            {/* Profile Icon */}
            <Link
              href="/profile"
              className="p-2.5 bg-gradient-to-br from-[#d4af37] via-[#f9d71c] to-[#b8860b] rounded-full active:scale-90 transition-all shadow-lg"
            >
              <User size={20} className="text-[#1a472a] stroke-[3]" />
            </Link>
          </div>

          <div className="w-full max-w-[360px] flex flex-col items-center z-10 px-4">
            <div className="flex flex-col items-center pt-[90px] text-center space-y-1">
              {logoUrl ? (
                <div className="relative h-16 w-40 mb-2">
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
                </div>
              ) : (
                <h1 className="text-3xl font-bold text-white italic tracking-tighter" style={{ fontFamily: 'serif' }}>
                  Huda <span className="text-cyan-400">Uni</span>
                </h1>
              )}
              <div className="mt-3">
                <p className="text-white/90 text-[11px] font-medium font-bengali leading-relaxed">
                  আসসালামু আলাইকুম {userData?.displayName || user?.displayName || user?.email?.split('@')[0]}!<br />
                  আপনার অ্যাসোসিয়েট আইডি - <AssociateId className="text-cyan-300 font-bold" />
                </p>
              </div>
            </div>

            {/* SCROLLABLE AREA */}
            <div
              className="mt-2 w-full max-h-[550px] overflow-y-auto custom-scrollbar px-2 flex flex-col items-center pb-10"
            >
              <div className="mt-2 mb-1 shrink-0"><PrayerTimeCircle size={150} /></div>

              <div className="flex flex-col items-center space-y-3 w-full mt-2">
                {menuItems.map((item) => {
                  const isHierarchy = item.type === 'hierarchy';
                  const href = isHierarchy ? `/explore/category/?id=${item.id}` : (item.href.endsWith('/') ? item.href : `${item.href}/`);
                  return (
                    <Link
                      key={item.id}
                      href={href}
                      className="relative w-full max-w-[320px] py-3 px-6 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-between border border-white/10 shadow-lg active:scale-95 transition-all flex-shrink-0"
                    >
                      <span className="text-white text-[14px] font-bold tracking-wide flex-1 text-center font-bengali">{item.title}</span>
                    </Link>
                  );
                })}

                {!isDesktop && promoVideos.map((video) => (
                  <div
                    key={video.id}
                    ref={(el) => { videoElementsRef.current[video.id] = el; }}
                    data-video-id={video.youtubeId}
                    className="w-full flex-shrink-0 space-y-1.5 pt-2"
                  >
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-white/10 shadow-xl bg-black">
                      {playingVideoId === video.youtubeId ? (
                        <div className="relative w-full h-full">
                          <iframe
                            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&modestbranding=1&rel=0&enablejsapi=1&playsinline=1`}
                            title={video.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="w-full h-full"
                          ></iframe>

                          {/* --- MOBILE RESPONSIVE OVERLAYS --- */}
                          <div className="absolute top-0 left-0 right-0 h-[30%] z-10 bg-transparent pointer-events-auto cursor-default"></div>
                          <div className="absolute bottom-0 left-0 right-0 h-[20%] z-10 bg-transparent pointer-events-auto cursor-default"></div>
                          <div className="absolute top-0 bottom-0 right-0 w-[30%] z-10 bg-transparent pointer-events-auto cursor-default"></div>
                          <div className="absolute top-0 bottom-0 left-0 w-[30%] z-10 bg-transparent pointer-events-auto cursor-default"></div>
                        </div>
                      ) : (
                        <div onClick={() => setPlayingVideoId(video.youtubeId)} className="relative w-full h-full group cursor-pointer">
                          <img
                            src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                            alt={video.title}
                            className="w-full h-full object-cover opacity-60"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play size={18} className="text-white fill-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="w-full text-center px-4">
                      <h4 className="text-white font-bold font-bengali text-[13px] drop-shadow-md leading-tight">{video.title}</h4>
                    </div>

                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => setSelectedVideoDetails({title: video.title, details: video.details})}
                        className="flex-1 py-3 bg-black hover:bg-black/80 text-white border border-white/10 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                      >
                        <FileText size={14} className="text-emerald-400" /> বিবরণ
                      </button>

                      <Link
                        href={`/enroll/?course=${encodeURIComponent(video.title)}`}
                        className="flex-[2] py-3 bg-white text-black rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
                      >
                        <Zap size={14} fill="currentColor" /> Enroll Now
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- DESKTOP VERSION --- */}
        <div
          className="hidden lg:flex w-full min-h-[calc(100vh-73px)] relative bg-no-repeat bg-cover bg-center overflow-hidden"
          style={{ backgroundImage: "url('/images/mainimg.webp')" }}
        >
          <div className="absolute inset-0 bg-[#001a1a]/80 backdrop-blur-sm opacity-90"></div>
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>

          <div
            className="relative z-10 w-full max-7-xl mx-auto flex items-center justify-between px-20 h-full overflow-y-auto custom-scrollbar"
          >
            <div className="flex flex-col space-y-12 animate-in fade-in slide-in-from-left-8 duration-1000">
              <div className="space-y-4">
                {logoUrl ? (
                  <div className="relative h-32 w-64 mb-4">
                    <img src={logoUrl} alt="Logo" className="h-full w-full object-contain drop-shadow-2xl" />
                  </div>
                ) : (
                  <h1 className="text-8xl font-black text-white italic tracking-tighter" style={{ fontFamily: 'serif' }}>
                    Huda <span className="text-emerald-400">Uni</span>
                  </h1>
                )}
                <p className="text-emerald-100/40 text-xl tracking-[0.4em] uppercase font-light">International Islamic University System</p>
                <div className="flex items-center space-x-8">
                  <div className="inline-flex flex-col px-6 py-3 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md text-center text-white">
                    <p className="text-white/60 text-sm font-medium font-bengali mb-1">স্বাগতম, {userData?.displayName}</p>
                    <p className="text-white/40 text-xs font-medium uppercase tracking-widest border-t border-white/10 pt-2">ID: <AssociateId className="text-emerald-400 font-bold ml-2" /></p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-4 backdrop-blur-md shadow-2xl"><PrayerTimeCircle size={120} /></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col w-[480px] h-[650px] py-10">
              <h3 className="text-white/40 text-xs font-bold uppercase tracking-[0.3em] mb-6 pl-4 border-l-2 border-emerald-500 flex-shrink-0">Academic Navigation</h3>
              <div className="flex flex-col space-y-4 overflow-y-auto pr-6 custom-scrollbar pb-10">
                {menuItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href.endsWith('/') ? item.href : `${item.href}/`}
                    className="group relative w-full py-5 px-8 bg-white/[0.05] backdrop-blur-3xl rounded-full flex items-center justify-center transition-all duration-300 border border-white/10 shadow-2xl hover:bg-white/[0.08] hover:translate-x-2 flex-shrink-0"
                  >
                    <span className="text-white text-xl font-bold tracking-wide group-hover:text-emerald-400 transition-colors font-bengali">{item.title}</span>
                  </Link>
                ))}

                {isDesktop && promoVideos.map((video) => (
                  <div
                    key={video.id}
                    ref={(el) => { videoElementsRef.current[video.id] = el; }}
                    data-video-id={video.youtubeId}
                    className="space-y-4 pt-10"
                  >
                    <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-xl bg-black">
                      {playingVideoId === video.youtubeId ? (
                        <div className="relative w-full h-full">
                          <iframe
                            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&modestbranding=1&rel=0&enablejsapi=1&playsinline=1`}
                            title={video.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="w-full h-full"
                          ></iframe>

                          <div className="absolute top-0 left-0 right-0 h-[80px] z-10 bg-transparent pointer-events-auto cursor-default"></div>
                          <div className="absolute bottom-0 left-0 right-0 h-[60px] z-10 bg-transparent pointer-events-auto cursor-default"></div>
                          <div className="absolute top-0 bottom-0 right-0 w-[120px] z-10 bg-transparent pointer-events-auto cursor-default"></div>
                          <div className="absolute top-0 bottom-0 left-0 w-[120px] z-10 bg-transparent pointer-events-auto cursor-default"></div>
                        </div>
                      ) : (
                        <div onClick={() => setPlayingVideoId(video.youtubeId)} className="relative w-full h-full group cursor-pointer">
                          <img
                            src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                            alt={video.title}
                            className="w-full h-full object-cover opacity-40 group-hover:opacity-80 transition-all"
                          />
                          <div className="absolute inset-0 flex items-center justify-center"><Play size={40} className="text-white fill-white/20" /></div>
                          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-center">
                            <h4 className="text-white font-bold text-lg font-bengali">{video.title}</h4>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => setSelectedVideoDetails({title: video.title, details: video.details})}
                        className="flex-1 py-4 bg-black hover:bg-black/80 text-white border border-white/10 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
                      >
                        <FileText size={20} className="text-emerald-400" /> বিস্তারিত বিবরণ
                      </button>

                      <Link
                        href={`/enroll/?course=${encodeURIComponent(video.title)}`}
                        className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl transition-all"
                      >
                        <Zap size={18} fill="currentColor" /> Enroll Now
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* --- FULLSCREEN VIDEO DETAILS MODAL --- */}
      {selectedVideoDetails && (
        <div className="fixed inset-0 z-[100] bg-[#001a1a] animate-in slide-in-from-bottom duration-300 flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#002b2b]">
            <h3 className="text-white font-bold font-bengali truncate mr-4">{selectedVideoDetails.title}</h3>
            <button
              onClick={() => setSelectedVideoDetails(null)}
              className="p-2 bg-white/5 rounded-full text-white/60 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="flex items-center gap-3 text-emerald-400 font-black uppercase tracking-[0.3em] text-xs">
                <Info size={18} /> বিস্তারিত বিবরণ
              </div>
              <div className="text-white/80 leading-relaxed font-bengali text-lg whitespace-pre-wrap pb-20">
                {selectedVideoDetails.details || "কোনো বিবরণ দেওয়া হয়নি।"}
              </div>
            </div>
          </div>
          <div className="p-6 bg-[#002b2b] border-t border-white/5">
             <button
               onClick={() => setSelectedVideoDetails(null)}
               className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold uppercase tracking-widest shadow-xl"
             >
               বন্ধ করুন
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
