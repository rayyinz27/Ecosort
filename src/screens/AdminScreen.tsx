import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Pressable, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { ui, DARK, MUTED } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import { supabase } from '../lib/supabase';
import { b64ToBytes } from '../lib/base64';
import { fetchVideos, fetchQuizChapters, fetchBanks, fetchCatalog, demoCatalog, VIDEO_CATEGORIES, CATALOG_CATEGORIES, UMUM_ID, Video, QuizChapter, Bank, CatalogItem } from '../lib/data';
import Sheet from '../components/Sheet';
import { fetchNotifs, Notif } from '../lib/notif';
import { fetchOrgs, fetchEvents, Org, EventItem } from '../lib/community';

type Kind = 'catalog' | 'video' | 'chapter' | 'quiz' | 'bank' | 'notif' | 'org' | 'event';
type Row = { raw: any; title: string; sub: string; group?: string; locked?: boolean; open?: () => void };
type Form = Record<string, string>;
const TABLE: Record<Kind, string> = { catalog: 'catalog_items', video: 'tutorials', chapter: 'quiz_chapters', quiz: 'quiz_questions', bank: 'waste_banks', notif: 'notifications', org: 'organizations', event: 'environmental_events' };
const LABEL: Record<Kind, string> = { catalog: 'Katalog', video: 'Video', chapter: 'Bab Kuis', quiz: 'Soal', bank: 'Bank Sampah', notif: 'Notifikasi', org: 'Organisasi', event: 'Acara' };
const BUCKET = 'bank-images';
const MAX_IMAGES = 5;

