"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';
import { auth, googleProvider, db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  runTransaction
} from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: (redirectPath?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          const data = await syncUserData(firebaseUser);
          setUserData(data);
        } else {
          setUser(null);
          setUserData(null);
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

    return () => unsubscribe();
  }, []); // Only run once on mount

  // Separate effect for redirection to avoid re-subscribing to auth
  useEffect(() => {
    if (!loading && !user && pathname && !pathname.startsWith('/login') && !pathname.startsWith('/admin')) {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  const syncUserData = async (firebaseUser: User) => {
    // First, check if the user exists in the 'admins' collection
    const adminRef = doc(db, "admins", firebaseUser.uid);
    const adminSnap = await getDoc(adminRef);

    if (adminSnap.exists()) {
      return adminSnap.data();
    }

    // If not an admin, check the 'users' collection
    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      try {
        return await runTransaction(db, async (transaction) => {
          const counterRef = doc(db, "counters", "users");
          const counterSnap = await transaction.get(counterRef);

          let nextId = 1;
          if (counterSnap.exists()) {
            nextId = counterSnap.data().lastId + 1;
          }

          const data = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: 'associate',
            associateId: nextId,
            createdAt: new Date().toISOString()
          };

          transaction.set(userRef, data);
          transaction.set(counterRef, { lastId: nextId }, { merge: true });

          return data;
        });
      } catch (error) {
        console.error("Transaction failed: ", error);
        return null;
      }
    }
  };

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
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
    <AuthContext.Provider value={{ user, userData, loading, login, loginWithEmail, logout }}>
      {children}
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
