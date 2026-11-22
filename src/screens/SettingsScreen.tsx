import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ui, DARK } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import { useAuth } from '../lib/auth';
import { clearScans, clearQuiz } from '../lib/history';
import { getScanQualityKey, setScanQualityKey, QUALITY_INFO, ScanQuality } from '../lib/settings';

export default function SettingsScreen({ onBack, onLogin }: { onBack: () => void; onLogin: () => void }) {
  const { session, profile, updateName, changePassword, signOut } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? '');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState<'' | 'name' | 'pw'>('');
  const [quality, setQuality] = useState<ScanQuality>('standar');

  useEffect(() => { getScanQualityKey().then(setQuality); }, []);
  useEffect(() => { setName(profile?.full_name ?? ''); }, [profile?.full_name]);

  const pickQuality = (q: ScanQuality) => { setQuality(q); setScanQualityKey(q); };

  const saveName = async () => {
    setBusy('name');
    const r = await updateName(name);
    setBusy('');
    Alert.alert(r.error ? 'Gagal' : 'Berhasil', r.error ?? 'Nama berhasil diperbarui.');
  };
  const savePw = async () => {
    setBusy('pw');
    const r = await changePassword(pw);
    setBusy('');
    if (!r.error) setPw('');
    Alert.alert(r.error ? 'Gagal' : 'Berhasil', r.error ?? 'Kata sandi berhasil diubah.');
  };
  const confirmClear = (label: string, fn: () => Promise<unknown>) =>
    Alert.alert(`Hapus ${label}?`, 'Data ini hanya dihapus dari perangkat ini.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => { await fn(); Alert.alert('Selesai', `${label} di perangkat sudah dihapus.`); } },
    ]);

  return (
    <ScrollView contentContainerStyle={ui.page} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <ScreenHeader title="Pengaturan" subtitle="Atur akun dan preferensi aplikasi." onBack={onBack} />

      <Text style={[ui.overline, { marginBottom: 10 }]}>AKUN</Text>
      {session ? (
        <View style={ui.card}>
          <Text style={[ui.tinyText, { marginBottom: 4 }]}>Email</Text>
          <Text style={[ui.cardTitle, { marginBottom: 12 }]}>{session.user.email}</Text>
          <Text style={[ui.tinyText, { marginBottom: 4 }]}>Nama</Text>
          <TextInput style={ui.input} value={name} onChangeText={setName} placeholder="Nama lengkap" placeholderTextColor="#969B91" />
          <TouchableOpacity style={[ui.primaryButton, { marginTop: 0 }]} onPress={saveName} disabled={busy !== ''}>
            {busy === 'name' ? <ActivityIndicator color={DARK} /> : <Text style={ui.primaryButtonText}>Simpan Nama</Text>}
          </TouchableOpacity>
          <Text style={[ui.tinyText, { marginBottom: 4, marginTop: 16 }]}>Kata sandi baru</Text>
          <TextInput style={ui.input} value={pw} onChangeText={setPw} secureTextEntry placeholder="Minimal 6 karakter" placeholderTextColor="#969B91" autoCapitalize="none" />
          <TouchableOpacity style={[ui.secondaryButton, { marginTop: 0 }]} onPress={savePw} disabled={busy !== ''}>
            {busy === 'pw' ? <ActivityIndicator color={DARK} /> : <Text style={ui.secondaryButtonText}>Ubah Kata Sandi</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={ui.card}>
          <Text style={ui.smallText}>Masuk untuk mengubah nama, kata sandi, dan menyimpan riwayat di akunmu.</Text>
          <TouchableOpacity style={ui.primaryButton} onPress={onLogin}><Text style={ui.primaryButtonText}>Masuk / Daftar</Text></TouchableOpacity>
        </View>
      )}

      <Text style={[ui.overline, { marginBottom: 10, marginTop: 8 }]}>KUALITAS FOTO SCAN</Text>
      <View style={ui.card}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['hemat', 'standar', 'tinggi'] as ScanQuality[]).map((q) => (
            <TouchableOpacity key={q} onPress={() => pickQuality(q)} style={[ui.pill, quality === q && ui.pillActive]}>
              <Text style={[ui.pillText, quality === q && ui.pillTextActive]}>{q.charAt(0).toUpperCase() + q.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[ui.smallText, { marginTop: 10 }]}>{QUALITY_INFO[quality]}</Text>
        <Text style={[ui.tinyText, { marginTop: 4 }]}>Berlaku untuk foto yang diambil setelah pengaturan ini diubah.</Text>
      </View>

      <Text style={[ui.overline, { marginBottom: 10, marginTop: 8 }]}>DATA DI PERANGKAT</Text>
      <TouchableOpacity style={[ui.card, ui.row]} onPress={() => confirmClear('riwayat scan', clearScans)}>
        <Ionicons name="trash-outline" size={20} color={DARK} /><Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: DARK }}>Hapus riwayat scan</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[ui.card, ui.row]} onPress={() => confirmClear('hasil kuis', clearQuiz)}>
        <Ionicons name="trash-outline" size={20} color={DARK} /><Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: DARK }}>Hapus hasil kuis</Text>
      </TouchableOpacity>

      {session && (
        <TouchableOpacity style={[ui.secondaryButton, { marginTop: 14 }]} onPress={async () => { await signOut(); onBack(); }}>
          <Ionicons name="log-out-outline" size={18} color="#B3402F" /><Text style={[ui.secondaryButtonText, { color: '#B3402F' }]}>Keluar dari akun</Text>
        </TouchableOpacity>
      )}
      <Text style={[ui.tinyText, { textAlign: 'center', marginTop: 18 }]}>EcoSort versi 1.0.0</Text>
    </ScrollView>
  );
}
