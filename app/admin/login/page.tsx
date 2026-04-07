"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, LogOut, AlertCircle, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const { user, userData, loginWithEmail, logout, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user && userData && !loading) {
      if (userData.role === 'admin') {
        router.push('/admin');
      }
    }
  }, [user, userData, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      setError('Access Denied: Invalid credentials');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  const isNotAdmin = user && userData && userData.role !== 'admin';

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#020617] relative overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#002b2b_0%,transparent_50%)] opacity-20"></div>
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
      </div>

      <div className="w-full max-w-[400px] z-10 animate-in fade-in duration-1000 slide-in-from-bottom-4">
        {/* Logo / Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative group">
            <div className="absolute -inset-1 bg-emerald-500 rounded-sm blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative w-14 h-14 bg-[#020617] border border-emerald-500/30 flex items-center justify-center rounded-sm">
              <ShieldCheck className="text-emerald-500" size={28} />
            </div>
          </div>
          <h1 className="mt-6 text-2xl font-light tracking-[0.2em] text-white uppercase">
            Huda <span className="font-bold text-emerald-500">Uni</span>
          </h1>
          <div className="h-[1px] w-12 bg-emerald-500/50 mt-2"></div>
          <p className="mt-4 text-[10px] tracking-[0.3em] text-emerald-500/60 uppercase font-medium">Administrative Gateway</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0f172a]/40 backdrop-blur-md border border-white/5 p-8 rounded-sm shadow-2xl relative overflow-hidden group">
          {/* Subtle top border accent */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>

          {isNotAdmin ? (
            <div className="space-y-6 py-4">
              <div className="border-l-2 border-red-500 bg-red-500/5 p-4">
                <p className="text-red-400 text-xs font-medium leading-relaxed">
                  Authentication successful, but role <span className="text-white uppercase font-bold text-[10px] ml-1 px-1.5 py-0.5 bg-red-500/20 rounded-sm">Unauthorized</span>
                </p>
                <p className="text-white/40 text-[10px] mt-2 italic">{user.email}</p>
              </div>

              <button
                onClick={() => logout('/admin/login')}
                className="w-full py-4 bg-white/5 hover:bg-red-500/10 text-white border border-white/10 hover:border-red-500/30 rounded-sm flex items-center justify-center gap-3 text-xs font-bold tracking-widest uppercase transition-all duration-300"
              >
                <LogOut size={16} />
                Switch Account
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="group relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-500 transition-colors">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    placeholder="ADMIN IDENTIFIER"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/[0.03] border border-white/10 rounded-sm py-4 pl-12 pr-4 text-xs text-white placeholder:text-white/20 placeholder:tracking-[0.1em] focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.05] transition-all tracking-wider"
                  />
                </div>

                <div className="group relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-500 transition-colors">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="ACCESS KEY"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-white/[0.03] border border-white/10 rounded-sm py-4 pl-12 pr-12 text-xs text-white placeholder:text-white/20 placeholder:tracking-[0.1em] focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.05] transition-all tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
                  <AlertCircle className="text-red-400" size={14} />
                  <span className="text-red-400 text-[10px] font-bold tracking-wider uppercase">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full group/btn relative py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm flex items-center justify-center gap-3 text-xs font-black tracking-[0.2em] uppercase transition-all duration-500 overflow-hidden disabled:opacity-50"
              >
                <div className="absolute inset-0 w-1/4 h-full bg-white/20 -skew-x-[45deg] -translate-x-[200%] group-hover/btn:translate-x-[400%] transition-transform duration-1000 ease-in-out"></div>
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    Authorize Access
                    <ArrowRight className="group-hover/btn:translate-x-1 transition-transform" size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-4">
             <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-emerald-500 animate-pulse"></div>
                <p className="text-[9px] text-white/30 tracking-[0.2em] uppercase font-bold">Encrypted Connection</p>
             </div>

             <button
               onClick={() => router.push('/')}
               className="text-[10px] text-white/40 hover:text-emerald-400 transition-colors tracking-widest uppercase font-medium flex items-center gap-2 group/back"
             >
               <span className="group-hover/back:-translate-x-1 transition-transform">←</span>
               Main System
             </button>
          </div>
        </div>
      </div>

      {/* Footer Version Info */}
      <div className="absolute bottom-8 left-0 w-full flex justify-center opacity-20 pointer-events-none">
        <div className="flex items-center gap-4 text-[9px] font-mono tracking-[0.5em] text-white uppercase">
          <span>Huda.Terminal</span>
          <span className="w-1 h-1 bg-white rounded-full"></span>
          <span>Build.2.0.4</span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in-from-bottom {
          from { transform: translateY(10px); }
          to { transform: translateY(0); }
        }
        .animate-in {
          animation: fade-in 0.8s ease-out forwards, slide-in-from-bottom 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
