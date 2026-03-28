"use client";

import React from 'react';

interface GlassButtonProps {
  title: string;
  subtitle?: string;
  variant: 'service-mobile' | 'service-desktop' | 'membership-mobile' | 'membership-desktop';
  onClick?: () => void;
  className?: string;
}

export default function GlassButton({ title, subtitle, variant, onClick, className = "" }: GlassButtonProps) {
  const baseClasses = "relative group transition-all duration-300 active:scale-95 flex flex-col items-center justify-center text-center";

  const variants = {
    'service-mobile': "w-full py-3 px-4 bg-gradient-to-br from-[#1a472a]/70 to-[#001a1a]/90 backdrop-blur-xl rounded-2xl border-t border-white/30 border-l border-white/20 shadow-[0_8px_15px_rgba(0,0,0,0.5),inset_0_-2px_4px_rgba(0,0,0,0.3)] border border-white/10 min-h-[70px] active:translate-y-1",

    'service-desktop': "p-6 bg-gradient-to-br from-white/[0.08] to-transparent backdrop-blur-3xl rounded-[2rem] border-t border-white/30 border-l border-white/20 shadow-[0_15px_35px_rgba(0,0,0,0.4),inset_0_-2px_6px_rgba(0,0,0,0.2)] hover:bg-emerald-500/10 hover:border-emerald-500/30 transform hover:-translate-y-1.5 h-full min-h-[110px]",

    'membership-mobile': "w-full py-3 px-6 bg-gradient-to-br from-[#1a472a]/70 to-[#001a1a]/90 backdrop-blur-xl rounded-full border-t border-white/30 border-l border-white/20 shadow-[0_8px_15px_rgba(0,0,0,0.5),inset_0_-2px_4px_rgba(0,0,0,0.3)] border border-white/10 active:translate-y-1",

    'membership-desktop': "w-full py-4 px-8 bg-gradient-to-br from-white/[0.08] to-transparent backdrop-blur-3xl rounded-full border-t border-white/30 border-l border-white/20 shadow-[0_15px_35px_rgba(0,0,0,0.4),inset_0_-2px_6px_rgba(0,0,0,0.2)] hover:bg-emerald-500/10 hover:border-emerald-500/30 transform hover:-translate-y-1",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      <div className="w-full px-1">
        <span className={`
          ${variant.includes('mobile') ? "text-white text-[14px] font-bold tracking-wide drop-shadow-md" : ""}
          ${variant.includes('desktop') ? "text-white text-xl font-bold tracking-wide group-hover:text-emerald-400 transition-colors drop-shadow-lg" : ""}
        `}>
          {title}
        </span>

        {subtitle && (
          <p className={`
            ${variant === 'service-mobile' ? "text-white/40 text-[9px] font-bold mt-1 leading-tight uppercase tracking-wider" : ""}
            ${variant === 'service-desktop' ? "text-white/30 text-[11px] font-bold uppercase tracking-widest mt-2" : ""}
          `}>
            {subtitle}
          </p>
        )}
      </div>
    </button>
  );
}
