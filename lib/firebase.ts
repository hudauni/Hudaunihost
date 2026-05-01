import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
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
const db = getFirestore(app);

// Enable Offline Persistence
if (typeof window !== "undefined") {
  // Use a more modern and robust way to enable persistence
  try {
    enableMultiTabIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn("Persistence failed: Multiple tabs open.");
      } else if (err.code === 'unimplemented') {
        console.warn("Persistence is not supported by this browser.");
      }
    });
  } catch (e) {
    console.error("Firestore persistence error:", e);
  }
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Analytics is only supported in browser environments
const analytics = typeof window !== 'undefined' ? isSupported().then(yes => yes ? getAnalytics(app) : null) : null;

export { app, db, auth, googleProvider, analytics };
