import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// Uses environment variables for security, falls back to hardcoded values for development
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCbbeOEamrnIFOdkFhIudvhuwGTyi-szi0",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "nitrobyipro.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "nitrobyipro",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "nitrobyipro.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "862734502458",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:862734502458:web:f05e63f66e4f9438758303",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-4JNQLB800Q"
};

// Initialize Firebase (prevent re-initialization in development)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Auth Providers
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Analytics (only in browser)
export const initAnalytics = async () => {
    if (typeof window !== 'undefined' && await isSupported()) {
        return getAnalytics(app);
    }
    return null;
};

export default app;
