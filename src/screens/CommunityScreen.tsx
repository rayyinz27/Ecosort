import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ui, DARK, MUTED } from '../theme';
import ScreenHeader from '../components/ScreenHeader';
import { fetchOrgs, fetchEvents, openContact, openLink, Org, EventItem } from '../lib/community';

export default function CommunityScreen({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<'org' | 'event'>('org');
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const o = await fetchOrgs(true);
      setOrgs(o.items); setDemo(o.demo);
      setEvents(await fetchEvents(o.items));
      setLoading(false);
    })();
  }, []);

  const now = Date.now();
  const upcoming = events.filter((e) => !e.date || new Date(e.date).getTime() >= now);
  const past = events.filter((e) => e.date && new Date(e.date).getTime() < now).reverse();

  const EventCard = ({ e, done }: { e: EventItem; done?: boolean }) => {
    const d = e.date ? new Date(e.date) : null;
    return (
      <View style={[ui.card, ui.row, { alignItems: 'flex-start', opacity: done ? 0.65 : 1 }]}>
        <View style={{ width: 50, borderRadius: 14, backgroundColor: '#DDF5A0', alignItems: 'center', paddingVertical: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: DARK }}>{d ? d.getDate() : '—'}</Text>
          <Text style={{ fontSize: 9, fontWeight: '800', color: '#526C2B' }}>{d ? d.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase() : ''}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={ui.cardTitle}>{e.title}</Text>
          {e.orgName ? <Text style={ui.tag}>{e.orgName}</Text> : null}
          {d && <View style={[ui.row, { gap: 5, marginBottom: 3 }]}><Ionicons name="time-outline" size={13} color={MUTED} /><Text style={ui.tinyText}>{d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</Text></View>}
          {e.location ? <View style={[ui.row, { gap: 5, marginBottom: 3 }]}><Ionicons name="location-outline" size={13} color={MUTED} /><Text style={[ui.tinyText, { flex: 1 }]}>{e.location}</Text></View> : null}
          {e.description ? <Text style={[ui.smallText, { marginTop: 3 }]}>{e.description}</Text> : null}
          {!done && e.url ? (
            <TouchableOpacity style={[ui.pill, ui.pillActive, { alignSelf: 'flex-start', marginTop: 10 }]} onPress={() => openLink(e.url)}>
              <Text style={[ui.pillText, ui.pillTextActive]}>Daftar / Info</Text>
            </TouchableOpacity>
          ) : null}
          {done && <Text style={[ui.tinyText, { marginTop: 6, fontWeight: '800' }]}>Sudah selesai</Text>}
        </View>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={ui.page} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Komunitas" subtitle="Terhubung dan ikut aksi peduli lingkungan." onBack={onBack} />
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <TouchableOpacity onPress={() => setTab('org')} style={[ui.pill, tab === 'org' && ui.pillActive]}><Text style={[ui.pillText, tab === 'org' && ui.pillTextActive]}>Organisasi</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('event')} style={[ui.pill, tab === 'event' && ui.pillActive]}><Text style={[ui.pillText, tab === 'event' && ui.pillTextActive]}>Acara{upcoming.length ? ` (${upcoming.length})` : ''}</Text></TouchableOpacity>
      </View>
      {loading && <ActivityIndicator color={DARK} style={{ marginTop: 30 }} />}

      {!loading && tab === 'org' && orgs.map((o) => (
        <View key={o.id} style={ui.card}>
          <View style={[ui.row, { alignItems: 'flex-start' }]}>
            <View style={[ui.iconBox, { width: 46, height: 46, borderRadius: 15, backgroundColor: '#DDF5A0' }]}><Ionicons name="people" size={22} color={DARK} /></View>
            <View style={{ flex: 1 }}>
              <View style={[ui.row, { gap: 5 }]}>
                <Text style={[ui.cardTitle, { flexShrink: 1, marginBottom: 0 }]}>{o.name}</Text>
                {o.verified && <Ionicons name="checkmark-circle" size={15} color="#6E9D19" />}
              </View>
              {o.focus ? <Text style={[ui.tag, { marginTop: 4 }]}>{o.focus}</Text> : null}
            </View>
          </View>
          {o.description ? <Text style={[ui.smallText, { marginTop: 10 }]}>{o.description}</Text> : null}
          {o.address ? <View style={[ui.row, { gap: 6, marginTop: 8 }]}><Ionicons name="location-outline" size={14} color={MUTED} /><Text style={[ui.tinyText, { flex: 1 }]}>{o.address}</Text></View> : null}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {o.contact ? <TouchableOpacity style={[ui.pill, ui.pillActive]} onPress={() => openContact(o.contact)}><Text style={[ui.pillText, ui.pillTextActive]}>Hubungi</Text></TouchableOpacity> : null}
            {o.website ? <TouchableOpacity style={ui.pill} onPress={() => openLink(o.website)}><Text style={ui.pillText}>Website</Text></TouchableOpacity> : null}
            {!o.contact && !o.website && <Text style={ui.tinyText}>Kontak belum tersedia.</Text>}
          </View>
        </View>
      ))}

      {!loading && tab === 'org' && demo && <Text style={ui.tinyText}>Ini daftar contoh. Admin dapat menambahkan organisasi asli lewat Profil → Panel Admin.</Text>}

      {!loading && tab === 'event' && (
        <>
          {events.length === 0 && <View style={ui.empty}><Ionicons name="calendar-outline" size={40} color="#9BA18F" /><Text style={ui.smallText}>Belum ada acara.</Text></View>}
          {upcoming.length > 0 && <Text style={[ui.overline, { marginBottom: 10 }]}>AKAN DATANG</Text>}
          {upcoming.map((e) => <EventCard key={e.id} e={e} />)}
          {past.length > 0 && <Text style={[ui.overline, { marginBottom: 10, marginTop: 8 }]}>SUDAH LEWAT</Text>}
          {past.map((e) => <EventCard key={e.id} e={e} done />)}
        </>
      )}
    </ScrollView>
  );
}
