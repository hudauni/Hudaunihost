"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, signOut, User, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

interface AuthContextType {
  user: User | null;
  userData: any | null;
  userCollection: 'users' | 'admins';
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: (redirectPath?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [userCollection, setUserCollection] = useState<'users' | 'admins'>('users');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      import('@codetrix-studio/capacitor-google-auth').then(({ GoogleAuth }) => {
        try { GoogleAuth.initialize(); } catch (e) {}
      });
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Load user data in background, don't block the UI
        fetchAndSetUserData(firebaseUser);
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);

        // Safe redirect
        const isAuthPage = pathname?.includes('/login');
        if (!isAuthPage && pathname !== '/') {
          router.push('/login');
        }
      }
    });

    return () => unsubscribe();
  }, [mounted, pathname]);

  const fetchAndSetUserData = async (firebaseUser: User) => {
    try {
      const adminSnap = await getDoc(doc(db, "admins", firebaseUser.uid));
      const col = adminSnap.exists() ? 'admins' : 'users';
      setUserCollection(col);

      const userSnap = await getDoc(doc(db, col, firebaseUser.uid));
      if (userSnap.exists()) {
        setUserData(userSnap.data());
      }
    } catch (e) {
      console.error("Error loading user data", e);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
        const googleUser = await GoogleAuth.signIn();
        if (googleUser?.authentication?.idToken) {
          const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
          await signInWithCredential(auth, credential);
        }
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (error: any) {
      if (Capacitor.isNativePlatform()) alert("Login Error: " + error.message);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = async (redirectPath?: string) => {
    await signOut(auth);
    router.push(redirectPath || '/login');
  };

  if (!mounted) return null;

  return (
    <AuthContext.Provider value={{ user, userData, userCollection, loading, login, loginWithEmail, logout }}>
      {loading ? (
        <div className="min-h-screen bg-[#001a1a] flex flex-col items-center justify-center">
           <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
           <p className="mt-4 text-white/20 text-[10px] font-bold tracking-widest uppercase">System Loading...</p>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
