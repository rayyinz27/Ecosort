import React, { useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ui, DARK, GREEN } from '../theme';
import type { ScanResult } from '../lib/ai';
import Sheet from './Sheet';

const ICON: Record<string, string> = { Organik: 'leaf', 'Daur Ulang': 'refresh-circle', Residu: 'trash', 'Tidak Yakin': 'help-circle' };

type Props = { result: ScanResult | null; photo: string | null; onClose: () => void; onCatalog: () => void; onFindBank: () => void };

export default function ScanResultModal({ result: resultProp, photo, onClose, onCatalog, onFindBank }: Props) {
  const last = useRef(resultProp);
  if (resultProp) last.current = resultProp;
  const result = resultProp ?? last.current; // pertahankan isi saat animasi menutup
  const unsure = result?.category === 'Tidak Yakin';
  const pct = result && result.confidence !== null ? Math.round(result.confidence * 100) : null;
  return (
    <Sheet visible={!!resultProp} onClose={onClose}>
          <View style={ui.sheetHandle} />
          {result && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={ui.overline}>HASIL ANALISIS AI</Text>
              <View style={[ui.row, { marginTop: 10 }]}>
                {photo ? <Image source={{ uri: photo }} style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: '#E4E9DD' }} /> : null}
                <View style={{ flex: 1 }}>
                  <Text style={[ui.brand, { fontSize: 21 }]} numberOfLines={2}>{result.item_name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, alignSelf: 'flex-start', backgroundColor: unsure ? '#ECEDE6' : GREEN, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 5 }}>
                    <Ionicons name={ICON[result.category] as any} size={14} color={DARK} />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: DARK }}>{result.category}</Text>
                  </View>
                </View>
              </View>

              {pct !== null && (
                <View style={{ marginTop: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={ui.tinyText}>Tingkat keyakinan</Text>
                    <Text style={[ui.tinyText, { color: DARK, fontWeight: '800' }]}>{pct}%</Text>
                  </View>
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: '#E3E5DE' }}>
                    <View style={{ height: 8, borderRadius: 4, backgroundColor: '#6E9D19', width: `${pct}%` }} />
                  </View>
                </View>
              )}

              {result.explanation ? <Text style={ui.bodyText}>{result.explanation}</Text> : null}
              {result.handling_tip ? (
                <View style={ui.noteCard}>
                  <Ionicons name="bulb-outline" size={20} color={DARK} />
                  <View style={{ flex: 1 }}>
                    <Text style={ui.cardTitle}>Cara menangani</Text>
                    <Text style={ui.smallText}>{result.handling_tip}</Text>
                  </View>
                </View>
              ) : null}
              <Text style={[ui.tinyText, { marginTop: 12 }]}>Hasil AI bisa keliru. Periksa kembali jika kamu ragu.</Text>

              {!unsure && (
                <TouchableOpacity style={ui.primaryButton} onPress={result.category === 'Daur Ulang' ? onFindBank : onCatalog}>
                  <Ionicons name={result.category === 'Daur Ulang' ? 'map' : 'book'} size={17} color={DARK} />
                  <Text style={ui.primaryButtonText}>{result.category === 'Daur Ulang' ? 'Cari Bank Sampah' : 'Lihat Katalog'}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={unsure ? ui.primaryButton : ui.secondaryButton} onPress={onClose}>
                <Text style={unsure ? ui.primaryButtonText : ui.secondaryButtonText}>{unsure ? 'Coba Foto Lain' : 'Tutup'}</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
    </Sheet>
  );
}
