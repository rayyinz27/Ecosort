import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  TextInput, StatusBar, Alert, Platform, ActivityIndicator, BackHandler, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import BankMap from './src/components/BankMap';
import WasteModal from './src/components/WasteModal';
import AuthModal from './src/components/AuthModal';
import VideoScreen from './src/screens/VideoScreen';
import QuizScreen from './src/screens/QuizScreen';
import AdminScreen from './src/screens/AdminScreen';
import NotifScreen from './src/screens/NotifScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import AboutScreen from './src/screens/AboutScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ScanResultModal from './src/components/ScanResultModal';
import { fetchOrgs, Org } from './src/lib/community';
import { addScan } from './src/lib/history';
import { getScanQuality } from './src/lib/settings';
import BankModal from './src/components/BankModal';
import { NotifProvider, useNotif, openNotifications, setNotifOpener } from './src/lib/notif';
import { AuthProvider, useAuth } from './src/lib/auth';
import { supabase } from './src/lib/supabase';
import { classifyWaste, ScanResult } from './src/lib/ai';
import { fetchBanks, fetchCatalog, demoCatalog, Bank, CatalogItem } from './src/lib/data';

const GREEN = '#B7F21A';
const DARK = '#20231D';
const MUTED = '#777C72';
const BG = '#F2F3EF';
const WHITE = '#FFFFFF';

type Tab = 'Beranda' | 'Katalog' | 'Scan' | 'Peta' | 'Profil';
type Waste = CatalogItem;

const banks = [
  { id:'b1', name:'Bank Sampah Melati (Contoh)', address:'Area Sukapura, Bandung', hours:'08.00–16.00 WIB', accepts:'Plastik, kertas, logam', lat:-6.9747, lng:107.6302, phone:'Kontak perlu diverifikasi' },
  { id:'b2', name:'Bank Sampah Berseri (Contoh)', address:'Area Dayeuhkolot, Bandung', hours:'09.00–15.00 WIB', accepts:'Plastik, kardus, botol', lat:-6.9872, lng:107.6208, phone:'Kontak perlu diverifikasi' },
  { id:'b3', name:'Bank Sampah Hijau (Contoh)', address:'Area Buahbatu, Bandung', hours:'08.00–14.00 WIB', accepts:'Kertas, plastik, kaca', lat:-6.9510, lng:107.6405, phone:'Kontak perlu diverifikasi' }
];


function Pill({ label, active=false, onPress }: any) {
  return <TouchableOpacity onPress={onPress} style={[styles.pill, active && styles.pillActive]}><Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text></TouchableOpacity>;
}
function SectionTitle({ title, action, onAction }: any) {
  return <View style={styles.sectionHead}><Text style={styles.sectionTitle}>{title}</Text>{action ? <TouchableOpacity onPress={onAction} hitSlop={8}><Text style={styles.action}>{action}</Text></TouchableOpacity> : null}</View>;
}
function Header({ title, subtitle }: any) {
  const { unread } = useNotif();
  return <View style={styles.header}><View><Text style={styles.brand}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View><TouchableOpacity style={styles.roundIcon} onPress={openNotifications}><Ionicons name="notifications-outline" size={20} color={DARK}/>{unread>0 && <View style={styles.notifDot}><Text style={styles.notifDotText}>{unread>9?'9+':unread}</Text></View>}</TouchableOpacity></View>;
}
function Feature({ icon, label, tint, onPress }: any) {
  return <TouchableOpacity style={styles.feature} onPress={onPress}><View style={[styles.featureIcon,{backgroundColor:tint}]}><Ionicons name={icon} size={23} color={DARK}/></View><Text style={styles.featureLabel}>{label}</Text></TouchableOpacity>;
}

export default function App() {
  return <AuthProvider><NotifProvider><EcoSortApp/></NotifProvider></AuthProvider>;
}