export default function AdminScreen({ onBack }: { onBack: () => void }) {
  const [kind, setKind] = useState<Kind>('video');
  const [videos, setVideos] = useState<Video[]>([]);
  const [chapters, setChapters] = useState<QuizChapter[]>([]);
  const [openChapter, setOpenChapter] = useState<string | null>(null);
  const [qChapter, setQChapter] = useState<string>(UMUM_ID);
  const [search, setSearch] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [banks, setBanks] = useState<Bank[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [orgPick, setOrgPick] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<null | { id?: string }>(null);
  const [form, setForm] = useState<Form>({});
  const [correct, setCorrect] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [v, q, b, n, o, c] = await Promise.all([fetchVideos(false), fetchQuizChapters(false), fetchBanks(null), fetchNotifs(false), fetchOrgs(false), fetchCatalog(false)]);
    setCatalog(c.items); setVideos(v.items); setChapters(q.items); setBanks(b.items); setNotifs(n.items); setOrgs(o.items);
    setEvents(await fetchEvents(o.items)); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openNew = () => { setQChapter(openChapter ?? UMUM_ID); setForm({}); setCorrect(0); setImages([]); setOrgPick(null); setEditing({}); };
  const openEdit = (item: any) => {
    setImages([]);
    if (kind === 'video') setForm({ title: item.title, description: item.description, video_url: item.url, category: item.category });
    if (kind === 'catalog') { setForm({ name: item.name, category: item.category, description: item.desc, tip: item.tip, details: item.details, video: item.video }); setImages(item.images ?? []); }
    if (kind === 'notif') setForm({ title: item.title, body: item.body });
    if (kind === 'org') setForm({ name: item.name, focus: item.focus, description: item.description, address: item.address, contact: item.contact, website: item.website });
    if (kind === 'event') {
      const d = item.date ? new Date(item.date) : null;
      const p2 = (n: number) => String(n).padStart(2, '0');
      setForm({ title: item.title, description: item.description, location: item.location, url: item.url, date: d ? `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}` : '' });
      setOrgPick(item.orgId);
    }
    if (kind === 'chapter') setForm({ title: item.title, description: item.description });
    if (kind === 'quiz') {
      setQChapter(openChapter ?? UMUM_ID);
      const o: Form = { question: item.question, explanation: item.explanation };
      item.options.forEach((x: string, i: number) => { o['opt' + i] = x; });
      setForm(o); setCorrect(Math.max(0, item.options.indexOf(item.answer)));
    }
    if (kind === 'bank') {
      setForm({ name: item.name, address: item.address, lat: String(item.lat), lng: String(item.lng), hours: item.hours === '-' ? '' : item.hours, accepts: item.accepts, phone: item.phone.startsWith('Kontak') ? '' : item.phone, description: item.description ?? '' });
      setImages(item.images ?? []);
    }
    setEditing({ id: item.id });
  };

  const buildPayload = (): { payload?: any; error?: string } => {
    const t = (k: string) => (form[k] ?? '').trim();
    if (kind === 'video') {
      if (!t('title') || !t('video_url')) return { error: 'Judul dan tautan video wajib diisi.' };
      return { payload: { title: t('title'), description: t('description'), video_url: t('video_url'), category: t('category') || 'Umum' } };
    }
    if (kind === 'catalog') {
      if (!t('name')) return { error: 'Nama jenis sampah wajib diisi.' };
      if (!CATALOG_CATEGORIES.includes(t('category'))) return { error: 'Pilih kategori: Organik, Daur Ulang, atau Residu.' };
      return { payload: { name: t('name'), category: t('category'), description: t('description'), tip: t('tip'), details: t('details'), video_url: t('video'), image_urls: images } };
    }
    if (kind === 'org') {
      if (!t('name')) return { error: 'Nama organisasi wajib diisi.' };
      return { payload: { name: t('name'), focus: t('focus'), description: t('description'), address: t('address'), contact: t('contact'), website_url: t('website'), verified: true } };
    }
    if (kind === 'event') {
      if (!t('title')) return { error: 'Judul acara wajib diisi.' };
      let iso: string | null = null;
      if (t('date')) {
        const m = t('date').match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/);
        if (!m) return { error: 'Format tanggal: 2026-12-05 08:00 (tahun-bulan-tanggal jam:menit).' };
        const d = new Date(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0));
        if (isNaN(d.getTime())) return { error: 'Tanggal tidak valid.' };
        iso = d.toISOString();
      }
      return { payload: { title: t('title'), description: t('description'), event_date: iso, location: t('location'), registration_url: t('url'), organization_id: orgPick ? Number(orgPick) : null } };
    }
    if (kind === 'notif') {
      if (!t('title')) return { error: 'Judul notifikasi wajib diisi.' };
      return { payload: { title: t('title'), body: t('body') } };
    }
    if (kind === 'chapter') {
      if (!t('title')) return { error: 'Judul bab wajib diisi.' };
      return { payload: { title: t('title'), description: t('description') } };
    }
    if (kind === 'quiz') {
      const opts = [0, 1, 2, 3].map((i) => t('opt' + i)).filter(Boolean);
      const ans = t('opt' + correct);
      if (!t('question')) return { error: 'Pertanyaan wajib diisi.' };
      if (opts.length < 2) return { error: 'Isi minimal 2 pilihan jawaban.' };
      if (!ans) return { error: 'Pilihan yang ditandai benar tidak boleh kosong.' };
      return { payload: { question: t('question'), options: opts, correct_answer: ans, explanation: t('explanation'), chapter_id: qChapter === UMUM_ID ? null : Number(qChapter) } };
    }
    const lat = parseFloat(t('lat').replace(',', '.')), lng = parseFloat(t('lng').replace(',', '.'));
    if (!t('name') || !t('address')) return { error: 'Nama dan alamat wajib diisi.' };
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return { error: 'Latitude/longitude tidak valid. Contoh: -6.9747 dan 107.6302.' };
    return { payload: { name: t('name'), address: t('address'), latitude: lat, longitude: lng, opening_hours: t('hours'), accepted_materials: t('accepts').split(',').map((s) => s.trim()).filter(Boolean), phone: t('phone'), description: t('description'), image_urls: images, verified: true } };
  };

  const save = async () => {
    if (!supabase || !editing) return;
    const { payload, error } = buildPayload();
    if (error) return Alert.alert('Periksa isian', error);
    setSaving(true);
    const q = editing.id ? supabase.from(TABLE[kind]).update(payload).eq('id', editing.id) : supabase.from(TABLE[kind]).insert(payload);
    const { error: dbErr } = await q;
    setSaving(false);
    if (dbErr) return Alert.alert('Gagal menyimpan', dbErr.message.includes('row-level security') ? 'Akun ini bukan admin.' : dbErr.message);
    setEditing(null); load();
  };

  const remove = (item: any, name: string) => Alert.alert('Hapus data?', `"${name}" akan dihapus permanen.${kind === 'chapter' ? '\n\nSemua soal di bab ini ikut terhapus.' : ''}`, [
    { text: 'Batal', style: 'cancel' },
    { text: 'Hapus', style: 'destructive', onPress: async () => {
      if (!supabase) return;
      const { error } = await supabase.from(TABLE[kind]).delete().eq('id', item.id);
      if (error) Alert.alert('Gagal menghapus', error.message); else load();
    } },
  ]);

  const addImages = async () => {
    if (!supabase) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) return Alert.alert('Maksimal foto', `Satu bank sampah maksimal ${MAX_IMAGES} foto.`);
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, base64: true, allowsMultipleSelection: true, selectionLimit: room });
    if (r.canceled) return;
    setUploading(true);
    const urls: string[] = [];
    for (let i = 0; i < r.assets.length; i++) {
      const a = r.assets[i];
      if (!a.base64) continue;
      const path = `${kind === 'catalog' ? 'catalog/' : ''}${Date.now()}-${i}.jpg`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, b64ToBytes(a.base64), { contentType: 'image/jpeg' });
      if (error) { Alert.alert('Gagal mengunggah foto', error.message.includes('row-level security') ? 'Akun ini bukan admin, atau SQL schema_update_2 belum dijalankan.' : error.message); break; }
      urls.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    }
    setImages((prev) => [...prev, ...urls]);
    setUploading(false);
  };

  const importDemo = async () => {
    if (!supabase) return;
    const rowsToAdd = demoCatalog.map((c) => ({ name: c.name, category: c.category, description: c.desc, tip: c.tip, details: c.details, video_url: '', image_urls: [] as string[] }));
    const { error } = await supabase.from('catalog_items').insert(rowsToAdd);
    if (error) Alert.alert('Gagal mengimpor', error.message.includes('row-level security') ? 'Akun ini bukan admin.' : error.message);
    else load();
  };

  const field = (k: string, label: string, opts: { multiline?: boolean; keyboard?: any; placeholder?: string } = {}) => (
    <View key={k}>
      {label ? <Text style={[ui.tinyText, { marginBottom: 4 }]}>{label}</Text> : null}
      <TextInput style={[ui.input, opts.multiline && { height: 74, paddingTop: 12, textAlignVertical: 'top' }]} value={form[k] ?? ''} onChangeText={(v) => set(k, v)}
        placeholder={opts.placeholder} placeholderTextColor="#969B91" multiline={opts.multiline} keyboardType={opts.keyboard} autoCapitalize="none" />
    </View>
  );

  const photoPicker = (
    <>
                  <Text style={[ui.tinyText, { marginBottom: 6 }]}>Foto ({images.length}/{MAX_IMAGES})</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                    {images.map((u) => (
                      <View key={u} style={{ marginRight: 10 }}>
                        <Image source={{ uri: u }} style={{ width: 84, height: 84, borderRadius: 14, backgroundColor: '#E4E9DD' }} />
                        <TouchableOpacity onPress={() => setImages((p) => p.filter((x) => x !== u))} style={{ position: 'absolute', top: -6, right: -6 }}>
                          <Ionicons name="close-circle" size={22} color="#B3402F" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    {images.length < MAX_IMAGES && (
                      <TouchableOpacity onPress={addImages} disabled={uploading} style={{ width: 84, height: 84, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#B9BFB0', alignItems: 'center', justifyContent: 'center' }}>
                        {uploading ? <ActivityIndicator color={DARK} /> : <><Ionicons name="image-outline" size={22} color={MUTED} /><Text style={ui.tinyText}>Tambah</Text></>}
                      </TouchableOpacity>
                    )}
                  </ScrollView>
    </>
  );

  const currentChapter = chapters.find((c) => c.id === openChapter) ?? null;
  const rows: Row[] =
    kind === 'catalog' ? catalog.map((c) => ({ raw: c, group: c.category, title: c.name, sub: `${c.images.length ? `${c.images.length} foto` : 'tanpa foto'}${c.video ? ' · ada video' : ''}` }))
    : kind === 'video' ? videos.map((v) => ({ raw: v, group: v.category, title: v.title, sub: v.url }))
    : kind === 'chapter' ? chapters.map((c) => ({ raw: c, title: c.title, sub: `${c.questions.length} soal${c.description ? ' · ' + c.description : ''}`, locked: c.id === UMUM_ID, open: () => { setKind('quiz'); setOpenChapter(c.id); setSearch(''); } }))
    : kind === 'quiz' ? (currentChapter?.questions ?? []).map((q, i) => ({ raw: q, title: `${i + 1}. ${q.question}`, sub: `Jawaban: ${q.answer}` }))
    : kind === 'notif' ? notifs.map((n) => ({ raw: n, title: n.title, sub: n.body }))
    : kind === 'org' ? orgs.map((o) => ({ raw: o, title: o.name, sub: o.focus || o.address }))
    : kind === 'event' ? events.map((e) => ({ raw: e, title: e.title, sub: `${e.date ? new Date(e.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tanpa tanggal'}${e.location ? ' · ' + e.location : ''}` }))
    : banks.map((b) => ({ raw: b, title: b.name, sub: `${b.address}${b.images && b.images.length ? ` · ${b.images.length} foto` : ''}` }));

  const q = search.trim().toLowerCase();
  const filtered = rows.filter((r) => !q || `${r.title} ${r.sub}`.toLowerCase().includes(q));
  const groups = (() => {
    if (!filtered.some((r) => r.group)) return null;
    const order = kind === 'catalog' ? CATALOG_CATEGORIES : VIDEO_CATEGORIES;
    const names = Array.from(new Set(filtered.map((r) => r.group as string)));
    names.sort((x, y) => { const ix = order.indexOf(x), iy = order.indexOf(y); return (ix < 0 ? 99 : ix) - (iy < 0 ? 99 : iy) || x.localeCompare(y); });
    return names.map((n) => ({ name: n, items: filtered.filter((r) => r.group === n) }));
  })();

  const renderRow = (r: Row) => (
    <TouchableOpacity key={r.raw.id} activeOpacity={r.open ? 0.8 : 1} onPress={r.open} style={[ui.card, ui.row]}>
      <View style={{ flex: 1 }}>
        <Text style={ui.cardTitle} numberOfLines={2}>{r.title}</Text>
        <Text style={ui.smallText} numberOfLines={2}>{r.sub}</Text>
      </View>
      {r.open && <Ionicons name="chevron-forward" size={18} color={MUTED} />}
      {!r.locked && <TouchableOpacity onPress={() => openEdit(r.raw)} hitSlop={8}><Ionicons name="create-outline" size={21} color={DARK} /></TouchableOpacity>}
      {!r.locked && <TouchableOpacity onPress={() => remove(r.raw, r.title)} hitSlop={8}><Ionicons name="trash-outline" size={21} color="#B3402F" /></TouchableOpacity>}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={ui.page} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Panel Admin" subtitle="Kelola katalog, video, kuis berbab, bank sampah, dan komunitas." onBack={onBack} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {(['catalog', 'video', 'chapter', 'bank', 'notif', 'org', 'event'] as Kind[]).map((k) => {
            const active = kind === k || (k === 'chapter' && kind === 'quiz');
            return (
            <TouchableOpacity key={k} onPress={() => { setKind(k); setOpenChapter(null); setSearch(''); }} style={[ui.pill, active && ui.pillActive]}>
              <Text style={[ui.pillText, active && ui.pillTextActive]}>{k === 'chapter' ? 'Kuis' : LABEL[k]}</Text>
            </TouchableOpacity>
            );
          })}
        </View>
        {kind === 'quiz' && (
          <TouchableOpacity style={[ui.row, { marginBottom: 12, gap: 8 }]} onPress={() => { setKind('chapter'); setOpenChapter(null); setSearch(''); }}>
            <Ionicons name="arrow-back" size={18} color={DARK} />
            <View style={{ flex: 1 }}><Text style={ui.tinyText}>Semua bab</Text><Text style={ui.cardTitle}>{currentChapter?.title ?? ''}</Text></View>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[ui.primaryButton, { marginTop: 0, marginBottom: 14 }]} onPress={openNew}>
          <Ionicons name="add" size={18} color={DARK} /><Text style={ui.primaryButtonText}>Tambah {LABEL[kind]}</Text>
        </TouchableOpacity>
        {!loading && rows.length > 4 && (
          <TextInput style={ui.input} value={search} onChangeText={setSearch} placeholder="Cari di daftar ini..." placeholderTextColor="#969B91" autoCapitalize="none" />
        )}
        {loading && <ActivityIndicator color={DARK} />}
        {!loading && rows.length === 0 && (
          <View style={ui.empty}><Text style={ui.smallText}>
            {kind === 'chapter' ? 'Belum ada bab di database. Pengguna melihat bab contoh sampai kamu menambahkan bab.' : kind === 'quiz' ? 'Bab ini belum punya soal.' : 'Belum ada data. Pengguna akan melihat data contoh sampai kamu menambahkan data.'}
          </Text></View>
        )}
        {!loading && kind === 'catalog' && rows.length === 0 && (
          <TouchableOpacity style={ui.secondaryButton} onPress={importDemo}>
            <Ionicons name="download-outline" size={18} color={DARK} /><Text style={ui.secondaryButtonText}>Impor {demoCatalog.length} data contoh ke database</Text>
          </TouchableOpacity>
        )}
        {groups ? groups.map((g) => {
          const key = `${kind}:${g.name}`;
          const isOpen = openGroups[key] ?? (q.length > 0 || filtered.length <= 8);
          return (
            <View key={key} style={{ marginBottom: 8 }}>
              <TouchableOpacity onPress={() => setOpenGroups((o) => ({ ...o, [key]: !isOpen }))} style={[ui.row, { paddingVertical: 10, paddingHorizontal: 4, gap: 8 }]}>
                <Ionicons name={isOpen ? 'chevron-down' : 'chevron-forward'} size={18} color={DARK} />
                <Text style={{ flex: 1, fontSize: 13, fontWeight: '800', color: DARK }}>{g.name}</Text>
                <View style={{ backgroundColor: '#DDF5A0', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}><Text style={{ fontSize: 10, fontWeight: '800', color: DARK }}>{g.items.length}</Text></View>
              </TouchableOpacity>
              {isOpen && g.items.map(renderRow)}
            </View>
          );
        }) : filtered.map(renderRow)}
      </ScrollView>

      <Sheet visible={!!editing} onClose={() => setEditing(null)}>
              <View style={ui.sheetHandle} />
              <Text style={[ui.brand, { fontSize: 20, marginBottom: 14 }]}>{editing?.id ? 'Ubah' : 'Tambah'} {LABEL[kind]}</Text>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {kind === 'chapter' && <>
                  {field('title', 'Judul bab', { placeholder: 'Contoh: Dasar Pemilahan' })}
                  {field('description', 'Deskripsi singkat bab', { multiline: true })}
                  <Text style={[ui.tinyText, { marginBottom: 10, marginTop: -4 }]}>Setelah bab dibuat, buka bab itu untuk menambahkan soal.</Text>
                </>}
                {kind === 'catalog' && <>
                  {field('name', 'Nama jenis sampah', { placeholder: 'Contoh: Botol kaca' })}
                  <Text style={[ui.tinyText, { marginBottom: 6 }]}>Kategori</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {CATALOG_CATEGORIES.map((c) => (
                      <TouchableOpacity key={c} onPress={() => set('category', c)} style={[ui.pill, form.category === c && ui.pillActive]}>
                        <Text style={[ui.pillText, form.category === c && ui.pillTextActive]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {field('description', 'Deskripsi singkat (tampil di daftar)', { multiline: true })}
                  {field('details', 'Penjelasan lengkap (materi belajar)', { multiline: true, placeholder: 'Mengapa masuk kategori ini, cara memilah, dampaknya, dll.' })}
                  {field('tip', 'Cara menangani', { multiline: true })}
                  {field('video', 'Tautan video penjelasan (opsional)', { placeholder: 'https://www.youtube.com/watch?v=...' })}
                  {photoPicker}
                </>}
                {kind === 'video' && <>
                  {field('title', 'Judul video')}
                  {field('video_url', 'Tautan video (YouTube)', { placeholder: 'https://www.youtube.com/watch?v=...' })}
                  <Text style={[ui.tinyText, { marginBottom: 6 }]}>Kategori (pilih satu)</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {Array.from(new Set([...VIDEO_CATEGORIES, ...videos.map((v) => v.category)])).map((c) => (
                      <TouchableOpacity key={c} onPress={() => set('category', c)} style={[ui.pill, form.category === c && ui.pillActive]}>
                        <Text style={[ui.pillText, form.category === c && ui.pillTextActive]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {field('category', 'Atau ketik kategori baru', { placeholder: 'Contoh: Kerajinan' })}
                  {field('description', 'Deskripsi singkat', { multiline: true })}
                </>}
                {kind === 'notif' && <>
                  {field('title', 'Judul notifikasi', { placeholder: 'Contoh: Jadwal setor sampah akhir pekan' })}
                  {field('body', 'Isi pesan', { multiline: true })}
                  <Text style={[ui.tinyText, { marginBottom: 10, marginTop: -4 }]}>Notifikasi muncul di ikon lonceng pada semua pengguna aplikasi.</Text>
                </>}
                {kind === 'org' && <>
                  {field('name', 'Nama organisasi')}
                  {field('focus', 'Fokus kegiatan', { placeholder: 'Aksi bersih lingkungan & edukasi warga' })}
                  {field('description', 'Deskripsi', { multiline: true })}
                  {field('address', 'Alamat / wilayah')}
                  {field('contact', 'Kontak (WhatsApp / email / @instagram / tautan)', { placeholder: '081234567890 atau @namaakun' })}
                  {field('website', 'Website (opsional)', { placeholder: 'https://...' })}
                </>}
                {kind === 'event' && <>
                  {field('title', 'Judul acara')}
                  {field('date', 'Tanggal & jam (jam perangkat)', { placeholder: '2026-12-05 08:00' })}
                  {field('location', 'Lokasi')}
                  {field('url', 'Tautan pendaftaran / info (opsional)', { placeholder: 'https://...' })}
                  {field('description', 'Deskripsi', { multiline: true })}
                  <Text style={[ui.tinyText, { marginBottom: 6 }]}>Penyelenggara (opsional)</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    <TouchableOpacity onPress={() => setOrgPick(null)} style={[ui.pill, orgPick === null && ui.pillActive]}><Text style={[ui.pillText, orgPick === null && ui.pillTextActive]}>Tidak ada</Text></TouchableOpacity>
                    {orgs.map((o) => (
                      <TouchableOpacity key={o.id} onPress={() => setOrgPick(o.id)} style={[ui.pill, orgPick === o.id && ui.pillActive]}><Text style={[ui.pillText, orgPick === o.id && ui.pillTextActive]}>{o.name}</Text></TouchableOpacity>
                    ))}
                  </View>
                </>}
                {kind === 'quiz' && <>
                  <Text style={[ui.tinyText, { marginBottom: 6 }]}>Bab</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {[...chapters.filter((c) => c.id !== UMUM_ID), { id: UMUM_ID, title: 'Umum' }].map((c) => (
                      <TouchableOpacity key={c.id} onPress={() => setQChapter(c.id)} style={[ui.pill, qChapter === c.id && ui.pillActive]}>
                        <Text style={[ui.pillText, qChapter === c.id && ui.pillTextActive]}>{c.title}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {field('question', 'Pertanyaan', { multiline: true })}
                  <Text style={[ui.tinyText, { marginBottom: 6 }]}>Pilihan jawaban (tekan lingkaran untuk menandai jawaban benar)</Text>
                  {[0, 1, 2, 3].map((i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <TouchableOpacity onPress={() => setCorrect(i)} hitSlop={8} style={{ marginBottom: 10 }}>
                        <Ionicons name={correct === i ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={correct === i ? '#6E9D19' : MUTED} />
                      </TouchableOpacity>
                      <View style={{ flex: 1 }}>{field('opt' + i, '', { placeholder: `Pilihan ${i + 1}${i > 1 ? ' (opsional)' : ''}` })}</View>
                    </View>
                  ))}
                  {field('explanation', 'Penjelasan jawaban', { multiline: true })}
                </>}
                {kind === 'bank' && <>
                  {field('name', 'Nama bank sampah')}
                  {field('address', 'Alamat')}
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>{field('lat', 'Latitude', { keyboard: 'numbers-and-punctuation', placeholder: '-6.9747' })}</View>
                    <View style={{ flex: 1 }}>{field('lng', 'Longitude', { keyboard: 'numbers-and-punctuation', placeholder: '107.6302' })}</View>
                  </View>
                  <Text style={[ui.tinyText, { marginBottom: 10, marginTop: -4 }]}>Tips: di Google Maps, tekan lama pada lokasi lalu salin koordinatnya.</Text>
                  {field('hours', 'Jam operasional', { placeholder: '08.00–16.00 WIB' })}
                  {field('accepts', 'Sampah yang diterima (pisahkan dengan koma)', { placeholder: 'Plastik, kertas, logam' })}
                  {field('phone', 'Kontak (opsional)', { keyboard: 'phone-pad' })}
                  {field('description', 'Deskripsi / info tambahan', { multiline: true, placeholder: 'Cara setor, syarat, harga per kg, dll.' })}

                  {photoPicker}
                </>}
                <TouchableOpacity style={ui.primaryButton} onPress={save} disabled={saving || uploading}>
                  {saving ? <ActivityIndicator color={DARK} /> : <Text style={ui.primaryButtonText}>Simpan</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={ui.secondaryButton} onPress={() => setEditing(null)}><Text style={ui.secondaryButtonText}>Batal</Text></TouchableOpacity>
              </ScrollView>
      </Sheet>
    </View>
  );
}
