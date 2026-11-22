import { Alert, Linking } from 'react-native';
import { supabase } from './supabase';

export type Org = { id: string; name: string; focus: string; description: string; address: string; contact: string; website: string; verified: boolean };
export type EventItem = { id: string; orgId: string | null; orgName: string; title: string; description: string; date: string | null; location: string; url: string };

export const demoOrgs: Org[] = [
  { id: 'o1', name: 'Komunitas Bersih Bandung', focus: 'Aksi bersih lingkungan & edukasi warga', description: 'Contoh kegiatan: bersih sungai dan kampanye pilah sampah.', address: '', contact: '', website: '', verified: false },
  { id: 'o2', name: 'Relawan Hijau Kampus', focus: 'Relawan dan program lingkungan kampus', description: 'Contoh kegiatan: pengumpulan sampah terpilah.', address: '', contact: '', website: '', verified: false },
  { id: 'o3', name: 'Gerakan Peduli Lingkungan', focus: 'Kolaborasi komunitas dan pengelolaan sampah', description: 'Contoh kegiatan: edukasi daur ulang.', address: '', contact: '', website: '', verified: false },
];

export async function fetchOrgs(fallback = true): Promise<{ items: Org[]; demo: boolean }> {
  if (supabase) {
    const { data, error } = await supabase.from('organizations').select('*').order('id', { ascending: true });
    if (!error && data && (data.length > 0 || !fallback)) {
      return { demo: false, items: data.map((r: any) => ({ id: String(r.id), name: r.name, focus: r.focus ?? '', description: r.description ?? '', address: r.address ?? '', contact: r.contact ?? '', website: r.website_url ?? '', verified: !!r.verified })) };
    }
  }
  return { items: fallback ? demoOrgs : [], demo: true };
}

export async function fetchEvents(orgs: Org[]): Promise<EventItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('environmental_events').select('*').order('event_date', { ascending: true });
  if (error || !data) return [];
  return data.map((r: any) => ({
    id: String(r.id), orgId: r.organization_id != null ? String(r.organization_id) : null,
    orgName: orgs.find((o) => o.id === String(r.organization_id))?.name ?? '',
    title: r.title, description: r.description ?? '', date: r.event_date ?? null, location: r.location ?? '', url: r.registration_url ?? '',
  }));
}

export async function openLink(raw: string) {
  const u = raw.trim();
  if (!u) return;
  try { await Linking.openURL(/^https?:\/\//i.test(u) ? u : 'https://' + u); } catch { Alert.alert('Gagal membuka', u); }
}

// Kontak bisa berupa tautan, email, @instagram, atau nomor telepon (dibuka lewat WhatsApp)
export async function openContact(raw: string) {
  const c = raw.trim();
  if (!c) return;
  let url: string | null = null;
  if (/^https?:\/\//i.test(c)) url = c;
  else if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(c)) url = 'mailto:' + c;
  else if (c.startsWith('@')) url = 'https://instagram.com/' + c.slice(1);
  else if (/^\+?[\d\s()-]{8,}$/.test(c)) {
    let d = c.replace(/[^\d]/g, '');
    if (d.startsWith('0')) d = '62' + d.slice(1);
    url = 'https://wa.me/' + d;
  }
  if (!url) { Alert.alert('Kontak', c); return; }
  try { await Linking.openURL(url); } catch { Alert.alert('Gagal membuka', c); }
}
