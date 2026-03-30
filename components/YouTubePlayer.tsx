"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  startSeconds?: number;
  onProgress?: (seconds: number) => void;
  onComplete?: () => void;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export default function YouTubePlayer({ videoId, startSeconds = 0, onProgress, onComplete }: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const maxTimeWatchedRef = useRef(startSeconds);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startTracking = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        try {
          const currentTime = playerRef.current.getCurrentTime();

          if (currentTime > maxTimeWatchedRef.current + 3) {
            playerRef.current.seekTo(maxTimeWatchedRef.current, true);
          } else {
            if (currentTime > maxTimeWatchedRef.current) {
              maxTimeWatchedRef.current = currentTime;
            }
            onProgress?.(currentTime);
          }
        } catch (e) {}
      }
    }, 1000);
  }, [onProgress]);

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

    playerRef.current = new window.YT.Player(playerDiv, {
      videoId: videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 1,
        controls: 1,
        rel: 0,
        modestbranding: 1,
        iv_load_policy: 3,
        disablekb: 1,
        start: Math.floor(startSeconds),
        origin: typeof window !== 'undefined' ? window.location.origin : '',
        enablejsapi: 1,
      },
      events: {
        onReady: (event: any) => {
          startTracking();
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.ENDED) {
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
    maxTimeWatchedRef.current = startSeconds;
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

      {/* Standard 60px Overlays for protection */}
      <div className="absolute top-0 left-0 right-0 h-[60px] z-10 bg-transparent pointer-events-auto cursor-default"></div>
      <div className="absolute bottom-0 left-0 right-0 h-[60px] z-10 bg-transparent pointer-events-auto cursor-default"></div>
    </div>
  );
}
