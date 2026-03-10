/**
 * ─────────────────────────────────────────────────────────────
 *  FIREBASE SETUP — fill in your project's config values below
 * ─────────────────────────────────────────────────────────────
 *
 *  1. Go to https://console.firebase.google.com
 *  2. Click "Add project" → give it any name → Continue
 *  3. Skip Google Analytics → Create project
 *  4. In the left sidebar: Build → Firestore Database
 *     → Create database → Start in test mode → Next → Enable
 *  5. Click the gear icon ⚙ → Project settings
 *  6. Scroll to "Your apps" → click </> (Web) → register app
 *  7. Copy the firebaseConfig values below
 * ─────────────────────────────────────────────────────────────
 */

import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, getFirestore, enableNetwork } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDJoXIZIpyLf9HF3kvsc3N97qblc5y5rq4",
  authDomain: "myaishoppinglist.firebaseapp.com",
  projectId: "myaishoppinglist",
  storageBucket: "myaishoppinglist.firebasestorage.app",
  messagingSenderId: "568169448457",
  appId: "1:568169448457:web:2835127b9e5e83e0c8e4d8"
};

export const isFirebaseConfigured =
  firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
  firebaseConfig.projectId !== 'YOUR_PROJECT_ID';

// Initialise once (Expo hot-reload safe)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

function createDb() {
  try {
    // initializeFirestore must be called before getFirestore; throws on hot-reload
    return initializeFirestore(app, { experimentalForceLongPolling: true });
  } catch {
    return getFirestore(app);
  }
}

export const db = isFirebaseConfigured ? createDb() : null;

// Firebase can start in "offline" mode in React Native — force it online
if (db) enableNetwork(db).catch(() => {});
