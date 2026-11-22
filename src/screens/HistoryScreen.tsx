import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ui, DARK, GREEN } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { loadScans, loadQuiz, fmtDate, ScanEntry, QuizEntry } from '../lib/history';

const ICON: Record<string, string> = { Organik: 'leaf', 'Daur Ulang': 'refresh-circle', Residu: 'trash', 'Tidak Yakin': 'help-circle' };

export default function HistoryScreen({ kind, onBack }: { kind: 'scan' | 'quiz'; onBack: () => void }) {
  const { session } = useAuth();
  const [scans, setScans] = useState<ScanEntry[]>([]);
  const [quiz, setQuiz] = useState<QuizEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const remote = !!(supabase && session);

  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    (async () => {
      const localScans = kind === 'scan' ? await loadScans() : [];
      const localQuiz = kind === 'quiz' ? await loadQuiz() : [];
      let remoteScans: ScanEntry[] = [];
      let remoteQuiz: QuizEntry[] = [];

      if (remote && supabase) {
        const table = kind === 'scan' ? 'scan_history' : 'quiz_results';
        const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(50);
        if (error) setLoadError(error.message);
        else if (kind === 'scan') remoteScans = (data ?? []).map((r: any) => ({ id: 'r' + r.id, item_name: r.item_name || r.predicted_category, category: r.predicted_category, confidence: r.confidence != null ? Number(r.confidence) : null, created_at: r.created_at }));
        else remoteQuiz = (data ?? []).map((r: any) => ({ id: 'r' + r.id, score: r.score, total: r.total_questions, created_at: r.created_at, chapter: r.chapter_title ?? undefined }));
      }

      // Entri lokal yang sudah ada di akun (waktu berdekatan & isi sama) tidak ditampilkan dua kali
      const near = (a: string, b: string) => Math.abs(new Date(a).getTime() - new Date(b).getTime()) < 120000;
      const byTime = <T extends { created_at: string }>(x: T[]) => x.sort((p, q) => (p.created_at < q.created_at ? 1 : -1));
      if (kind === 'scan') setScans(byTime([...remoteScans, ...localScans.filter((l) => !remoteScans.some((r) => r.category === l.category && near(r.created_at, l.created_at)))]));
      else setQuiz(byTime([...remoteQuiz, ...localQuiz.filter((l) => !remoteQuiz.some((r) => r.score === l.score && r.total === l.total && near(r.created_at, l.created_at)))]));
      setLoading(false);
    })();
  }, [kind, remote]);

  const title = kind === 'scan' ? 'Riwayat Scan' : 'Hasil Kuis';
  const best = quiz.length ? Math.max(...quiz.map((q) => Math.round((q.score / q.total) * 100))) : 0;
  const avg = quiz.length ? Math.round(quiz.reduce((s, q) => s + (q.score / q.total) * 100, 0) / quiz.length) : 0;

  return (
    <ScrollView contentContainerStyle={ui.page} showsVerticalScrollIndicator={false}>
      <ScreenHeader title={title} subtitle={kind === 'scan' ? 'Sampah yang pernah kamu scan.' : 'Perkembangan skor kuismu.'} onBack={onBack} />
      {loading && <ActivityIndicator color={DARK} style={{ marginTop: 30 }} />}

      {!loading && kind === 'quiz' && quiz.length > 0 && (
        <View style={{ flexDirection: 'row', gap: 9, marginBottom: 14 }}>
          {[{ l: 'Percobaan', v: String(quiz.length) }, { l: 'Skor terbaik', v: best + '%' }, { l: 'Rata-rata', v: avg + '%' }].map((s) => (
            <View key={s.l} style={[ui.card, { flex: 1, alignItems: 'center', marginBottom: 0, backgroundColor: '#E3F0D1' }]}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: DARK }}>{s.v}</Text>
              <Text style={ui.tinyText}>{s.l}</Text>
            </View>
          ))}
        </View>
      )}

      {!loading && (kind === 'scan' ? scans.length === 0 : quiz.length === 0) && (
        <View style={ui.empty}>
          <Ionicons name={kind === 'scan' ? 'time-outline' : 'trophy-outline'} size={40} color="#9BA18F" />
          <Text style={ui.smallText}>{kind === 'scan' ? 'Belum ada riwayat scan.' : 'Belum ada hasil kuis.'}</Text>
        </View>
      )}

      {kind === 'scan' && scans.map((s) => (
        <View key={s.id} style={[ui.card, ui.row]}>
          <View style={[ui.iconBox, { width: 44, height: 44, borderRadius: 14, backgroundColor: s.category === 'Tidak Yakin' ? '#ECEDE6' : '#DDF5A0' }]}>
            <Ionicons name={(ICON[s.category] ?? 'help-circle') as any} size={21} color={DARK} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ui.cardTitle} numberOfLines={1}>{s.item_name}</Text>
            <Text style={ui.tag}>{s.category}{s.confidence !== null ? ` · ${Math.round(s.confidence * 100)}%` : ''}</Text>
            <Text style={ui.tinyText}>{fmtDate(s.created_at)}</Text>
          </View>
        </View>
      ))}

      {kind === 'quiz' && quiz.map((q) => {
        const pct = Math.round((q.score / q.total) * 100);
        return (
          <View key={q.id} style={[ui.card, ui.row]}>
            <View style={[ui.iconBox, { width: 44, height: 44, borderRadius: 14, backgroundColor: GREEN }]}>
              <Ionicons name="trophy" size={20} color={DARK} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ui.cardTitle}>Skor {q.score} / {q.total}</Text>
              {q.chapter ? <Text style={ui.tag}>{q.chapter}</Text> : null}
              <Text style={ui.tinyText}>{fmtDate(q.created_at)}</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#4F7A12' }}>{pct}%</Text>
          </View>
        );
      })}

      {!loading && !remote && (
        <Text style={[ui.tinyText, { marginTop: 6 }]}>Riwayat ini tersimpan di perangkat. Masuk ke akun agar tersimpan juga di akunmu.</Text>
      )}
      {!loading && !!loadError && (
        <Text style={[ui.tinyText, { marginTop: 6, color: '#B3402F' }]}>Data akun gagal dimuat ({loadError}). Yang tampil hanya riwayat di perangkat ini.</Text>
      )}
    </ScrollView>
  );
}
