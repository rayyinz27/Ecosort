import AsyncStorage from '@react-native-async-storage/async-storage';

export type ScanEntry = { id: string; item_name: string; category: string; confidence: number | null; created_at: string };
export type QuizEntry = { id: string; score: number; total: number; created_at: string; chapter?: string };

const KS = 'ecosort:scan_history';
const KQ = 'ecosort:quiz_history';
const MAX = 50;

async function load<T>(key: string): Promise<T[]> {
  try { const v = await AsyncStorage.getItem(key); return v ? (JSON.parse(v) as T[]) : []; } catch { return []; }
}
async function add<T>(key: string, entry: T) {
  const list = await load<T>(key);
  try { await AsyncStorage.setItem(key, JSON.stringify([entry, ...list].slice(0, MAX))); } catch { /* abaikan */ }
}

export const addScan = (e: Omit<ScanEntry, 'id' | 'created_at'>) => add<ScanEntry>(KS, { ...e, id: String(Date.now()), created_at: new Date().toISOString() });
export const loadScans = () => load<ScanEntry>(KS);
export const clearScans = () => AsyncStorage.removeItem(KS);

export const addQuiz = (e: Omit<QuizEntry, 'id' | 'created_at'>) => add<QuizEntry>(KQ, { ...e, id: String(Date.now()), created_at: new Date().toISOString() });
export const loadQuiz = () => load<QuizEntry>(KQ);
export const clearQuiz = () => AsyncStorage.removeItem(KQ);

export function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' +
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
