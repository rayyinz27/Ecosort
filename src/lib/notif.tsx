import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export type Notif = { id: string; title: string; body: string; created_at: string };

const SEEN_KEY = 'ecosort:notif_seen';

// Header berada di luar komponen utama, jadi pembuka layar notifikasi didaftarkan lewat sini
let opener: (() => void) | null = null;
export const setNotifOpener = (fn: (() => void) | null) => { opener = fn; };
export const openNotifications = () => opener?.();

export const demoNotifs: Notif[] = [
  { id: 'n1', title: 'Selamat datang di EcoSort 🌱', body: 'Mulai dari scan sampah pertamamu, lalu cari bank sampah terdekat untuk menyetornya.', created_at: '2026-01-01T00:00:00Z' },
  { id: 'n2', title: 'Tips hari ini', body: 'Bilas botol plastik sebelum disetor agar lebih mudah didaur ulang.', created_at: '2026-01-01T00:00:01Z' },
];

export async function fetchNotifs(fallback = true): Promise<{ items: Notif[]; demo: boolean }> {
  if (supabase) {
    const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
    if (!error && data && (data.length > 0 || !fallback)) {
      return { demo: false, items: data.map((r: any) => ({ id: String(r.id), title: r.title, body: r.body ?? '', created_at: r.created_at })) };
    }
  }
  return { items: fallback ? [...demoNotifs].reverse() : [], demo: true };
}

type Ctx = { items: Notif[]; unread: number; lastSeen: string | null; refresh: () => Promise<void>; markAllSeen: () => Promise<void> };
const NotifCtx = createContext<Ctx>({ items: [], unread: 0, lastSeen: null, refresh: async () => {}, markAllSeen: async () => {} });

export function NotifProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Notif[]>([]);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const seenRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    const r = await fetchNotifs(true);
    setItems(r.items);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(SEEN_KEY).then((v) => { seenRef.current = v; setLastSeen(v); }).catch(() => {}).finally(refresh);
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') refresh(); });
    return () => sub.remove();
  }, [refresh]);

  const markAllSeen = useCallback(async () => {
    const latest = items.reduce((m, n) => (n.created_at > m ? n.created_at : m), '');
    if (!latest) return;
    seenRef.current = latest; setLastSeen(latest);
    try { await AsyncStorage.setItem(SEEN_KEY, latest); } catch { /* abaikan */ }
  }, [items]);

  const unread = items.filter((n) => !lastSeen || n.created_at > lastSeen).length;
  return <NotifCtx.Provider value={{ items, unread, lastSeen, refresh, markAllSeen }}>{children}</NotifCtx.Provider>;
}

export const useNotif = () => useContext(NotifCtx);
