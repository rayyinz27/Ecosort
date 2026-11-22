import React, { useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, ScrollView, Image, Linking, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ui, DARK } from '../theme';
import type { Bank } from '../lib/data';
import Sheet from './Sheet';

export default function BankModal({ bank: bankProp, onClose }: { bank: Bank | null; onClose: () => void }) {
  const last = useRef(bankProp);
  if (bankProp) last.current = bankProp;
  const bank = bankProp ?? last.current; // pertahankan isi saat animasi menutup
  const { width } = useWindowDimensions();
  const imgW = width - 32; // lebar sheet dikurangi padding
  const [page, setPage] = useState(0);
  const [full, setFull] = useState<string | null>(null);

  const images = bank?.images ?? [];
  const hasPhone = !!bank && /\d{5,}/.test(bank.phone);
  const materials = (bank?.accepts ?? '').split(',').map((s) => s.trim()).filter(Boolean);

  const close = () => { setPage(0); onClose(); };

  return (
    <>
      <Sheet visible={!!bankProp} onClose={close}>
            <View style={ui.sheetHandle} />
            {bank && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {images.length > 0 ? (
                  <View>
                    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ borderRadius: 18 }}
                      onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / imgW))}>
                      {images.map((u) => (
                        <TouchableOpacity key={u} activeOpacity={0.9} onPress={() => setFull(u)}>
                          <Image source={{ uri: u }} style={{ width: imgW, height: 190, borderRadius: 18, backgroundColor: '#E4E9DD' }} resizeMode="cover" />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    {images.length > 1 && (
                      <View style={{ position: 'absolute', right: 10, bottom: 10, backgroundColor: 'rgba(32,35,29,0.7)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: '700' }}>{page + 1}/{images.length}</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={{ height: 120, borderRadius: 18, backgroundColor: '#E6EFD9', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="image-outline" size={34} color="#8FA878" />
                    <Text style={[ui.tinyText, { marginTop: 4 }]}>Belum ada foto</Text>
                  </View>
                )}

                <Text style={[ui.brand, { fontSize: 20, marginTop: 14 }]}>{bank.name}</Text>

                <View style={[ui.row, { alignItems: 'flex-start', marginTop: 10, gap: 8 }]}>
                  <Ionicons name="location-outline" size={18} color={DARK} />
                  <Text style={[ui.smallText, { flex: 1, color: DARK }]}>{bank.address}</Text>
                </View>
                <View style={[ui.row, { marginTop: 8, gap: 8 }]}>
                  <Ionicons name="time-outline" size={18} color={DARK} />
                  <Text style={[ui.smallText, { color: DARK }]}>{bank.hours}</Text>
                </View>
                {hasPhone && (
                  <TouchableOpacity style={[ui.row, { marginTop: 8, gap: 8 }]} onPress={() => Linking.openURL('tel:' + bank.phone.replace(/[^\d+]/g, ''))}>
                    <Ionicons name="call-outline" size={18} color={DARK} />
                    <Text style={[ui.smallText, { color: '#4F7A12', fontWeight: '700' }]}>{bank.phone}</Text>
                  </TouchableOpacity>
                )}

                {materials.length > 0 && (
                  <>
                    <Text style={[ui.overline, { marginTop: 16, marginBottom: 8 }]}>SAMPAH YANG DITERIMA</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                      {materials.map((m) => (
                        <View key={m} style={{ backgroundColor: '#E6EFD9', borderRadius: 14, paddingHorizontal: 11, paddingVertical: 6 }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#526C2B' }}>{m}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {bank.description ? (
                  <>
                    <Text style={[ui.overline, { marginTop: 16 }]}>TENTANG</Text>
                    <Text style={[ui.bodyText, { marginTop: 6 }]}>{bank.description}</Text>
                  </>
                ) : null}

                <TouchableOpacity style={ui.primaryButton} onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${bank.lat},${bank.lng}`)}>
                  <Ionicons name="navigate" size={17} color={DARK} /><Text style={ui.primaryButtonText}>Buka Rute</Text>
                </TouchableOpacity>
                <TouchableOpacity style={ui.secondaryButton} onPress={close}><Text style={ui.secondaryButtonText}>Tutup</Text></TouchableOpacity>
              </ScrollView>
            )}
      </Sheet>

      <Modal visible={!!full} transparent animationType="fade" onRequestClose={() => setFull(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center' }} onPress={() => setFull(null)}>
          {full && <Image source={{ uri: full }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />}
          <View style={{ position: 'absolute', top: 48, right: 20 }}><Ionicons name="close-circle" size={32} color="#FFFFFF" /></View>
        </Pressable>
      </Modal>
    </>
  );
}
