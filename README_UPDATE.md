# EcoSort — Update fitur

Yang baru: popup katalog, daftar Video Edukasi, Kuis Interaktif, peta sungguhan, Scan dengan AI, dan login User/Admin.
Desain & fitur lama tidak diubah.

## 1. Timpa file
Ekstrak zip ini ke folder project `EcoSort` (pilih *Replace* jika diminta). File yang berubah: `App.tsx`, `package.json`, `.env.example`. Sisanya file baru di `src/` dan `supabase/`.

## 2. Install dependency baru
```bash
npm install
npx expo install @react-native-async-storage/async-storage react-native-url-polyfill react-native-webview
npx expo install --fix
npx expo start -c
```
(`react-native-maps` sudah tidak dipakai; boleh dibiarkan atau `npm uninstall react-native-maps`.)

## 3. Supabase (wajib untuk login, admin, dan data dinamis)
1. Salin `.env.example` → `.env`, isi `EXPO_PUBLIC_SUPABASE_URL` dan `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
2. Supabase → SQL Editor: jalankan `supabase/schema.sql` (jika belum), lalu `supabase/schema_update.sql`.
3. Supabase → Authentication → Providers → Email: untuk testing, matikan **Confirm email** agar bisa langsung login.
4. Buka aplikasi → Profil → Masuk / Daftar → buat akun.
5. Jadikan akun itu admin (SQL Editor):
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'emailkamu@contoh.com');
   ```
   Keluar lalu masuk lagi → muncul menu **Panel Admin** di Profil.

Role hanya bisa diubah lewat SQL/dashboard, tidak bisa dari aplikasi (dijaga RLS).

## 4. Scan dengan AI (Gemini)
Ambil API key gratis di https://aistudio.google.com/apikey.

**Cara aman (disarankan) — Edge Function:**
```bash
npm i -g supabase
supabase login
supabase link --project-ref PROJECT_REF_KAMU
supabase secrets set GEMINI_API_KEY=isi_key_kamu
supabase functions deploy classify-waste
```
**Cara cepat untuk tes:** isi `EXPO_PUBLIC_GEMINI_API_KEY` di `.env` (key ikut terbawa di aplikasi, jangan untuk rilis).

Nama model bisa diganti lewat `EXPO_PUBLIC_AI_MODEL` (mode cepat) atau secret `GEMINI_MODEL` (Edge Function), karena Google sering mengganti nama model. Default: `gemini-3.1-flash-lite`.

## 5. Cara kerja konten
- **Video / Kuis / Bank Sampah**: admin menambah, mengubah, menghapus lewat Profil → Panel Admin.
- Selama tabel masih kosong (atau Supabase belum diisi), pengguna melihat **data contoh** agar tampilan tidak kosong. Setelah admin menambah data, data contoh otomatis tidak dipakai.
- Video dibuka lewat YouTube (tempel link YouTube; thumbnail otomatis). Daftar contoh hanya membuka hasil pencarian YouTube.
- Peta memakai Leaflet + OpenStreetMap/CARTO (tanpa API key Google), butuh internet. Tombol **Rute** membuka Google Maps.
- Skor kuis & riwayat scan tersimpan ke akun jika user login.

## Catatan
- Hasil AI bisa keliru; aplikasi sudah menampilkan peringatan dan kategori "Tidak Yakin" untuk keyakinan rendah (<50%).
- Menu Profil "Riwayat Scan" dan "Hasil Kuis" masih placeholder (datanya sudah tersimpan, tampilannya belum dibuat).
