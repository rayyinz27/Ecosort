import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ui, DARK } from '../theme';
import Sheet from './Sheet';
import Gallery from './Gallery';
import type { CatalogItem } from '../lib/data';

const WHERE: Record<string, string> = {
  Organik: 'Wadah sampah organik atau komposter.',
  'Daur Ulang': 'Wadah daur ulang atau disetor ke bank sampah.',
  Residu: 'Wadah residu agar tidak mencemari sampah lain.',
};

export default function WasteModal({ item: itemProp, onClose }: { item: CatalogItem | null; onClose: () => void }) {
  const last = useRef(itemProp);
  if (itemProp) last.current = itemProp;
  const item = itemProp ?? last.current; // pertahankan isi saat animasi menutup

  const openVideo = async (url: string) => {
    try { await Linking.openURL(/^https?:\/\//i.test(url) ? url : 'https://' + url); }
    catch { Alert.alert('Gagal membuka', 'Tautan video tidak dapat dibuka.'); }
  };

  return (
    <Sheet visible={!!itemProp} onClose={onClose}>
      <View style={ui.sheetHandle} />
      {item && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {item.images.length > 0 ? (
            <Gallery images={item.images} height={200} />
          ) : (
            <View style={{ height: 110, borderRadius: 18, backgroundColor: item.color, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={item.icon as any} size={44} color={DARK} />
            </View>
          )}

          <Text style={[ui.brand, { fontSize: 22, marginTop: 14 }]}>{item.name}</Text>
          <Text style={[ui.tag, { marginTop: 4, marginBottom: 0 }]}>{item.category.toUpperCase()}</Text>
          <Text style={ui.bodyText}>{item.desc}</Text>

          {item.details ? (
            <>
              <Text style={[ui.overline, { marginTop: 16 }]}>PELAJARI LEBIH LANJUT</Text>
              <Text style={[ui.bodyText, { marginTop: 6 }]}>{item.details}</Text>
            </>
          ) : null}

          {item.tip ? (
            <View style={[ui.card, { marginTop: 16, marginBottom: 0 }]}>
              <Text style={ui.overline}>CARA MENANGANI</Text>
              <Text style={ui.bodyText}>{item.tip}</Text>
            </View>
          ) : null}

          <View style={ui.noteCard}>
            <Ionicons name="trash-outline" size={20} color={DARK} />
            <View style={{ flex: 1 }}>
              <Text style={ui.cardTitle}>Dibuang ke</Text>
              <Text style={ui.smallText}>{WHERE[item.category] ?? 'Sesuai kategorinya.'}</Text>
            </View>
          </View>

          {item.video ? (
            <TouchableOpacity style={ui.primaryButton} onPress={() => openVideo(item.video)}>
              <Ionicons name="play-circle" size={19} color={DARK} />
              <Text style={ui.primaryButtonText}>Tonton Video Penjelasan</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={item.video ? ui.secondaryButton : ui.primaryButton} onPress={onClose}>
            <Text style={item.video ? ui.secondaryButtonText : ui.primaryButtonText}>Mengerti</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </Sheet>
  );
}
