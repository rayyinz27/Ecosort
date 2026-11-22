import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { ui, DARK } from '../theme';
import { useAuth } from '../lib/auth';
import Sheet from './Sheet';

export default function AuthModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { signIn, signUp, configured } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);

  const submit = async () => {
    setMsg(null);
    if (!email.trim() || !password) return setMsg({ text: 'Email dan kata sandi wajib diisi.', error: true });
    if (mode === 'register' && !name.trim()) return setMsg({ text: 'Nama wajib diisi.', error: true });
    setBusy(true);
    const r = mode === 'login' ? await signIn(email, password) : await signUp(name, email, password);
    setBusy(false);
    if (r.error) return setMsg({ text: r.error, error: true });
    if ('info' in r && r.info) { setMsg({ text: r.info, error: false }); setMode('login'); return; }
    setPassword(''); onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
            <View style={ui.sheetHandle} />
            <Text style={[ui.brand, { fontSize: 22 }]}>{mode === 'login' ? 'Masuk' : 'Daftar'}</Text>
            <Text style={[ui.subtitle, { marginBottom: 16 }]}>Pengguna dan admin masuk dari sini. Peran dikenali otomatis dari akun.</Text>
            {!configured && <View style={[ui.noteCard, { marginTop: 0, marginBottom: 12 }]}><Text style={ui.smallText}>Supabase belum dikonfigurasi di .env, jadi login belum bisa dipakai.</Text></View>}
            {mode === 'register' && <TextInput style={ui.input} placeholder="Nama lengkap" placeholderTextColor="#969B91" value={name} onChangeText={setName} />}
            <TextInput style={ui.input} placeholder="Email" placeholderTextColor="#969B91" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
            <TextInput style={ui.input} placeholder="Kata sandi (min. 6 karakter)" placeholderTextColor="#969B91" secureTextEntry value={password} onChangeText={setPassword} />
            {msg && <Text style={[ui.smallText, { color: msg.error ? '#B3402F' : '#526C2B', marginBottom: 6 }]}>{msg.text}</Text>}
            <TouchableOpacity style={ui.primaryButton} onPress={submit} disabled={busy}>
              {busy ? <ActivityIndicator color={DARK} /> : <Text style={ui.primaryButtonText}>{mode === 'login' ? 'Masuk' : 'Buat Akun'}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={ui.secondaryButton} onPress={() => { setMsg(null); setMode(mode === 'login' ? 'register' : 'login'); }}>
              <Text style={ui.secondaryButtonText}>{mode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}</Text>
            </TouchableOpacity>
    </Sheet>
  );
}
