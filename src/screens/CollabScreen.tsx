import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { createRoom, deleteRoom, roomExists } from '../services/listSync';
import { isFirebaseConfigured } from '../services/firebase';

export function CollabScreen() {
  const navigation = useNavigation<any>();
  const currentList = useStore(s => s.currentList);
  const shareRoomCode = useStore(s => s.shareRoomCode);
  const shareRole = useStore(s => s.shareRole);
  const setShareRoom = useStore(s => s.setShareRoom);

  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStartSharing = async () => {
    if (!isFirebaseConfigured) {
      Alert.alert(
        'Firebase לא מוגדר',
        'יש למלא את פרטי Firebase בקובץ src/services/firebase.ts.\n\nפרטים:\n1. היכנס לconsole.firebase.google.com\n2. צור פרויקט חדש\n3. הפעל Firestore\n4. העתק את ה-config לקובץ',
      );
      return;
    }
    setLoading(true);
    try {
      const code = await createRoom(currentList);
      setShareRoom(code, 'owner');
    } catch (e) {
      Alert.alert('שגיאה', 'לא ניתן ליצור חדר שיתוף. בדוק חיבור לאינטרנט.');
    } finally {
      setLoading(false);
    }
  };

  const handleStopSharing = () => {
    Alert.alert('עצור שיתוף', 'לסגור את החדר? המשפחה תאבד גישה לרשימה המשותפת.', [
      {
        text: 'כן, סגור',
        style: 'destructive',
        onPress: async () => {
          if (shareRoomCode) await deleteRoom(shareRoomCode);
          setShareRoom(null, null);
        },
      },
      { text: 'ביטול', style: 'cancel' },
    ]);
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) return;
    if (!isFirebaseConfigured) {
      Alert.alert('Firebase לא מוגדר', 'יש להגדיר את Firebase תחילה.');
      return;
    }
    setLoading(true);
    try {
      const exists = await roomExists(code);
      if (!exists) {
        Alert.alert('קוד לא תקין', 'לא נמצאה רשימה עם קוד זה. בדוק שהקוד נכון.');
        return;
      }
      setShareRoom(code, 'member');
      setJoinCode('');
    } catch {
      Alert.alert('שגיאה', 'לא ניתן להתחבר. בדוק חיבור לאינטרנט.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = () => {
    Alert.alert('עזוב רשימה', 'לצאת מהרשימה המשותפת?', [
      { text: 'כן', onPress: () => setShareRoom(null, null) },
      { text: 'ביטול', style: 'cancel' },
    ]);
  };

  const shareCode = async () => {
    if (!shareRoomCode) return;
    await Share.share({
      message: `הצטרף לרשימת הקניות שלי! פתח את האפליקציה ובחר "הצטרף לרשימה", הכנס קוד: ${shareRoomCode}`,
      title: 'קוד רשימה משותפת',
    });
  };

  const copyCode = async () => {
    if (!shareRoomCode) return;
    await Share.share({ message: shareRoomCode, title: 'קוד שיתוף' });
  };

  const isSharing = shareRoomCode !== null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← חזור</Text>
        </TouchableOpacity>
        <Text style={styles.title}>שיתוף רשימה</Text>
      </View>

      {!isFirebaseConfigured && (
        <View style={styles.setupBanner}>
          <Text style={styles.setupIcon}>⚙️</Text>
          <Text style={styles.setupText}>
            נדרשת הגדרת Firebase כדי להפעיל שיתוף בזמן אמת.{'\n'}
            פתח src/services/firebase.ts ומלא את הפרטים.
          </Text>
        </View>
      )}

      <View style={styles.body}>
        {/* Active session banner */}
        {isSharing && (
          <View style={[styles.activeBanner, shareRole === 'owner' ? styles.ownerBanner : styles.memberBanner]}>
            <Text style={styles.activeIcon}>{shareRole === 'owner' ? '👑' : '👥'}</Text>
            <View style={styles.activeInfo}>
              <Text style={styles.activeLabel}>
                {shareRole === 'owner' ? 'אתה משתף את הרשימה' : 'מחובר לרשימה משותפת'}
              </Text>
              <Text style={styles.activeCode}>קוד: {shareRoomCode}</Text>
            </View>
            <View style={styles.syncDot} />
          </View>
        )}

        {/* Owner section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📤 שתף את הרשימה שלך</Text>
          <Text style={styles.cardDesc}>
            צור קוד שיתוף ושלח אותו למשפחה. כל שינוי יסונכרן באופן מיידי.
          </Text>
          {isSharing && shareRole === 'owner' ? (
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>קוד השיתוף שלך</Text>
              <Text style={styles.codeText}>{shareRoomCode}</Text>
              <View style={styles.codeActions}>
                <TouchableOpacity style={styles.codeBtn} onPress={shareCode}>
                  <Text style={styles.codeBtnText}>📤 שלח</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.codeBtn, styles.copyBtn]} onPress={copyCode}>
                  <Text style={styles.codeBtnText}>📋 העתק</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.stopBtn} onPress={handleStopSharing}>
                <Text style={styles.stopBtnText}>עצור שיתוף</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, styles.startBtn, (!isFirebaseConfigured || loading) && styles.btnDisabled]}
              onPress={handleStartSharing}
              disabled={!isFirebaseConfigured || loading || (isSharing && shareRole === 'member')}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionBtnText}>צור קוד שיתוף</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Member section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📥 הצטרף לרשימה</Text>
          <Text style={styles.cardDesc}>
            קיבלת קוד מבן המשפחה? הכנס אותו כאן כדי לצפות ולערוך את הרשימה המשותפת.
          </Text>
          {isSharing && shareRole === 'member' ? (
            <TouchableOpacity style={styles.stopBtn} onPress={handleLeave}>
              <Text style={styles.stopBtnText}>עזוב רשימה משותפת</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.joinRow}>
              <TextInput
                style={styles.codeInput}
                placeholder="הכנס קוד (למשל: AB12CD)"
                value={joinCode}
                onChangeText={t => setJoinCode(t.toUpperCase())}
                autoCapitalize="characters"
                maxLength={8}
                textAlign="center"
                editable={!isSharing}
              />
              <TouchableOpacity
                style={[styles.joinBtn, (joinCode.trim().length < 4 || loading || isSharing) && styles.btnDisabled]}
                onPress={handleJoin}
                disabled={joinCode.trim().length < 4 || loading || isSharing}
              >
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.joinBtnText}>הצטרף</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ איך זה עובד</Text>
          <Text style={styles.infoText}>• הבעלים יוצר קוד ומשתף אותו</Text>
          <Text style={styles.infoText}>• כל בני המשפחה מזינים את הקוד</Text>
          <Text style={styles.infoText}>• כולם רואים ועורכים את אותה הרשימה</Text>
          <Text style={styles.infoText}>• השינויים מסונכרנים בזמן אמת</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  header: {
    backgroundColor: '#5C8A6B',
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  backBtn: { padding: 4 },
  backText: { color: '#fff', fontSize: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff' },

  setupBanner: {
    flexDirection: 'row', gap: 10,
    backgroundColor: '#FFF3E0', margin: 16, borderRadius: 12,
    padding: 14, alignItems: 'flex-start',
    borderLeftWidth: 4, borderLeftColor: '#FF9800',
  },
  setupIcon: { fontSize: 20 },
  setupText: { flex: 1, fontSize: 13, color: '#E65100', lineHeight: 20 },

  body: { flex: 1, padding: 16, gap: 14 },

  activeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, padding: 14,
  },
  ownerBanner: { backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#5C8A6B' },
  memberBanner: { backgroundColor: '#E3F2FD', borderWidth: 1, borderColor: '#7BA8C4' },
  activeIcon: { fontSize: 28 },
  activeInfo: { flex: 1 },
  activeLabel: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  activeCode: { fontSize: 16, fontWeight: '800', color: '#5C8A6B', letterSpacing: 2, marginTop: 2 },
  syncDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#5C8A6B',
  },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18, gap: 10,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  cardDesc: { fontSize: 13, color: '#666', lineHeight: 19 },

  codeBox: { gap: 10, alignItems: 'center' },
  codeLabel: { fontSize: 12, color: '#888', fontWeight: '500' },
  codeText: {
    fontSize: 36, fontWeight: '800', color: '#5C8A6B',
    letterSpacing: 6, paddingVertical: 8,
  },
  codeActions: { flexDirection: 'row', gap: 10 },
  codeBtn: {
    flex: 1, backgroundColor: '#5C8A6B', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  copyBtn: { backgroundColor: '#7BA8C4' },
  codeBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  actionBtn: {
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  startBtn: { backgroundColor: '#5C8A6B' },
  btnDisabled: { backgroundColor: '#ccc' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  stopBtn: {
    borderRadius: 10, paddingVertical: 10, alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#C4655A',
  },
  stopBtnText: { color: '#C4655A', fontWeight: '700', fontSize: 14 },

  joinRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  codeInput: {
    flex: 1, height: 46, borderWidth: 1.5, borderColor: '#ddd',
    borderRadius: 12, fontSize: 18, fontWeight: '700',
    letterSpacing: 3, color: '#1a1a1a', backgroundColor: '#fafafa',
  },
  joinBtn: {
    backgroundColor: '#7BA8C4', borderRadius: 12,
    paddingHorizontal: 18, paddingVertical: 13,
  },
  joinBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  infoBox: {
    backgroundColor: '#F3F4F6', borderRadius: 14, padding: 16, gap: 6,
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#444', marginBottom: 2 },
  infoText: { fontSize: 13, color: '#666', lineHeight: 20 },
});
