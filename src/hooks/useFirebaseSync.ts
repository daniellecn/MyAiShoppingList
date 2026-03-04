import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { subscribeToRoom, pushList } from '../services/listSync';

/**
 * Mount this hook once at the App level.
 * When shareRoomCode is set in the store, it:
 *  1. Subscribes to remote Firestore changes → updates local list
 *  2. Watches local list changes → pushes to Firestore (debounced 600ms)
 */
export function useFirebaseSync() {
  const shareRoomCode = useStore(s => s.shareRoomCode);
  const currentList = useStore(s => s.currentList);
  const setListFromSync = useStore(s => s.setListFromSync);

  // Track the last JSON we received from remote to avoid push-echo
  const lastRemoteJson = useRef<string>('');

  // Subscribe to remote changes
  useEffect(() => {
    if (!shareRoomCode) return;
    const unsubscribe = subscribeToRoom(shareRoomCode, (items) => {
      const json = JSON.stringify(items);
      lastRemoteJson.current = json;
      setListFromSync(items);
    });
    return unsubscribe;
  }, [shareRoomCode, setListFromSync]);

  // Push local changes to Firebase (debounced, skip if it's a remote update)
  useEffect(() => {
    if (!shareRoomCode) return;
    const json = JSON.stringify(currentList);
    // Skip pushing what we just received from remote
    if (json === lastRemoteJson.current) return;

    const timer = setTimeout(() => {
      pushList(shareRoomCode, currentList);
    }, 600);
    return () => clearTimeout(timer);
  }, [currentList, shareRoomCode]);
}
