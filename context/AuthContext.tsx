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
    // Initialize GoogleAuth only on Client and for Native Platforms
    if (Capacitor.isNativePlatform()) {
      const initGoogle = async () => {
        try {
          const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
          await GoogleAuth.initialize();
        } catch (e) {
          console.warn("GoogleAuth init failed:", e);
        }
      };
      initGoogle();
    }
  }, []);

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);

          // Initial sync/create user if needed
          const result = await syncUserData(firebaseUser);
          setUserData(result.data);
          setUserCollection(result.collection);

          // Setup real-time listener for user data
          const userRef = doc(db, result.collection, firebaseUser.uid);
          unsubscribeUserDoc = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              setUserData(docSnap.data());
            } else {
              setUserData(null);
            }
          });

        } else {
          setUser(null);
          setUserData(null);
          setUserCollection('users'); // Reset to default
          if (unsubscribeUserDoc) {
            unsubscribeUserDoc();
            unsubscribeUserDoc = null;
          }

          if (pathname && !pathname.startsWith('/login') && !pathname.startsWith('/admin')) {
             router.push('/login');
          }
        }
      } catch (error) {
        console.error("Auth sync error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, [pathname, router]);

  useEffect(() => {
    if (!loading && !user && pathname && !pathname.startsWith('/login') && !pathname.startsWith('/admin')) {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  const syncUserData = async (firebaseUser: User): Promise<{data: any, collection: 'users' | 'admins'}> => {
    const adminRef = doc(db, "admins", firebaseUser.uid);
    const adminSnap = await getDoc(adminRef);

    if (adminSnap.exists()) {
      return { data: adminSnap.data(), collection: 'admins' };
    }

    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return { data: userSnap.data(), collection: 'users' };
    } else {
      try {
        const newData = await runTransaction(db, async (transaction) => {
          const counterRef = doc(db, "counters", "users");
          const counterSnap = await transaction.get(counterRef);

          let nextId = 1;
          if (counterSnap.exists()) {
            nextId = counterSnap.data().lastId + 1;
          }

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
      } catch (error) {
        console.error("Transaction failed: ", error);
        return { data: null, collection: 'users' };
      }
    }
  };

  const login = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
        const googleUser = await GoogleAuth.signIn();
        if (googleUser && googleUser.authentication.idToken) {
          const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
          await signInWithCredential(auth, credential);
        } else {
          alert("Google ID Token not found.");
        }
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      if (Capacitor.isNativePlatform()) {
        alert("Login Error: " + (error.message || JSON.stringify(error)));
      }
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Email login failed:", error);
      throw error;
    }
  };

  const logout = async (redirectPath?: string) => {
    try {
      await signOut(auth);
      router.push(redirectPath || '/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, userCollection, loading, login, loginWithEmail, logout }}>
      {hasMounted ? children : null}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
