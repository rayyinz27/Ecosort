import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase, hasSupabase } from './supabase';

export type Role = 'user' | 'admin';
export type Profile = { id: string; full_name: string | null; role: Role };

type AuthState = {
  ready: boolean;
  configured: boolean;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (name: string, email: string, password: string) => Promise<{ error?: string; info?: string }>;
  signOut: () => Promise<void>;
  updateName: (name: string) => Promise<{ error?: string }>;
  changePassword: (password: string) => Promise<{ error?: string }>;
};

const NOT_CONFIGURED = 'Supabase belum dikonfigurasi. Isi file .env terlebih dahulu (lihat README_UPDATE.md).';
const Ctx = createContext<AuthState | null>(null);

function translate(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'Email atau kata sandi salah.';
  if (m.includes('already registered')) return 'Email sudah terdaftar. Silakan masuk.';
  if (m.includes('email not confirmed')) return 'Email belum dikonfirmasi. Cek kotak masuk email kamu.';
  if (m.includes('password should be')) return 'Kata sandi minimal 6 karakter.';
  if (m.includes('network')) return 'Tidak ada koneksi internet.';
  return msg;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!hasSupabase);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  useEffect(() => {
    if (!supabase || !userId) { setProfile(null); return; }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name, role').eq('id', userId).maybeSingle();
      if (cancelled) return;
      if (error) {
        // Jangan diam-diam dianggap user biasa: tampilkan penyebabnya
        Alert.alert('Gagal memuat profil', error.message + (error.code ? ` (${error.code})` : ''));
        return;
      }
      if (data) { setProfile(data as Profile); return; }
      // Akun lama yang belum punya baris profil
      const name = (session?.user.user_metadata?.full_name as string | undefined) ?? null;
      const { error: insErr } = await supabase.from('profiles').insert({ id: userId, full_name: name });
      if (cancelled) return;
      if (insErr) { Alert.alert('Gagal membuat profil', insErr.message + (insErr.code ? ` (${insErr.code})` : '')); return; }
      setProfile({ id: userId, full_name: name, role: 'user' });
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return error ? { error: translate(error.message) } : {};
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    if (!supabase) return { error: NOT_CONFIGURED };
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(), password, options: { data: { full_name: name.trim() } },
    });
    if (error) return { error: translate(error.message) };
    if (!data.session) return { info: 'Pendaftaran berhasil. Cek email untuk konfirmasi, lalu masuk.' };
    return {};
  }, []);

  const signOut = useCallback(async () => { if (supabase) await supabase.auth.signOut(); setProfile(null); }, []);

  const updateName = useCallback(async (name: string) => {
    if (!supabase || !userId) return { error: NOT_CONFIGURED };
    const n = name.trim();
    if (!n) return { error: 'Nama tidak boleh kosong.' };
    const { error } = await supabase.from('profiles').update({ full_name: n }).eq('id', userId);
    if (error) return { error: error.message };
    setProfile((p) => (p ? { ...p, full_name: n } : p));
    return {};
  }, [userId]);

  const changePassword = useCallback(async (password: string) => {
    if (!supabase) return { error: NOT_CONFIGURED };
    if (password.length < 6) return { error: 'Kata sandi minimal 6 karakter.' };
    const { error } = await supabase.auth.updateUser({ password });
    return error ? { error: translate(error.message) } : {};
  }, []);

  const value: AuthState = {
    ready, configured: hasSupabase, session, profile,
    isAdmin: profile?.role === 'admin', signIn, signUp, signOut, updateName, changePassword,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return v;
}
