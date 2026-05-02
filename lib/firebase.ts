import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCoeSRWcstzktaNSuiiH5YdYo4_6XMNfk0",
  authDomain: "hudauni2u.firebaseapp.com",
  projectId: "hudauni2u",
  storageBucket: "hudauni2u.firebasestorage.app",
  messagingSenderId: "650683096129",
  appId: "1:650683096129:web:9b7ac6c0fb653708c4bac0",
  measurementId: "G-ZC4BVN3VX3"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with Persistence enabled
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Analytics is only supported in browser environments
const analytics = typeof window !== 'undefined' ? isSupported().then(yes => yes ? getAnalytics(app) : null) : null;

export { app, db, auth, googleProvider, analytics };
