import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ui, DARK, GREEN } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import { useNotif } from '../lib/notif';

function ago(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Baru saja';
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function NotifScreen({ onBack }: { onBack: () => void }) {
  const { items, lastSeen, refresh, markAllSeen } = useNotif();
  const prevSeen = useRef<string | null>(lastSeen); // untuk menandai yang baru pada kunjungan ini
  const [loading, setLoading] = useState(true);
  const [marked, setMarked] = useState(false);

  useEffect(() => { refresh().finally(() => setLoading(false)); }, [refresh]);
  useEffect(() => { if (!loading && !marked) { setMarked(true); markAllSeen(); } }, [loading, marked, markAllSeen]);

  return (
    <ScrollView contentContainerStyle={ui.page} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Notifikasi" subtitle="Info dan pengumuman dari EcoSort." onBack={onBack} />
      {loading && items.length === 0 && <ActivityIndicator color={DARK} style={{ marginTop: 30 }} />}
      {!loading && items.length === 0 && (
        <View style={ui.empty}><Ionicons name="notifications-off-outline" size={40} color="#9BA18F" /><Text style={ui.smallText}>Belum ada notifikasi.</Text></View>
      )}
      {items.map((n) => {
        const isNew = !prevSeen.current || n.created_at > prevSeen.current;
        return (
          <View key={n.id} style={[ui.card, ui.row, { alignItems: 'flex-start' }]}>
            <View style={[ui.iconBox, { width: 42, height: 42, borderRadius: 14, backgroundColor: isNew ? GREEN : '#E6EFD9' }]}>
              <Ionicons name="notifications" size={20} color={DARK} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[ui.cardTitle, { flexShrink: 1 }]}>{n.title}</Text>
                {isNew && <View style={{ backgroundColor: GREEN, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 }}><Text style={{ fontSize: 8, fontWeight: '800', color: DARK }}>BARU</Text></View>}
              </View>
              {n.body ? <Text style={ui.smallText}>{n.body}</Text> : null}
              <Text style={[ui.tinyText, { marginTop: 5 }]}>{ago(n.created_at)}</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
