import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Modal, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Galeri foto yang bisa digeser; tekan foto untuk layar penuh.
export default function Gallery({ images, height = 190 }: { images: string[]; height?: number }) {
  const { width } = useWindowDimensions();
  const w = width - 32; // lebar sheet dikurangi padding
  const [page, setPage] = useState(0);
  const [full, setFull] = useState<string | null>(null);

  return (
    <>
      <View>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ borderRadius: 18 }}
          onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / w))}>
          {images.map((u) => (
            <TouchableOpacity key={u} activeOpacity={0.9} onPress={() => setFull(u)}>
              <Image source={{ uri: u }} style={{ width: w, height, borderRadius: 18, backgroundColor: '#E4E9DD' }} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </ScrollView>
        {images.length > 1 && (
          <View style={{ position: 'absolute', right: 10, bottom: 10, backgroundColor: 'rgba(32,35,29,0.7)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: '700' }}>{page + 1}/{images.length}</Text>
          </View>
        )}
      </View>
      <Modal visible={!!full} transparent animationType="fade" onRequestClose={() => setFull(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center' }} onPress={() => setFull(null)}>
          {full && <Image source={{ uri: full }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />}
          <View style={{ position: 'absolute', top: 48, right: 20 }}><Ionicons name="close-circle" size={32} color="#FFFFFF" /></View>
        </Pressable>
      </Modal>
    </>
  );
}
