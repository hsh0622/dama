import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Check if configuration is fully populated in actual env
const isFirebaseConfigured = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
);

// Firebase configuration with dummy fallbacks to prevent Auth SDK crashing on startup
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key-for-dama-sandbox",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock-auth-domain-for-dama-sandbox.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock-bucket.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:mockapp"
};

if (!isFirebaseConfigured) {
  console.warn(
    '담아: Firebase 설정 변수(VITE_FIREBASE_*)가 .env에 존재하지 않거나 불완전합니다. ' +
    '오프라인 체험/가상 시뮬레이터(Simulation Mode)로 완벽하게 대화형 데모를 시작합니다.'
  );
}

// Initialize Firebase client
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, isFirebaseConfigured };
export default app;