function EcoSortApp() {
  const { session, profile, isAdmin, signOut } = useAuth();
  const [overlay,setOverlay] = useState<null | 'video' | 'quiz' | 'admin' | 'notif' | 'scanHistory' | 'quizHistory' | 'community' | 'about' | 'settings'>(null);
  const [orgs,setOrgs] = useState<Org[]>([]);
  const [resultOpen,setResultOpen] = useState(false);
  const [bankDetail,setBankDetail] = useState<Bank | null>(null);
  const [selectedWaste,setSelectedWaste] = useState<Waste | null>(null);
  const [authOpen,setAuthOpen] = useState(false);
  const [bankList,setBankList] = useState<Bank[]>(banks);
  const [bankDemo,setBankDemo] = useState(true);
  const [scanning,setScanning] = useState(false);
  const [scanResult,setScanResult] = useState<ScanResult | null>(null);
  const [photoB64,setPhotoB64] = useState<string | null>(null);
  const [tab,setTab] = useState<Tab>('Beranda');
  const [filter,setFilter] = useState('Semua');
  const [search,setSearch] = useState('');
  const [photo,setPhoto] = useState<string | null>(null);
  const [scanDone,setScanDone] = useState(false);
  const [quizIndex,setQuizIndex] = useState(0);
  const [score,setScore] = useState(0);
  const [answer,setAnswer] = useState('');
  const [selectedBank,setSelectedBank] = useState<Bank>(banks[0]);

  // Muat data bank sampah (dari admin/Supabase) setiap membuka tab Peta
  useEffect(() => {
    if (tab !== 'Peta') return;
    fetchBanks(banks).then(r => { setBankList(r.items); setBankDemo(r.demo); if (r.items.length && !r.items.some(b=>b.id===selectedBank.id)) setSelectedBank(r.items[0]); });
  }, [tab]);

  useEffect(() => { setNotifOpener(() => setOverlay('notif')); return () => setNotifOpener(null); }, []);

  const [catalog,setCatalog] = useState<Waste[]>(demoCatalog);
  useEffect(() => { if (tab==='Katalog' && !overlay) fetchCatalog(true).then(r => setCatalog(r.items)); }, [tab, overlay]);
  useEffect(() => { if (!overlay) fetchOrgs(true).then(r => setOrgs(r.items)); }, [overlay]);

  // Tombol back Android menutup halaman tambahan (video/kuis/admin)
  useEffect(() => {
    if (!overlay) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { setOverlay(null); return true; });
    return () => sub.remove();
  }, [overlay]);

  const needLogin = () => Alert.alert('Login diperlukan','Kamu harus masuk (login) dulu untuk menggunakan fitur scan AI.',[
    { text:'Nanti', style:'cancel' },
    { text:'Masuk', onPress:()=>setAuthOpen(true) },
  ]);

  const pickImage = async (camera:boolean) => {
    if (!session) { needLogin(); return; }
    const permission = camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Izin diperlukan','Izinkan akses kamera atau galeri melalui pengaturan perangkat.'); return; }
    const q = await getScanQuality();
    const result = camera
      ? await ImagePicker.launchCameraAsync({ mediaTypes:['images'], quality:q, base64:true })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes:['images'], quality:q, base64:true });
    if (!result.canceled && result.assets[0]) { setPhoto(result.assets[0].uri); setPhotoB64(result.assets[0].base64 ?? null); setScanResult(null); setScanDone(false); }
  };

  const startScan = async () => {
    if (!session) { needLogin(); return; }
    if (!photo || !photoB64) { Alert.alert('Pilih foto dahulu','Ambil foto atau pilih gambar dari galeri.'); return; }
    setScanning(true); setScanResult(null); setScanDone(false);
    try {
      const r = await classifyWaste(photoB64, 'image/jpeg');
      setScanResult(r); setScanDone(true); setResultOpen(true);
      addScan({ item_name: r.item_name, category: r.category, confidence: r.confidence });
      if (supabase && session && r.category !== 'Tidak Yakin') {
        const row = { user_id: session.user.id, predicted_category: r.category, confidence: r.confidence, is_uncertain: false };
        supabase.from('scan_history').insert({ ...row, item_name: r.item_name }).then(({ error }) => {
          // kolom item_name belum ada (SQL update 3 belum dijalankan) -> simpan tanpa nama objek
          if (error && supabase) supabase.from('scan_history').insert(row);
        });
      }
    } catch (e: any) {
      Alert.alert('Scan gagal', e?.message ?? 'Terjadi kesalahan saat menghubungi AI.');
    } finally { setScanning(false); }
  };

  const renderHome = () => <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.page}>
    <Header title="EcoSort" subtitle="Pilah sampah, mulai dari hal kecil."/>
    <View style={styles.hero}>
      <View style={{flex:1}}>
        <Text style={styles.heroEyebrow}>SMALL ACTION, BIG IMPACT</Text>
        <Text style={styles.heroTitle}>Bumi lebih baik{'\n'}dimulai dari kamu.</Text>
        <Text style={styles.heroDesc}>Kenali, pilah, dan salurkan sampah dengan cara yang tepat.</Text>
        <TouchableOpacity style={styles.heroButton} onPress={()=>setTab('Scan')}><Text style={styles.heroButtonText}>Mulai Scan</Text><Ionicons name="arrow-forward" size={16} color={DARK}/></TouchableOpacity>
      </View>
      <View style={styles.heroArt}><Ionicons name="earth" size={76} color={DARK}/><View style={styles.leafBadge}><Ionicons name="leaf" size={20} color={DARK}/></View></View>
    </View>
    <SectionTitle title="Jelajahi EcoSort"/>
    <View style={styles.featureGrid}>
      <Feature icon="scan-outline" label="Scan Sampah" tint="#DDF5A0" onPress={()=>setTab('Scan')}/>
      <Feature icon="book-outline" label="Katalog" tint="#DDF5A0" onPress={()=>setTab('Katalog')}/>
      <Feature icon="play-circle-outline" label="Video Edukasi" tint="#DDF5A0" onPress={()=>setOverlay('video')}/>
      <Feature icon="game-controller-outline" label="Kuis Interaktif" tint="#DDF5A0" onPress={()=>setOverlay('quiz')}/>
    </View>
    <TouchableOpacity style={styles.mapBanner} onPress={()=>setTab('Peta')}><View style={styles.mapBannerIcon}><Ionicons name="map" size={22} color={DARK}/></View><View style={{flex:1}}><Text style={styles.cardTitle}>Temukan Bank Sampah</Text><Text style={styles.smallText}>Cari lokasi untuk menyetorkan sampah terpilah.</Text></View><Ionicons name="chevron-forward" size={20} color={DARK}/></TouchableOpacity>
    <SectionTitle title="Kenali kategori sampah" action="Lihat katalog" onAction={()=>{setFilter('Semua');setTab('Katalog');}}/>
    <View style={styles.categoryRow}>
      <TouchableOpacity activeOpacity={0.85} style={[styles.categoryCard,{backgroundColor:'#E4F2D5'}]} onPress={()=>{setFilter('Organik');setTab('Katalog');}}><Ionicons name="leaf" size={24} color="#45652A"/><Text style={styles.categoryName}>Organik</Text><Text style={styles.categorySub}>Sisa alami</Text></TouchableOpacity>
      <TouchableOpacity activeOpacity={0.85} style={[styles.categoryCard,{backgroundColor:'#E4F2D5'}]} onPress={()=>{setFilter('Daur Ulang');setTab('Katalog');}}><Ionicons name="refresh-circle" size={24} color="#45652A"/><Text style={styles.categoryName}>Daur ulang</Text><Text style={styles.categorySub}>Bisa diproses</Text></TouchableOpacity>
      <TouchableOpacity activeOpacity={0.85} style={[styles.categoryCard,{backgroundColor:'#E4F2D5'}]} onPress={()=>{setFilter('Residu');setTab('Katalog');}}><Ionicons name="trash" size={24} color="#45652A"/><Text style={styles.categoryName}>Residu</Text><Text style={styles.categorySub}>Sisa terpilah</Text></TouchableOpacity>
    </View>
    <SectionTitle title="Terhubung dengan komunitas" action="Lihat semua" onAction={()=>setOverlay('community')}/>
    {orgs.slice(0,2).map((o,i)=><TouchableOpacity key={o.id} activeOpacity={0.85} style={styles.orgRow} onPress={()=>setOverlay('community')}><View style={styles.orgIcon}><Ionicons name={(['people','school','earth'] as any)[i%3]} size={22} color={DARK}/></View><View style={{flex:1}}><Text style={styles.cardTitle}>{o.name}</Text><Text style={styles.smallText}>{o.focus}</Text></View><Ionicons name="chevron-forward" color={MUTED} size={18}/></TouchableOpacity>)}
  </ScrollView>;

  const renderScan = () => <ScrollView contentContainerStyle={styles.page}>
    <Header title="Scan Sampah" subtitle="Kenali sampah sebelum membuangnya."/>
    {!session && <View style={[styles.noteCard,{marginTop:0,marginBottom:12}]}><Ionicons name="lock-closed-outline" size={20} color={DARK}/><View style={{flex:1}}><Text style={styles.cardTitle}>Login diperlukan</Text><Text style={styles.smallText}>Masuk dulu untuk menggunakan scan AI. Ada batas scan per hari agar layanan tetap adil untuk semua pengguna.</Text><TouchableOpacity style={[styles.primaryButton,{marginTop:10}]} onPress={()=>setAuthOpen(true)}><Text style={styles.primaryButtonText}>Masuk / Daftar</Text></TouchableOpacity></View></View>}
    <View style={styles.scanPanel}>
      <View style={styles.scanFrame}>{photo ? <Image source={{uri:photo}} style={styles.previewImage}/> : <View style={styles.emptyPreview}><Ionicons name="camera-outline" size={56} color="#9BA18F"/><Text style={styles.smallText}>Pratinjau foto sampah</Text><Text style={styles.tinyText}>Satu foto dengan satu objek utama</Text></View>}</View>
      <Text style={styles.cardTitle}>Ambil foto sampah</Text><Text style={styles.smallText}>Pastikan objek terlihat jelas dan pencahayaan cukup.</Text>
      <TouchableOpacity style={[styles.primaryButton,!session&&{opacity:0.5}]} onPress={()=>pickImage(true)}><Ionicons name="camera" size={19} color={DARK}/><Text style={styles.primaryButtonText}>Buka Kamera</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.secondaryButton,!session&&{opacity:0.5}]} onPress={()=>pickImage(false)}><Ionicons name="images-outline" size={19} color={DARK}/><Text style={styles.secondaryButtonText}>Pilih dari Galeri</Text></TouchableOpacity>
    </View>
    {photo && <TouchableOpacity style={[styles.primaryButton,scanning&&{opacity:0.7}]} onPress={startScan} disabled={scanning}>{scanning ? <ActivityIndicator color={DARK}/> : <Ionicons name="scan" size={18} color={DARK}/>}<Text style={styles.primaryButtonText}>{scanning ? 'Menganalisis dengan AI...' : 'Proses Foto'}</Text></TouchableOpacity>}
    <View style={styles.noteCard}><Ionicons name="information-circle-outline" size={20} color={DARK}/><Text style={[styles.smallText,{flex:1}]}>Foto dianalisis oleh AI untuk mengelompokkan sampah ke kategori organik, daur ulang, atau residu. Gunakan satu objek utama dengan pencahayaan yang cukup.</Text></View>
  </ScrollView>;

  const renderCatalog = () => {
    const q = search.toLowerCase();
    const visible = catalog.filter(w => (filter==='Semua'||w.category===filter) && (w.name.toLowerCase().includes(q) || w.desc.toLowerCase().includes(q)));
    return <View style={{flex:1}}>
      <View style={styles.stickyTop}>
        <Header title="Katalog Sampah" subtitle="Cari tahu cara memilah dengan benar."/>
        <View style={styles.searchBox}><Ionicons name="search" size={19} color="#3F5E12"/><TextInput value={search} onChangeText={setSearch} placeholder="Cari jenis sampah..." placeholderTextColor="#6B8A2E" style={styles.searchInput}/></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8, paddingBottom:12}}>
          {['Semua','Organik','Daur Ulang','Residu'].map(x=><Pill key={x} label={x} active={filter===x} onPress={()=>setFilter(x)}/>)}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={styles.listPage} showsVerticalScrollIndicator={false}>
        {visible.length===0 && <Text style={[styles.smallText,{textAlign:'center',marginTop:30}]}>Tidak ada hasil.</Text>}
        {visible.map(w=><TouchableOpacity key={w.id} activeOpacity={0.85} onPress={()=>setSelectedWaste(w)} style={styles.catalogCard}><View style={[styles.catalogIcon,{backgroundColor:w.color},w.images[0]?{width:84,height:84,borderRadius:18,overflow:'hidden'}:null]}>{w.images[0] ? <Image source={{uri:w.images[0]}} style={{width:'100%',height:'100%'}} resizeMode="cover"/> : <Ionicons name={w.icon as any} size={27} color={DARK}/>}</View><View style={{flex:1}}><Text style={styles.cardTitle}>{w.name}</Text><Text style={styles.tag}>{w.category}</Text><Text style={styles.smallText}>{w.desc}</Text>{w.tip ? <Text style={styles.tipText}>Tips: {w.tip}</Text> : null}{w.video ? <View style={{flexDirection:'row',alignItems:'center',gap:4,marginTop:6}}><Ionicons name="play-circle" size={14} color="#4F7A12"/><Text style={styles.tinyText}>Ada video penjelasan</Text></View> : null}</View><Ionicons name="chevron-forward" size={18} color={MUTED} style={{alignSelf:'center'}}/></TouchableOpacity>)}
      </ScrollView>
    </View>;
  };

  const renderMap = () => <View style={styles.mapPage}>
    <View style={styles.mapHeader}><Text style={styles.brand}>Peta Bank Sampah</Text><Text style={styles.subtitle}>Temukan tempat setor sampah di sekitar.</Text></View>
    <View style={[styles.searchBox,{marginHorizontal:14}]}><Ionicons name="search" size={19} color="#3F5E12"/><TextInput value={search} onChangeText={setSearch} placeholder="Cari bank sampah..." placeholderTextColor="#6B8A2E" style={styles.searchInput}/></View>
    <View style={styles.mapWrap}><BankMap banks={bankList} selectedId={selectedBank?.id} onSelect={(id)=>{const b=bankList.find(x=>x.id===id); if(b) setSelectedBank(b);}}/><View style={styles.mapLegend}><View style={styles.legendDot}/><Text style={styles.tinyText}>{bankDemo ? 'Lokasi contoh' : 'Lokasi bank sampah'}</Text></View></View>
    <View style={styles.mapListHead}><Text style={styles.sectionTitle}>Lokasi di sekitar</Text><Text style={styles.tinyText}>{bankDemo ? 'Data demo' : 'Data terbaru'}</Text></View>
    <ScrollView contentContainerStyle={{paddingHorizontal:14,paddingBottom:24}}>
      {bankList.filter(b=>b.name.toLowerCase().includes(search.toLowerCase())).map(b=><TouchableOpacity key={b.id} style={[styles.bankCard,selectedBank.id===b.id&&styles.bankSelected]} onPress={()=>{setSelectedBank(b);setBankDetail(b);}}>
        <View style={styles.bankIcon}><Ionicons name="business" size={23} color={DARK}/></View><View style={{flex:1}}><Text style={styles.cardTitle}>{b.name}</Text><Text style={styles.smallText}>{b.address}</Text><Text style={styles.tinyText}>{b.hours} · {b.accepts}</Text></View>{selectedBank.id===b.id ? <TouchableOpacity style={[styles.pill,styles.pillActive]} onPress={()=>Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`)}><Text style={[styles.pillText,styles.pillTextActive]}>Rute</Text></TouchableOpacity> : <Ionicons name="chevron-forward" size={18} color={MUTED}/>}
      </TouchableOpacity>)}
      <Text style={styles.disclaimer}>{bankDemo ? 'Lokasi, jam operasional, dan penerimaan sampah di atas hanya data ilustrasi. ' : ''}Verifikasi langsung sebelum berkunjung.</Text>
    </ScrollView>
  </View>;

  const renderProfile = () => <ScrollView contentContainerStyle={styles.page}>
    <Header title="Profil" subtitle="Kelola akun dan aktivitas EcoSort."/>
    <View style={styles.profileCard}><View style={styles.avatar}><Ionicons name="person" size={32} color={DARK}/></View><Text style={styles.profileName}>{session ? (profile?.full_name || 'Pengguna EcoSort') : 'Pengguna EcoSort'}</Text><Text style={styles.smallText}>{session ? `${session.user.email} · ${isAdmin ? 'Admin' : 'Pengguna'}` : 'Belum login'}</Text>{session ? <TouchableOpacity style={styles.secondaryButton} onPress={()=>signOut()}><Text style={styles.secondaryButtonText}>Keluar</Text></TouchableOpacity> : <TouchableOpacity style={styles.secondaryButton} onPress={()=>setAuthOpen(true)}><Text style={styles.secondaryButtonText}>Masuk / Daftar</Text></TouchableOpacity>}</View>
    {isAdmin && <TouchableOpacity style={styles.menuRow} onPress={()=>setOverlay('admin')}><Ionicons name="shield-checkmark-outline" size={21} color={DARK}/><Text style={styles.menuText}>Panel Admin</Text><Ionicons name="chevron-forward" size={18} color={MUTED}/></TouchableOpacity>}
    {['Riwayat Scan','Hasil Kuis','Organisasi Lingkungan','Tentang EcoSort','Pengaturan'].map((x,i)=><TouchableOpacity key={x} style={styles.menuRow} onPress={()=>setOverlay((['scanHistory','quizHistory','community','about','settings'] as const)[i])}><Ionicons name={(['time-outline','trophy-outline','people-outline','leaf-outline','settings-outline'] as any)[i]} size={21} color={DARK}/><Text style={styles.menuText}>{x}</Text><Ionicons name="chevron-forward" size={18} color={MUTED}/></TouchableOpacity>)}
  </ScrollView>;

  const screens: Record<Tab,()=>React.ReactNode> = {Beranda:renderHome,Katalog:renderCatalog,Scan:renderScan,Peta:renderMap,Profil:renderProfile};
  const close = () => setOverlay(null);
  const renderOverlay = () => {
    switch (overlay) {
      case 'video': return <VideoScreen onBack={close}/>;
      case 'quiz': return <QuizScreen onBack={close}/>;
      case 'notif': return <NotifScreen onBack={close}/>;
      case 'scanHistory': return <HistoryScreen kind="scan" onBack={close}/>;
      case 'quizHistory': return <HistoryScreen kind="quiz" onBack={close}/>;
      case 'community': return <CommunityScreen onBack={close}/>;
      case 'about': return <AboutScreen onBack={close}/>;
      case 'settings': return <SettingsScreen onBack={close} onLogin={()=>setAuthOpen(true)}/>;
      default: return <AdminScreen onBack={close}/>;
    }
  };
  const tabs: {name:Tab; icon:any}[] = [{name:'Beranda',icon:'home'},{name:'Katalog',icon:'book'},{name:'Scan',icon:'scan-circle'},{name:'Peta',icon:'map'},{name:'Profil',icon:'person'}];

  return <SafeAreaView style={styles.safe} edges={['top','left','right']}><StatusBar barStyle="dark-content" backgroundColor={BG}/><View style={{flex:1}}>{overlay ? renderOverlay() : screens[tab]()}</View><View style={styles.bottomNav}>{tabs.map(t=><TouchableOpacity key={t.name} style={styles.navItem} onPress={()=>{setOverlay(null);setTab(t.name);setSearch('');}}><View style={[styles.navIcon,tab===t.name&&styles.navIconActive]}><Ionicons name={t.icon} size={21} color={tab===t.name?DARK:'#858A80'}/></View><Text style={[styles.navLabel,tab===t.name&&styles.navLabelActive]}>{t.name}</Text></TouchableOpacity>)}</View><WasteModal item={selectedWaste} onClose={()=>setSelectedWaste(null)}/><ScanResultModal result={resultOpen ? scanResult : null} photo={photo} onClose={()=>setResultOpen(false)} onCatalog={()=>{setResultOpen(false);setFilter(scanResult?.category ?? 'Semua');setTab('Katalog');}} onFindBank={()=>{setResultOpen(false);setTab('Peta');}}/><BankModal bank={bankDetail} onClose={()=>setBankDetail(null)}/><AuthModal visible={authOpen} onClose={()=>setAuthOpen(false)}/></SafeAreaView>;
}

const styles = StyleSheet.create({
 safe:{flex:1,backgroundColor:BG}, stickyTop:{paddingHorizontal:14,paddingTop:12,backgroundColor:BG}, listPage:{paddingHorizontal:14,paddingTop:4,paddingBottom:28}, page:{paddingHorizontal:14,paddingTop:12,paddingBottom:28},
 header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:22},
 brand:{fontSize:27,fontWeight:'800',color:DARK,letterSpacing:-0.8}, subtitle:{fontSize:12,color:MUTED,marginTop:4},
 roundIcon:{width:42,height:42,borderRadius:21,backgroundColor:GREEN,alignItems:'center',justifyContent:'center'},
 hero:{backgroundColor:DARK,borderRadius:26,padding:20,minHeight:190,flexDirection:'row',overflow:'hidden',marginBottom:25},
 heroEyebrow:{fontSize:9,fontWeight:'800',letterSpacing:1.4,color:GREEN,marginBottom:10},heroTitle:{fontSize:25,lineHeight:29,fontWeight:'800',color:WHITE,letterSpacing:-0.6},
 heroDesc:{fontSize:11,lineHeight:17,color:'#C6C9C1',marginTop:8,maxWidth:190},heroButton:{marginTop:15,backgroundColor:GREEN,borderRadius:18,paddingVertical:10,paddingHorizontal:14,alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:8},
 heroButtonText:{fontSize:11,fontWeight:'800',color:DARK},heroArt:{width:100,alignItems:'center',justifyContent:'center',marginLeft:4},leafBadge:{position:'absolute',right:2,bottom:30,width:38,height:38,borderRadius:19,backgroundColor:GREEN,alignItems:'center',justifyContent:'center'},
 sectionHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:13,marginTop:3},sectionTitle:{fontSize:16,fontWeight:'800',color:DARK},action:{fontSize:11,color:'#62851B',fontWeight:'700'},
 featureGrid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',marginBottom:17},feature:{width:'48%',backgroundColor:WHITE,borderRadius:19,padding:13,marginBottom:10,flexDirection:'row',alignItems:'center',gap:10},featureIcon:{width:39,height:39,borderRadius:14,alignItems:'center',justifyContent:'center'},featureLabel:{fontSize:11,fontWeight:'700',color:DARK,flexShrink:1},
 mapBanner:{backgroundColor:'#E3F0D1',borderRadius:20,padding:14,flexDirection:'row',alignItems:'center',gap:12,marginBottom:24},mapBannerIcon:{width:42,height:42,borderRadius:14,backgroundColor:GREEN,alignItems:'center',justifyContent:'center'},
 cardTitle:{fontSize:13,fontWeight:'800',color:DARK,marginBottom:4},smallText:{fontSize:10.5,color:MUTED,lineHeight:16},tinyText:{fontSize:9,color:MUTED,lineHeight:14},categoryRow:{flexDirection:'row',gap:9,marginBottom:23},categoryCard:{flex:1,borderRadius:17,padding:12,minHeight:103,justifyContent:'space-between'},categoryName:{fontSize:11,fontWeight:'800',color:DARK,marginTop:10},categorySub:{fontSize:9,color:MUTED},
 orgRow:{backgroundColor:WHITE,borderRadius:17,padding:12,flexDirection:'row',alignItems:'center',gap:11,marginBottom:9},orgIcon:{width:40,height:40,borderRadius:14,backgroundColor:'#E8F3D9',alignItems:'center',justifyContent:'center'},disclaimer:{fontSize:9,color:'#898E84',lineHeight:14,marginTop:12},
 bottomNav:{height:68,backgroundColor:WHITE,borderTopWidth:1,borderTopColor:'#E9EAE5',flexDirection:'row',justifyContent:'space-around',alignItems:'center',paddingHorizontal:8},navItem:{alignItems:'center',justifyContent:'center',minWidth:55},navIcon:{width:56,height:32,borderRadius:16,overflow:'hidden',alignItems:'center',justifyContent:'center'},navIconActive:{backgroundColor:GREEN},notifDot:{position:'absolute',top:-3,right:-3,minWidth:17,height:17,borderRadius:9,backgroundColor:'#E5484D',borderWidth:2,borderColor:BG,alignItems:'center',justifyContent:'center',paddingHorizontal:2},notifDotText:{fontSize:8,fontWeight:'800',color:'#FFFFFF'},navLabel:{fontSize:9,color:'#858A80',marginTop:2},navLabelActive:{color:DARK,fontWeight:'800'},
 pill:{paddingVertical:8,paddingHorizontal:14,borderRadius:20,backgroundColor:WHITE,borderWidth:1,borderColor:'#E8EAE3'},pillActive:{backgroundColor:GREEN,borderColor:GREEN},pillText:{fontSize:10,color:MUTED,fontWeight:'700'},pillTextActive:{color:DARK},
 scanPanel:{backgroundColor:WHITE,borderRadius:24,padding:15,marginBottom:15},scanFrame:{height:250,borderRadius:18,backgroundColor:'#E8EBE3',overflow:'hidden',marginBottom:16},previewImage:{width:'100%',height:'100%',resizeMode:'cover'},emptyPreview:{flex:1,alignItems:'center',justifyContent:'center',gap:7},primaryButton:{backgroundColor:GREEN,borderRadius:17,padding:14,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:9,marginTop:13},primaryButtonText:{fontSize:12,fontWeight:'800',color:DARK},secondaryButton:{borderRadius:17,borderWidth:1,borderColor:'#E3E5DE',padding:13,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:9,marginTop:9},secondaryButtonText:{fontSize:12,fontWeight:'700',color:DARK},resultCard:{backgroundColor:WHITE,borderRadius:20,padding:17,marginTop:14},overline:{fontSize:9,fontWeight:'800',letterSpacing:1,color:'#718C35'},resultName:{fontSize:22,fontWeight:'800',color:DARK,marginVertical:8},bodyText:{fontSize:12,color:DARK,lineHeight:19,marginTop:12},noteCard:{backgroundColor:'#E6EFD9',borderRadius:16,padding:13,flexDirection:'row',gap:9,marginTop:12,alignItems:'flex-start'},
 searchBox:{height:46,backgroundColor:'#CDEB6B',borderRadius:15,paddingHorizontal:13,flexDirection:'row',alignItems:'center',gap:9,marginBottom:15},searchInput:{flex:1,fontSize:12,color:DARK,paddingVertical:0},
 catalogCard:{backgroundColor:WHITE,borderRadius:18,padding:13,flexDirection:'row',gap:12,marginBottom:11},catalogIcon:{width:54,height:54,borderRadius:17,alignItems:'center',justifyContent:'center'},tag:{fontSize:9,fontWeight:'800',color:'#688C27',marginBottom:5},tipText:{fontSize:10,color:'#526C2B',lineHeight:15,marginTop:7},
 mapPage:{flex:1,paddingTop:12},mapHeader:{paddingHorizontal:14,marginBottom:14},mapWrap:{height:260,marginHorizontal:14,borderRadius:22,overflow:'hidden',backgroundColor:'#E4E9DD'},mapLegend:{position:'absolute',bottom:12,left:12,backgroundColor:WHITE,borderRadius:14,paddingHorizontal:10,paddingVertical:7,flexDirection:'row',alignItems:'center',gap:6},legendDot:{width:8,height:8,borderRadius:4,backgroundColor:'#719B20'},mapListHead:{paddingHorizontal:14,paddingTop:18,paddingBottom:10,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},bankCard:{backgroundColor:WHITE,borderRadius:17,padding:12,flexDirection:'row',alignItems:'center',gap:11,marginBottom:9,borderWidth:1,borderColor:'transparent'},bankSelected:{borderColor:'#9BCB3D'},bankIcon:{width:42,height:42,borderRadius:14,backgroundColor:'#E8F3D9',alignItems:'center',justifyContent:'center'},
 profileCard:{backgroundColor:WHITE,borderRadius:22,padding:22,alignItems:'center',marginBottom:18},avatar:{width:66,height:66,borderRadius:33,backgroundColor:GREEN,alignItems:'center',justifyContent:'center',marginBottom:10},profileName:{fontSize:17,fontWeight:'800',color:DARK,marginBottom:3},menuRow:{backgroundColor:WHITE,borderRadius:15,padding:15,flexDirection:'row',alignItems:'center',gap:12,marginBottom:9},menuText:{flex:1,fontSize:12,fontWeight:'700',color:DARK}
});