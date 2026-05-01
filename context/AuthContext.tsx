"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, signOut, User, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { Loader2 } from 'lucide-react';

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
    if (Capacitor.isNativePlatform()) {
      import('@codetrix-studio/capacitor-google-auth').then(({ GoogleAuth }) => {
        try { GoogleAuth.initialize(); } catch (e) { console.warn("GoogleAuth init failed"); }
      });
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);

          // Role check
          const adminSnap = await getDoc(doc(db, "admins", firebaseUser.uid));
          const collectionName = adminSnap.exists() ? 'admins' : 'users';
          setUserCollection(collectionName);

          // Get user data
          const userDoc = await getDoc(doc(db, collectionName, firebaseUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } else {
          setUser(null);
          setUserData(null);

          const isLoginPage = pathname?.includes('/login');
          const isHome = pathname === '/';
          if (!isLoginPage && !isHome) {
            router.push('/login');
          }
        }
      } catch (err) {
        console.error("Auth observer error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [mounted, pathname, router]);

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
        <div className="min-h-screen bg-[#001a1a] flex flex-col items-center justify-center gap-4">
           <Loader2 className="animate-spin text-emerald-500" size={40} />
           <p className="text-white/20 text-xs font-bold uppercase tracking-widest">Huda Uni Loading...</p>
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
