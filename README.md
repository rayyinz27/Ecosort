# EcoSort — React Native + Expo

Prototype mobile EcoSort berdasarkan Proposal Tugas Besar Sistem Multimedia Kelompok 3.

## Fitur yang sudah tersedia pada prototype
- Beranda dengan navigasi utama.
- Scan sampah menggunakan kamera atau galeri.
- Katalog sampah: organik, daur ulang, residu.
- Peta bank sampah dengan marker dan daftar lokasi contoh.
- Informasi komunitas/organisasi lingkungan.
- Profil pengguna dalam mode demo.
- Tema visual abu-abu terang, charcoal, dan lime green mengikuti referensi desain.

## Penting: batasan prototype
1. **Klasifikasi AI belum aktif.** Tombol scan saat ini menguji alur pemilihan foto dan menampilkan contoh UI. Hasil "Botol Plastik" bukan prediksi dari foto.
2. Proposal menyebut MobileNetV2 hasil fine-tuning untuk 3 kelas. Model terlatih milik kelompok perlu diekspor (misalnya ONNX/TFLite) dan dihubungkan melalui API/inference service. Model MobileNetV2 umum tidak otomatis mengenali kategori sampah secara akurat.
3. Lokasi bank sampah dan organisasi dalam aplikasi ini adalah **data contoh/placeholder**, bukan mitra atau lokasi terverifikasi. Ganti dengan data resmi sebelum dipakai masyarakat.
4. Supabase belum wajib untuk menjalankan demo. SQL skema awal tersedia di `supabase/schema.sql`.

## Instalasi Windows + VS Code

Project disiapkan dengan Expo SDK 57 agar sesuai dengan versi Expo Go yang tersedia saat paket ini dibuat. Expo SDK 58 sudah dirilis, tetapi dukungan Expo Go SDK 58 masih dalam proses rilis; cek halaman Expo Go jika statusnya berubah.
### 1. Pasang prasyarat
- Node.js versi LTS: https://nodejs.org/
- Visual Studio Code: https://code.visualstudio.com/
- Expo Go dari Play Store pada HP Android: https://expo.dev/go

Android Studio tidak diperlukan untuk preview di HP melalui Expo Go.

### 2. Buka project
- Ekstrak `EcoSort.zip`.
- Buka VS Code → File → Open Folder → pilih folder `EcoSort`.
- Buka Terminal → New Terminal.

### 3. Install dependency
Jalankan:
```bash
npm install
npx expo install expo-image-picker react-native-maps react-native-safe-area-context expo-status-bar @expo/vector-icons
npx expo install --fix
```

Jika Expo memberi peringatan versi dependency, jalankan:
```bash
npx expo install --fix
```

### 4. Jalankan aplikasi
```bash
npx expo start
```
Terminal akan menampilkan QR Code. Pastikan laptop dan HP terhubung ke jaringan Wi-Fi yang sama, lalu scan QR dari aplikasi Expo Go.

Jika jaringan lokal tidak berhasil:
```bash
npx expo start --tunnel
```

Tekan `r` di terminal untuk reload. Simpan perubahan file untuk mencoba Fast Refresh.

## Menyiapkan Supabase (opsional untuk tahap berikutnya)
1. Buat project di https://supabase.com/
2. Buka Project Settings → API, salin Project URL dan anon/publishable key.
3. Salin `.env.example` menjadi `.env`, lalu isi nilainya.
4. Jalankan SQL pada `supabase/schema.sql` di SQL Editor Supabase.
5. Aktifkan Row Level Security dan buat policy sesuai peran pengguna sebelum aplikasi dipakai sungguhan.

Jangan pernah menaruh `service_role` key di aplikasi mobile. Gunakan anon/publishable key dengan RLS.

## Catatan peta
Peta menggunakan `react-native-maps` dan marker contoh di area Bandung. Koordinat, alamat, jam, dan penerimaan sampah harus diverifikasi dengan pengelola bank sampah. Untuk rute navigasi, tahap selanjutnya dapat membuka Google Maps/Apple Maps dengan koordinat lokasi.

## Struktur
```text
EcoSort/
├── App.tsx
├── app.json
├── package.json
├── .env.example
├── README.md
├── src/
└── supabase/
    └── schema.sql
```
# Ecosort
