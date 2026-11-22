import { StyleSheet } from 'react-native';

// Warna sama persis dengan App.tsx
export const GREEN = '#B7F21A';
export const DARK = '#20231D';
export const MUTED = '#777C72';
export const BG = '#F2F3EF';
export const WHITE = '#FFFFFF';

// Style dasar (disamakan dengan style yang sudah ada di App.tsx)
export const ui = StyleSheet.create({
  page: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 28 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  brand: { fontSize: 27, fontWeight: '800', color: DARK, letterSpacing: -0.8 },
  subtitle: { fontSize: 12, color: MUTED, marginTop: 4 },
  roundIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 13, fontWeight: '800', color: DARK, marginBottom: 4 },
  smallText: { fontSize: 10.5, color: MUTED, lineHeight: 16 },
  tinyText: { fontSize: 9, color: MUTED, lineHeight: 14 },
  bodyText: { fontSize: 12, color: DARK, lineHeight: 19, marginTop: 12 },
  tag: { fontSize: 9, fontWeight: '800', color: '#688C27', marginBottom: 5 },
  tipText: { fontSize: 10, color: '#526C2B', lineHeight: 15, marginTop: 7 },
  overline: { fontSize: 9, fontWeight: '800', letterSpacing: 1, color: '#718C35' },
  card: { backgroundColor: WHITE, borderRadius: 18, padding: 13, marginBottom: 11 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 54, height: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { backgroundColor: GREEN, borderRadius: 17, padding: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 13 },
  primaryButtonText: { fontSize: 12, fontWeight: '800', color: DARK },
  secondaryButton: { borderRadius: 17, borderWidth: 1, borderColor: '#E3E5DE', padding: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 9 },
  secondaryButtonText: { fontSize: 12, fontWeight: '700', color: DARK },
  noteCard: { backgroundColor: '#E6EFD9', borderRadius: 16, padding: 13, flexDirection: 'row', gap: 9, marginTop: 12, alignItems: 'flex-start' },
  input: { height: 46, backgroundColor: WHITE, borderRadius: 15, paddingHorizontal: 13, fontSize: 12, color: DARK, marginBottom: 10, borderWidth: 1, borderColor: '#E8EAE3' },
  pill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: WHITE, borderWidth: 1, borderColor: '#E8EAE3' },
  pillActive: { backgroundColor: GREEN, borderColor: GREEN },
  pillText: { fontSize: 10, color: MUTED, fontWeight: '700' },
  pillTextActive: { color: DARK },
  backdrop: { flex: 1, backgroundColor: 'rgba(32,35,29,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: BG, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 16, paddingBottom: 28, maxHeight: '88%' },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#D5D8CF', marginBottom: 16 },
  empty: { alignItems: 'center', paddingVertical: 36, gap: 8 },
});
