"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  User,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, runTransaction } from 'firebase/firestore';
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
    if (Capacitor.isNativePlatform()) {
      import('@codetrix-studio/capacitor-google-auth').then(({ GoogleAuth }) => {
        try { GoogleAuth.initialize(); } catch (e) {}
      });
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Quick check for admin role
        const adminRef = doc(db, "admins", firebaseUser.uid);
        const adminSnap = await getDoc(adminRef);
        const collectionName = adminSnap.exists() ? 'admins' : 'users';
        setUserCollection(collectionName);

        // Simple listener for data
        const unsubDoc = onSnapshot(doc(db, collectionName, firebaseUser.uid), (snap) => {
          if (snap.exists()) setUserData(snap.data());
          setLoading(false);
        });

        return () => unsubDoc();
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
        if (pathname !== '/' && !pathname.includes('/login')) {
          router.push('/login');
        }
      }
    });

    return () => unsubscribeAuth();
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
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
      throw e;
    }
  };

  const logout = async (redirectPath?: string) => {
    try {
      await signOut(auth);
      router.push(redirectPath || '/login');
    } catch (e) {}
  };

  if (!mounted) return <div className="min-h-screen bg-[#001a1a]" />;

  return (
    <AuthContext.Provider value={{ user, userData, userCollection, loading, login, loginWithEmail, logout }}>
      <div className={loading ? "opacity-0" : "opacity-100 transition-opacity duration-500"}>
        {children}
      </div>
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
