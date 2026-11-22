import AsyncStorage from '@react-native-async-storage/async-storage';

export type ScanQuality = 'hemat' | 'standar' | 'tinggi';
export const QUALITY_VALUE: Record<ScanQuality, number> = { hemat: 0.25, standar: 0.4, tinggi: 0.7 };
export const QUALITY_INFO: Record<ScanQuality, string> = {
  hemat: 'Foto paling kecil. Cepat dan hemat kuota.',
  standar: 'Seimbang antara kecepatan dan detail.',
  tinggi: 'Foto lebih detail. Lebih lambat dan boros kuota.',
};
const KEY = 'ecosort:scan_quality';

export async function getScanQualityKey(): Promise<ScanQuality> {
  try { const v = await AsyncStorage.getItem(KEY); if (v === 'hemat' || v === 'standar' || v === 'tinggi') return v; } catch { /* abaikan */ }
  return 'standar';
}
export async function setScanQualityKey(q: ScanQuality) { try { await AsyncStorage.setItem(KEY, q); } catch { /* abaikan */ } }
export async function getScanQuality(): Promise<number> { return QUALITY_VALUE[await getScanQualityKey()]; }
