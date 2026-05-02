"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, signOut, User, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
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
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Sync AssociateId to LocalStorage for offline/immediate access
  useEffect(() => {
    if (userData?.associateId) {
      localStorage.setItem('cached_associate_id', userData.associateId);
    }
  }, [userData]);

  useEffect(() => {
    setIsClient(true);

    // Auth Listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);

          // Background fetch user data
          const adminRef = doc(db, "admins", firebaseUser.uid);
          const adminSnap = await getDoc(adminRef);
          const col = adminSnap.exists() ? 'admins' : 'users';
          setUserCollection(col);

          const userDoc = await getDoc(doc(db, col, firebaseUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } else {
          setUser(null);
          setUserData(null);
          setUserCollection('users');

          // Redirect if needed
          if (pathname !== '/' && !pathname?.includes('/login')) {
            router.push('/login');
          }
        }
      } catch (err) {
        console.error("Auth sync error:", err);
      } finally {
        setLoading(false);
      }
    });

    // Initialize Native Google Auth
    if (Capacitor.isNativePlatform()) {
      import('@codetrix-studio/capacitor-google-auth').then(({ GoogleAuth }) => {
        try { GoogleAuth.initialize(); } catch (e) {}
      }).catch(e => console.warn("GoogleAuth plugin not found"));
    }

    return () => unsubscribe();
  }, [pathname, router]);

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

  // Avoid hydration mismatch by rendering a stable background first
  if (!isClient) return <div className="min-h-screen bg-[#001a1a]" />;

  return (
    <AuthContext.Provider value={{ user, userData, userCollection, loading, login, loginWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
