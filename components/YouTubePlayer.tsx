"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  startSeconds?: number;
  autoplay?: boolean;
  onProgress?: (seconds: number) => void;
  onComplete?: () => void;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export default function YouTubePlayer({ videoId, startSeconds = 0, autoplay = false, onProgress, onComplete }: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const maxTimeWatchedRef = useRef(startSeconds);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load saved progress from localStorage
  const getInitialStartTime = useCallback(() => {
    try {
      const savedProgress = localStorage.getItem(`yt_progress_${videoId}`);
      if (savedProgress) {
        const parsed = parseFloat(savedProgress);
        // If saved progress is more than startSeconds and not near the end (let's say 2 seconds buffer)
        // We don't have the duration yet, but we can at least return the saved time
        return Math.max(startSeconds, parsed);
      }
    } catch (e) {
      console.error("Error reading progress from localStorage", e);
    }
    return startSeconds;
  }, [videoId, startSeconds]);

  const startTracking = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        try {
          const currentTime = playerRef.current.getCurrentTime();

          // Save progress every second
          if (currentTime > 0) {
            localStorage.setItem(`yt_progress_${videoId}`, currentTime.toString());
          }

          maxTimeWatchedRef.current = currentTime;
          onProgress?.(currentTime);
        } catch (e) {}
      }
    }, 1000);
  }, [onProgress, videoId]);

  const initPlayer = useCallback(() => {
    if (!containerRef.current || !videoId || !window.YT || !window.YT.Player) return;

    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {}
    }

    containerRef.current.innerHTML = '';
    const playerDiv = document.createElement('div');
    containerRef.current.appendChild(playerDiv);

    const origin = typeof window !== 'undefined' ? window.location.origin.replace(/\/$/, '') : '';
    const startTime = getInitialStartTime();
    maxTimeWatchedRef.current = startTime;

    playerRef.current = new window.YT.Player(playerDiv, {
      videoId: videoId.trim(),
      width: '100%',
      height: '100%',
      host: 'https://www.youtube-nocookie.com',
      playerVars: {
        autoplay: autoplay ? 1 : 0,
        controls: 1,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        iv_load_policy: 3,
        start: Math.floor(startTime),
        origin: origin,
        enablejsapi: 1,
      },
      events: {
        onReady: (event: any) => {
          event.target.unMute();
          event.target.setVolume(100);

          if (autoplay) {
            event.target.playVideo();

            // Check if browser blocked it, then fallback to muted
            setTimeout(() => {
              if (event.target.getPlayerState() !== 1 && event.target.getPlayerState() !== 3) {
                event.target.mute();
                event.target.playVideo();
              }
            }, 1200);
          }
          startTracking();
        },
        onStateChange: (event: any) => {
          // If user manually plays or browser allows, try to unmute
          if (event.data === window.YT.PlayerState.PLAYING) {
            // Some browsers allow unmuting after the first interaction
            if (event.target.isMuted()) {
              event.target.unMute();
              event.target.setVolume(100);
            }
          }
          if (event.data === window.YT.PlayerState.ENDED) {
            localStorage.removeItem(`yt_progress_${videoId}`);
            onComplete?.();
          }
        },
        onError: (e: any) => {
          console.error("YouTube Player Error Code:", e.data);
          if (e.data === 150 || e.data === 101) {
            setError("এই ভিডিওটি ইউটিউব থেকে সরাসরি দেখার অনুমতি নেই।");
          } else {
            setError("ভিডিও লোড হতে সমস্যা হচ্ছে।");
          }
        }
      }
    });
  }, [videoId, startSeconds, onComplete, startTracking]);

  useEffect(() => {
    setError(null);

    const loadVideo = () => {
      if (window.YT && window.YT.Player) {
        initPlayer();
      } else {
        if (!document.getElementById('youtube-sdk')) {
          const tag = document.createElement('script');
          tag.id = 'youtube-sdk';
          tag.src = "https://www.youtube.com/iframe_api";
          const firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }

        const prevOnReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (prevOnReady) prevOnReady();
          initPlayer();
        };
      }
    };

    loadVideo();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
      }
    };
  }, [videoId, initPlayer, startSeconds]);

  return (
    <div className="w-full aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/10 relative group">
      <div ref={containerRef} className="w-full h-full"></div>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#001a1a] p-10 text-center z-20">
          <p className="text-red-400 font-bold font-bengali text-lg">{error}</p>
        </div>
      )}

      {/* --- RESPONSIVE OVERLAYS --- */}
      {/* Top Protection - Increased to cover title area better */}
      <div className="absolute top-0 left-0 right-0 h-[32%] z-10 bg-transparent pointer-events-auto cursor-default"></div>

      {/* Bottom Protection - Increased to 20% */}
      <div className="absolute bottom-0 left-0 right-0 h-[20%] z-10 bg-transparent pointer-events-auto cursor-default"></div>

      {/* Right Protection */}
      <div className="absolute top-[35%] bottom-[20%] right-0 w-[25%] z-10 bg-transparent pointer-events-auto cursor-default"></div>

      {/* Left Protection - 18% */}
      <div className="absolute top-[35%] bottom-[20%] left-0 w-[18%] z-10 bg-transparent pointer-events-auto cursor-default"></div>
    </div>
  );
}
