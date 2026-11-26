import { supabase } from './supabase';

export type WasteCategory = 'Organik' | 'Daur Ulang' | 'Residu' | 'Tidak Yakin';
export type ScanResult = {
  item_name: string;
  category: WasteCategory;
  confidence: number | null; // 0..1
  explanation: string;
  handling_tip: string;
  quota?: { used: number; limit: number; remaining: number }; // sisa jatah scan hari ini (dari server)
};

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY; // opsional, hanya untuk uji coba
const GEMINI_MODEL = process.env.EXPO_PUBLIC_AI_MODEL || 'gemini-3.1-flash-lite';

export const PROMPT = `Kamu adalah asisten pemilah sampah untuk aplikasi EcoSort di Indonesia.
Lihat foto dan tentukan objek utama, lalu kelompokkan ke SALAH SATU kategori:
- "Organik": sisa makanan, kulit buah, daun, bahan alami yang mudah terurai.
- "Daur Ulang": plastik (botol, kemasan bersih), kertas/kardus bersih, kaca, logam/kaleng.
- "Residu": sampah yang sulit didaur ulang lewat jalur umum (popok, tisu bekas, kemasan multilayer kotor, puntung rokok, kertas/kardus berminyak).
- "Tidak Yakin": foto buram, tidak ada sampah, atau objek tidak jelas.
Balas HANYA JSON dengan bentuk:
{"item_name": string, "category": "Organik"|"Daur Ulang"|"Residu"|"Tidak Yakin", "confidence": angka 0 sampai 1, "explanation": string singkat 1 kalimat, "handling_tip": string saran penanganan 1-2 kalimat}
Gunakan bahasa Indonesia. Jangan mengarang; jika ragu, turunkan confidence atau pilih "Tidak Yakin".`;

export function normalize(raw: any): ScanResult {
  const cats: WasteCategory[] = ['Organik', 'Daur Ulang', 'Residu', 'Tidak Yakin'];
  let category: WasteCategory = cats.includes(raw?.category) ? raw.category : 'Tidak Yakin';
  const c = Number(raw?.confidence);
  const confidence = Number.isFinite(c) ? Math.max(0, Math.min(1, c)) : null;
  if (confidence !== null && confidence < 0.5) category = 'Tidak Yakin';
  return {
    item_name: String(raw?.item_name || 'Objek tidak dikenali'),
    category,
    confidence,
    explanation: String(raw?.explanation || ''),
    handling_tip: String(raw?.handling_tip || ''),
  };
}

function parseJson(text: string) {
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

async function viaGeminiDirect(base64: string, mime: string): Promise<ScanResult> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY as string },
    body: JSON.stringify({
      contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mime, data: base64 } }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || 'Permintaan ke AI gagal.');
  const text = json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') ?? '';
  if (!text) throw new Error('AI tidak memberi jawaban. Coba foto lain.');
  return normalize(parseJson(text));
}

async function viaEdgeFunction(base64: string, mime: string): Promise<ScanResult> {
  if (!supabase) throw new Error('AI belum terhubung. Isi .env (Supabase atau kunci Gemini) lalu jalankan ulang aplikasi.');
  const { data: sess } = await supabase.auth.getSession();
  if (!sess.session) throw new Error('Masuk (login) dulu untuk memakai scan AI.');
  const { data, error } = await supabase.functions.invoke('classify-waste', { body: { image_base64: base64, mime_type: mime } });
  if (error) {
    let msg = error.message;
    try { const j = await (error as any).context?.json?.(); if (j?.error) msg = j.error; } catch { /* abaikan */ }
    throw new Error(msg);
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  const r = normalize(data);
  const m = (data as any)?._meta;
  if (m && typeof m.limit === 'number') r.quota = { used: m.used, limit: m.limit, remaining: m.remaining };
  return r;
}

export async function classifyWaste(base64: string, mime = 'image/jpeg'): Promise<ScanResult> {
  return GEMINI_KEY ? viaGeminiDirect(base64, mime) : viaEdgeFunction(base64, mime);
}
