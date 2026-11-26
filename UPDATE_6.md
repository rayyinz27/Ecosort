# EcoSort — Update 6 (scan wajib login + batas harian)
1. Ekstrak zip ke folder project (Replace).
2. Supabase SQL Editor: jalankan `supabase/schema_update_6.sql` (lalu hapus filenya; sudah ada di schema_all.sql).
3. Deploy ulang Edge Function (WAJIB, kalau tidak batas belum berlaku):
   supabase functions deploy classify-waste
   (atau dashboard -> Edge Functions -> classify-waste -> tempel isi index.ts -> Deploy)
4. Opsional: ubah batas harian lewat secret DAILY_SCAN_LIMIT (default 20).
5. npx expo start -c
