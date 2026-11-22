import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ui, DARK, GREEN, WHITE } from '../theme';
import ScreenHeader from '../components/ScreenHeader';

const FEATURES = [
  { icon: 'scan-outline', t: 'Scan Sampah', d: 'Foto sampah, lalu AI membantu menentukan kategorinya.' },
  { icon: 'book-outline', t: 'Katalog', d: 'Panduan jenis sampah dan cara menanganinya.' },
  { icon: 'map-outline', t: 'Peta Bank Sampah', d: 'Cari tempat menyetor sampah terpilah beserta rutenya.' },
  { icon: 'play-circle-outline', t: 'Video Edukasi', d: 'Belajar memilah dan mengolah sampah lewat video.' },
  { icon: 'game-controller-outline', t: 'Kuis Interaktif', d: 'Uji pemahamanmu dan pantau perkembangan skor.' },
  { icon: 'people-outline', t: 'Komunitas', d: 'Terhubung dengan organisasi dan ikuti aksi lingkungan.' },
];

export default function AboutScreen({ onBack }: { onBack: () => void }) {
  return (
    <ScrollView contentContainerStyle={ui.page} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Tentang EcoSort" subtitle="Pilah sampah, mulai dari hal kecil." onBack={onBack} />

      <View style={{ backgroundColor: DARK, borderRadius: 24, padding: 20, alignItems: 'center', marginBottom: 16 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="leaf" size={30} color={DARK} />
        </View>
        <Text style={{ fontSize: 22, fontWeight: '800', color: WHITE, marginTop: 10 }}>EcoSort</Text>
        <Text style={{ fontSize: 11, color: '#C6C9C1', marginTop: 2 }}>Versi 1.0.0</Text>
        <Text style={{ fontSize: 11.5, color: '#C6C9C1', lineHeight: 18, textAlign: 'center', marginTop: 12 }}>
          EcoSort membantu kamu mengenali, memilah, dan menyalurkan sampah dengan cara yang tepat agar lebih banyak sampah bisa diolah kembali.
        </Text>
      </View>

      <Text style={[ui.overline, { marginBottom: 10 }]}>FITUR</Text>
      {FEATURES.map((f) => (
        <View key={f.t} style={[ui.card, ui.row]}>
          <View style={[ui.iconBox, { width: 42, height: 42, borderRadius: 14, backgroundColor: '#DDF5A0' }]}><Ionicons name={f.icon as any} size={21} color={DARK} /></View>
          <View style={{ flex: 1 }}><Text style={ui.cardTitle}>{f.t}</Text><Text style={ui.smallText}>{f.d}</Text></View>
        </View>
      ))}

      <Text style={[ui.overline, { marginBottom: 10, marginTop: 10 }]}>KATEGORI SAMPAH</Text>
      <View style={ui.card}>
        <Text style={ui.smallText}><Text style={{ fontWeight: '800', color: DARK }}>Organik</Text> — sisa makanan, kulit buah, daun; mudah terurai dan bisa dikomposkan.</Text>
        <Text style={[ui.smallText, { marginTop: 8 }]}><Text style={{ fontWeight: '800', color: DARK }}>Daur Ulang</Text> — plastik, kertas, kaca, dan logam yang bersih dan bisa diproses kembali.</Text>
        <Text style={[ui.smallText, { marginTop: 8 }]}><Text style={{ fontWeight: '800', color: DARK }}>Residu</Text> — sampah yang sulit didaur ulang lewat jalur umum.</Text>
      </View>

      <Text style={[ui.overline, { marginBottom: 10, marginTop: 10 }]}>PRIVASI & BATASAN</Text>
      <View style={ui.noteCard}>
        <Ionicons name="shield-checkmark-outline" size={20} color={DARK} />
        <Text style={[ui.smallText, { flex: 1 }]}>
          Foto yang kamu scan dikirim ke layanan AI (Google Gemini) hanya untuk dianalisis dan tidak disimpan oleh aplikasi ini. Riwayat scan hanya berisi nama objek, kategori, dan waktu.
        </Text>
      </View>
      <View style={ui.noteCard}>
        <Ionicons name="information-circle-outline" size={20} color={DARK} />
        <Text style={[ui.smallText, { flex: 1 }]}>
          Hasil AI bisa keliru, jadi gunakan sebagai panduan awal. Jam operasional dan penerimaan sampah di bank sampah sebaiknya diverifikasi langsung sebelum berkunjung.
        </Text>
      </View>
    </ScrollView>
  );
}
