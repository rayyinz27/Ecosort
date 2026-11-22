# EcoSort — Update 2

Baru: notifikasi, popup detail bank sampah (foto + info), admin bisa kelola notifikasi & foto bank, peta diperbaiki, tampilan tombol lebih membulat.

## Cara pasang
1. Ekstrak zip ke folder project (Replace file yang sama). Tidak ada dependency baru.
2. Supabase → SQL Editor → jalankan seluruh isi `supabase/schema_update_2.sql`.
3. `npx expo start -c`, lalu login ulang jika diminta.

## Admin
Profil → Panel Admin:
- **Notifikasi**: tambah/ubah/hapus pengumuman. Muncul di lonceng semua pengguna (titik merah = belum dibaca).
- **Bank Sampah**: sekarang ada kolom deskripsi dan unggah sampai 5 foto.

## Catatan
- Notifikasi ini ada di dalam aplikasi (diambil saat aplikasi dibuka). Push notification ke layar kunci butuh development build, tidak bisa lewat Expo Go.
- Peta memakai tile resmi OpenStreetMap (butuh internet).
