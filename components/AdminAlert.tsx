"use client";

import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';

interface AdminAlertProps {
  isOpen: boolean;
  type: 'success' | 'error' | 'confirm' | 'info';
  title: string;
  message: string;
  onConfirm?: () => void;
  onClose: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function AdminAlert({
  isOpen,
  type,
  title,
  message,
  onConfirm,
  onClose,
  confirmText = "নিশ্চিত করুন",
  cancelText = "বাতিল"
}: AdminAlertProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const icons = {
    success: <CheckCircle2 className="text-emerald-500" size={40} />,
    error: <AlertCircle className="text-red-500" size={40} />,
    confirm: <Info className="text-amber-500" size={40} />,
    info: <Info className="text-blue-500" size={40} />
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={type !== 'confirm' ? onClose : undefined}
      ></div>

      <div className="relative w-full max-w-sm bg-[#001a1a] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 bg-white/5 p-3 rounded-full border border-white/5">
            {icons[type]}
          </div>

          <h3 className="text-xl font-bold text-white mb-2 font-bengali">{title}</h3>
          <p className="text-white/60 text-sm mb-8 leading-relaxed font-bengali">
            {message}
          </p>

          <div className="flex gap-3 w-full">
            {type === 'confirm' ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-sm transition-all border border-white/5"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm?.();
                    onClose();
                  }}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-900/20"
                >
                  {confirmText}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-900/20"
              >
                ঠিক আছে
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
