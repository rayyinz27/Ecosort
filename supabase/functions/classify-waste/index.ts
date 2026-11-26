// Supabase Edge Function: klasifikasi sampah dengan Gemini.
// - Hanya pengguna yang sudah login (token JWT valid).
// - Batas scan per pengguna per hari (default 20, ubah lewat secret DAILY_SCAN_LIMIT).
// Deploy:  supabase functions deploy classify-waste
// Secret:  GEMINI_API_KEY (wajib), GEMINI_MODEL (opsional), DAILY_SCAN_LIMIT (opsional)
import { createClient } from 'npm:@supabase/supabase-js@2';

const PROMPT = `Kamu adalah asisten pemilah sampah untuk aplikasi EcoSort di Indonesia.
Lihat foto dan tentukan objek utama, lalu kelompokkan ke SALAH SATU kategori:
- "Organik": sisa makanan, kulit buah, daun, bahan alami yang mudah terurai.
- "Daur Ulang": plastik (botol, kemasan bersih), kertas/kardus bersih, kaca, logam/kaleng.
- "Residu": sampah yang sulit didaur ulang lewat jalur umum (popok, tisu bekas, kemasan multilayer kotor, puntung rokok, kertas/kardus berminyak).
- "Tidak Yakin": foto buram, tidak ada sampah, atau objek tidak jelas.
Balas HANYA JSON dengan bentuk:
{"item_name": string, "category": "Organik"|"Daur Ulang"|"Residu"|"Tidak Yakin", "confidence": angka 0 sampai 1, "explanation": string singkat 1 kalimat, "handling_tip": string saran penanganan 1-2 kalimat}
Gunakan bahasa Indonesia. Jangan mengarang; jika ragu, turunkan confidence atau pilih "Tidak Yakin".`;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  // deno-lint-ignore no-explicit-any
  let admin: any = null;
  let userId = '';
  let quotaTaken = false;
  const refund = async () => {
    if (admin && quotaTaken) { try { await admin.rpc('refund_scan_quota', { p_user: userId }); } catch { /* abaikan */ } quotaTaken = false; }
  };

  try {
    const key = Deno.env.get('GEMINI_API_KEY');
    if (!key) return json({ error: 'GEMINI_API_KEY belum diatur di Supabase secrets.' }, 500);
    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-3.1-flash-lite';
    const limit = Number(Deno.env.get('DAILY_SCAN_LIMIT')) || 20;

    // 1) Wajib login
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) return json({ error: 'Konfigurasi server belum lengkap.' }, 500);
    admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: u, error: uerr } = await admin.auth.getUser(token);
    if (uerr || !u?.user) return json({ error: 'Masuk (login) dulu untuk memakai scan AI.', code: 'login' }, 401);
    userId = u.user.id;

    // 2) Validasi isi permintaan
    const { image_base64, mime_type } = await req.json();
    if (!image_base64) return json({ error: 'Gambar tidak ditemukan.' }, 400);
    if (image_base64.length > 9_000_000) return json({ error: 'Gambar terlalu besar. Gunakan foto yang lebih kecil.' }, 413);

    // 3) Batas harian per pengguna
    const { data: used, error: qerr } = await admin.rpc('use_scan_quota', { p_user: userId, p_limit: limit });
    if (qerr) return json({ error: 'Kuota scan belum diatur di database (jalankan schema_update_6.sql). Detail: ' + qerr.message }, 500);
    if (used === -1) return json({ error: `Batas scan harian tercapai (${limit} per hari). Coba lagi besok.`, code: 'quota' }, 429);
    quotaTaken = true;

    // 4) Panggil AI
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mime_type || 'image/jpeg', data: image_base64 } }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      }),
    });
    const data = await res.json();
    if (!res.ok) { await refund(); return json({ error: data?.error?.message || 'Permintaan ke AI gagal.' }, 502); }

    const text = (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('');
    if (!text) { await refund(); return json({ error: 'AI tidak memberi jawaban. Coba foto lain.' }, 502); }

    const result = JSON.parse(text.replace(/```json|```/g, '').trim());
    return json({ ...result, _meta: { used, limit, remaining: Math.max(0, limit - Number(used)) } });
  } catch (e) {
    await refund();
    return json({ error: e instanceof Error ? e.message : 'Terjadi kesalahan.' }, 500);
  }
});
