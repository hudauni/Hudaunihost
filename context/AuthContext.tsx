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
import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction
} from 'firebase/firestore';
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
  const [hasMounted, setHasMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setHasMounted(true);

    // Google Auth Initialization for Native App only
    if (Capacitor.isNativePlatform()) {
      import('@codetrix-studio/capacitor-google-auth').then(({ GoogleAuth }) => {
        try { GoogleAuth.initialize(); } catch (e) { console.warn("GoogleAuth init failed", e); }
      }).catch(err => console.error("Plugin load failed", err));
    }
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          const result = await syncUserData(firebaseUser);
          setUserData(result.data);
          setUserCollection(result.collection);

          const userRef = doc(db, result.collection, firebaseUser.uid);
          unsubscribeUserDoc = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              setUserData(docSnap.data());
            }
          });
        } else {
          setUser(null);
          setUserData(null);
          setUserCollection('users');
          if (unsubscribeUserDoc) {
            unsubscribeUserDoc();
            unsubscribeUserDoc = null;
          }

          // Safe Redirect logic
          const isAuthPage = pathname?.includes('/login');
          const isAdminRoute = pathname?.startsWith('/admin');
          if (!isAuthPage && !isAdminRoute && pathname !== '/') {
             router.push('/login');
          }
        }
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, [hasMounted]); // Only run once on mount

  const syncUserData = async (firebaseUser: User): Promise<{data: any, collection: 'users' | 'admins'}> => {
    try {
      const adminRef = doc(db, "admins", firebaseUser.uid);
      const adminSnap = await getDoc(adminRef);
      if (adminSnap.exists()) return { data: adminSnap.data(), collection: 'admins' };

      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) return { data: userSnap.data(), collection: 'users' };

      const newData = await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, "counters", "users");
        const counterSnap = await transaction.get(counterRef);
        let nextId = 1;
        if (counterSnap.exists()) nextId = counterSnap.data().lastId + 1;
        const data = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          photoURL: firebaseUser.photoURL,
          role: 'associate',
          associateId: nextId,
          createdAt: new Date().toISOString()
        };
        transaction.set(userRef, data);
        transaction.set(counterRef, { lastId: nextId }, { merge: true });
        return data;
      });
      return { data: newData, collection: 'users' };
    } catch (e) {
      return { data: null, collection: 'users' };
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

  if (!hasMounted) return <div style={{background: '#001a1a', minHeight: '100vh'}} />;

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
