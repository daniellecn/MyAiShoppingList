import {
  doc, setDoc, onSnapshot, deleteDoc, getDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Item } from '../types';

// 6-char uppercase room code (excludes ambiguous chars: 0/O, 1/I/L)
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/** Create a new shared room and upload the current list. Returns room code. */
export async function createRoom(currentList: Item[]): Promise<string> {
  if (!db) throw new Error('firebase_not_configured');
  let code = generateRoomCode();
  // Avoid collisions (very rare, but just in case)
  let attempts = 0;
  while (attempts < 5) {
    const existing = await getDoc(doc(db, 'sharedLists', code));
    if (!existing.exists()) break;
    code = generateRoomCode();
    attempts++;
  }
  await setDoc(doc(db, 'sharedLists', code), {
    currentList,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return code;
}

/** Check if a room with this code exists. */
export async function roomExists(code: string): Promise<boolean> {
  if (!db) throw new Error('firebase_not_configured');
  const snap = await getDoc(doc(db, 'sharedLists', code.toUpperCase().trim()));
  return snap.exists();
}

/** Push the current list to an existing room. */
export async function pushList(code: string, currentList: Item[]): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, 'sharedLists', code), {
    currentList,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/** Subscribe to real-time list updates from a room. Returns unsubscribe function. */
export function subscribeToRoom(
  code: string,
  onChange: (items: Item[]) => void,
): () => void {
  if (!db) return () => {};
  return onSnapshot(doc(db, 'sharedLists', code), (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.currentList)) {
        onChange(data.currentList as Item[]);
      }
    }
  });
}

/** Delete the shared room (owner closes it). */
export async function deleteRoom(code: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, 'sharedLists', code));
}
