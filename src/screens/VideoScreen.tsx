import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Linking, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ui, DARK, MUTED } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import { fetchVideos, youtubeThumb, Video } from '../lib/data';

export default function VideoScreen({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<Video[]>([]);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('Semua');

  useEffect(() => {
    fetchVideos(true).then((r) => { setItems(r.items); setDemo(r.demo); setLoading(false); });
  }, []);

  const open = async (url: string) => {
    if (!url) return Alert.alert('Video belum tersedia', 'Tautan video belum diisi oleh admin.');
    try { await Linking.openURL(url); } catch { Alert.alert('Gagal membuka', 'Tautan video tidak dapat dibuka.'); }
  };

  return (
    <ScrollView contentContainerStyle={ui.page} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Video Edukasi" subtitle="Belajar memilah sampah lewat video." onBack={onBack} />
      {!loading && items.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14 }}>
          {['Semua', ...Array.from(new Set(items.map((v) => v.category)))].map((c) => (
            <TouchableOpacity key={c} onPress={() => setCat(c)} style={[ui.pill, cat === c && ui.pillActive]}>
              <Text style={[ui.pillText, cat === c && ui.pillTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      {loading && <ActivityIndicator color={DARK} style={{ marginTop: 30 }} />}
      {!loading && items.length === 0 && (
        <View style={ui.empty}><Ionicons name="videocam-outline" size={40} color="#9BA18F" /><Text style={ui.smallText}>Belum ada video.</Text></View>
      )}
      {items.filter((v) => cat === 'Semua' || v.category === cat).map((v) => {
        const thumb = youtubeThumb(v.url);
        return (
          <TouchableOpacity key={v.id} style={[ui.card, { padding: 0, overflow: 'hidden' }]} onPress={() => open(v.url)} activeOpacity={0.85}>
            <View style={{ height: 150, backgroundColor: '#E3F0D1', alignItems: 'center', justifyContent: 'center' }}>
              {thumb ? <Image source={{ uri: thumb }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Ionicons name="play-circle-outline" size={48} color={DARK} />}
              {thumb && <View style={{ position: 'absolute' }}><Ionicons name="play-circle" size={52} color="#FFFFFF" /></View>}
            </View>
            <View style={{ padding: 13 }}>
              <Text style={ui.tag}>{v.category.toUpperCase()}{v.duration ? ` · ${Math.max(1, Math.round(v.duration / 60))} menit` : ''}</Text>
              <Text style={ui.cardTitle}>{v.title}</Text>
              {v.description ? <Text style={ui.smallText}>{v.description}</Text> : null}
            </View>
          </TouchableOpacity>
        );
      })}
      {demo && <Text style={[ui.tinyText, { marginTop: 4 }]}>Ini daftar contoh. Admin dapat menambahkan video sendiri lewat Profil → Panel Admin.</Text>}
    </ScrollView>
  );
}
