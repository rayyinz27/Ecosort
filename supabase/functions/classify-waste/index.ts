// Supabase Edge Function: klasifikasi sampah dengan Gemini (kunci API disimpan aman di server).
// Deploy:  supabase functions deploy classify-waste
// Secret:  supabase secrets set GEMINI_API_KEY=xxxx   (opsional: GEMINI_MODEL=gemini-3.1-flash-lite)

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
  try {
    const key = Deno.env.get('GEMINI_API_KEY');
    if (!key) return json({ error: 'GEMINI_API_KEY belum diatur di Supabase secrets.' }, 500);
    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-3.1-flash-lite';

    const { image_base64, mime_type } = await req.json();
    if (!image_base64) return json({ error: 'Gambar tidak ditemukan.' }, 400);
    if (image_base64.length > 9_000_000) return json({ error: 'Gambar terlalu besar. Gunakan foto yang lebih kecil.' }, 413);

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mime_type || 'image/jpeg', data: image_base64 } }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      }),
    });
    const data = await res.json();
    if (!res.ok) return json({ error: data?.error?.message || 'Permintaan ke AI gagal.' }, 502);

    const text = (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('');
    if (!text) return json({ error: 'AI tidak memberi jawaban. Coba foto lain.' }, 502);
    return json(JSON.parse(text.replace(/```json|```/g, '').trim()));
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Terjadi kesalahan.' }, 500);
  }
});
