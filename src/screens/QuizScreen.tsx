import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ui, DARK, GREEN, WHITE } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import { fetchQuizChapters, QuizChapter, Quiz } from '../lib/data';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { addQuiz, loadQuiz } from '../lib/history';

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);
type Active = { id: string; title: string; questions: Quiz[] };

export default function QuizScreen({ onBack }: { onBack: () => void }) {
  const { session } = useAuth();
  const [chapters, setChapters] = useState<QuizChapter[]>([]);
  const [best, setBest] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Active | null>(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadList = async () => {
    const [r, hist] = await Promise.all([fetchQuizChapters(true), loadQuiz()]);
    setChapters(r.items.filter((c) => c.questions.length > 0));
    const b: Record<string, number> = {};
    hist.forEach((h) => { if (h.chapter) b[h.chapter] = Math.max(b[h.chapter] ?? 0, Math.round((h.score / h.total) * 100)); });
    setBest(b);
    setLoading(false);
  };
  useEffect(() => { loadList(); }, []);

  const begin = (id: string, title: string, questions: Quiz[], randomize: boolean) => {
    const qs = (randomize ? shuffle(questions).slice(0, 10) : questions).map((q) => ({ ...q, options: shuffle(q.options) }));
    setActive({ id, title, questions: qs });
    setIdx(0); setPicked(null); setScore(0); setDone(false); setSaved(false);
  };
  const backToList = () => { setActive(null); setDone(false); loadList(); };

  useEffect(() => {
    if (done && !saved && active) {
      setSaved(true);
      addQuiz({ score, total: active.questions.length, chapter: active.title });
      if (supabase && session) {
        const base = { user_id: session.user.id, score, total_questions: active.questions.length };
        const cid = /^\d+$/.test(active.id) ? Number(active.id) : null;
        supabase.from('quiz_results').insert({ ...base, chapter_id: cid, chapter_title: active.title }).then(({ error }) => {
          // kolom bab belum ada (SQL update 5 belum dijalankan) -> simpan tanpa info bab
          if (error && supabase) supabase.from('quiz_results').insert(base);
        });
      }
    }
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = active?.questions[idx];
  const choose = (opt: string) => {
    if (picked || !q) return;
    setPicked(opt);
    if (opt === q.answer) setScore((s) => s + 1);
  };
  const next = () => { if (!active) return; if (idx + 1 >= active.questions.length) setDone(true); else { setIdx(idx + 1); setPicked(null); } };

  const allQuestions = chapters.flatMap((c) => c.questions);
  const total = active?.questions.length ?? 0;

  return (
    <ScrollView contentContainerStyle={ui.page} showsVerticalScrollIndicator={false}>
      <ScreenHeader title={active ? active.title : 'Kuis Interaktif'} subtitle={active ? 'Jawab dengan teliti ya.' : 'Pilih bab untuk mulai belajar.'} onBack={active ? backToList : onBack} />
      {loading && <ActivityIndicator color={DARK} style={{ marginTop: 30 }} />}

      {/* ===== Daftar bab ===== */}
      {!loading && !active && (
        <>
          {chapters.length === 0 && <View style={ui.empty}><Text style={ui.smallText}>Belum ada soal kuis.</Text></View>}
          {chapters.map((c, i) => (
            <TouchableOpacity key={c.id} activeOpacity={0.85} style={[ui.card, ui.row]} onPress={() => begin(c.id, c.title, c.questions, false)}>
              <View style={[ui.iconBox, { width: 48, height: 48, borderRadius: 16, backgroundColor: '#DDF5A0' }]}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: DARK }}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ui.cardTitle}>{c.title}</Text>
                {c.description ? <Text style={ui.smallText} numberOfLines={2}>{c.description}</Text> : null}
                <Text style={[ui.tinyText, { marginTop: 4 }]}>{c.questions.length} soal{best[c.title] !== undefined ? ` · Terbaik ${best[c.title]}%` : ''}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#777C72" />
            </TouchableOpacity>
          ))}
          {allQuestions.length >= 2 && chapters.length > 1 && (
            <TouchableOpacity activeOpacity={0.85} style={[ui.card, ui.row, { backgroundColor: '#E3F0D1' }]} onPress={() => begin('acak', 'Acak Semua Bab', allQuestions, true)}>
              <View style={[ui.iconBox, { width: 48, height: 48, borderRadius: 16, backgroundColor: GREEN }]}><Ionicons name="shuffle" size={22} color={DARK} /></View>
              <View style={{ flex: 1 }}>
                <Text style={ui.cardTitle}>Acak Semua Bab</Text>
                <Text style={ui.smallText}>Maksimal 10 soal acak dari semua bab.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#777C72" />
            </TouchableOpacity>
          )}
        </>
      )}

      {/* ===== Soal ===== */}
      {active && q && !done && (
        <>
          <Text style={[ui.overline, { marginBottom: 8 }]}>PERTANYAAN {idx + 1} DARI {total}</Text>
          <View style={{ height: 6, backgroundColor: '#E3E5DE', borderRadius: 3, marginBottom: 16 }}>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: GREEN, width: `${((idx + (picked ? 1 : 0)) / total) * 100}%` }} />
          </View>
          <View style={[ui.card, { padding: 18 }]}><Text style={{ fontSize: 16, fontWeight: '800', color: DARK, lineHeight: 23 }}>{q.question}</Text></View>
          {q.options.map((o) => {
            const correct = picked && o === q.answer;
            const wrong = picked === o && o !== q.answer;
            return (
              <TouchableOpacity key={o} onPress={() => choose(o)} activeOpacity={0.85}
                style={[ui.card, ui.row, { marginBottom: 9, borderWidth: 1.5, borderColor: correct ? '#7DB421' : wrong ? '#C9503C' : 'transparent', backgroundColor: correct ? '#E3F0D1' : wrong ? '#F6E1DC' : WHITE }]}>
                <Text style={{ flex: 1, fontSize: 12.5, fontWeight: '700', color: DARK }}>{o}</Text>
                {correct && <Ionicons name="checkmark-circle" size={20} color="#4F7A12" />}
                {wrong && <Ionicons name="close-circle" size={20} color="#B3402F" />}
              </TouchableOpacity>
            );
          })}
          {picked && (
            <>
              {q.explanation ? <View style={ui.noteCard}><Ionicons name="bulb-outline" size={20} color={DARK} /><Text style={[ui.smallText, { flex: 1 }]}>{q.explanation}</Text></View> : null}
              <TouchableOpacity style={ui.primaryButton} onPress={next}>
                <Text style={ui.primaryButtonText}>{idx + 1 >= total ? 'Lihat Hasil' : 'Lanjut'}</Text>
                <Ionicons name="arrow-forward" size={16} color={DARK} />
              </TouchableOpacity>
            </>
          )}
        </>
      )}

      {/* ===== Hasil ===== */}
      {active && done && (
        <View style={[ui.card, { alignItems: 'center', padding: 24 }]}>
          <Ionicons name="trophy" size={48} color="#6E9D19" />
          <Text style={[ui.brand, { marginTop: 8 }]}>{score} / {total}</Text>
          <Text style={[ui.smallText, { textAlign: 'center', marginTop: 6 }]}>
            {score === total ? 'Sempurna! Kamu jago memilah sampah.' : score >= total / 2 ? 'Bagus! Terus belajar ya.' : 'Jangan menyerah, coba pelajari katalog lalu ulangi.'}
          </Text>
          <Text style={[ui.tinyText, { marginTop: 8, textAlign: 'center' }]}>{session ? 'Skor tersimpan di akunmu.' : 'Skor tersimpan di perangkat. Masuk ke akun agar tersimpan juga di akun.'}</Text>
          <TouchableOpacity style={[ui.primaryButton, { alignSelf: 'stretch' }]} onPress={() => begin(active.id, active.title, active.id === 'acak' ? allQuestions : (chapters.find((c) => c.id === active.id)?.questions ?? active.questions), active.id === 'acak')}>
            <Text style={ui.primaryButtonText}>Ulangi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[ui.secondaryButton, { alignSelf: 'stretch' }]} onPress={backToList}><Text style={ui.secondaryButtonText}>Pilih Bab Lain</Text></TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
