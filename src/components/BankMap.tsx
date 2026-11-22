import React, { useEffect, useMemo, useRef } from 'react';
import { WebView } from 'react-native-webview';
import type { Bank } from '../lib/data';

// Peta Leaflet + OpenStreetMap di dalam WebView: tidak butuh API key.
// (Tile CARTO sekarang mewajibkan API key, jadi dipakai tile resmi OpenStreetMap.)
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

type Props = { banks: Bank[]; selectedId?: string; onSelect: (id: string) => void };

export default function BankMap({ banks, selectedId, onSelect }: Props) {
  const ref = useRef<WebView>(null);

  const html = useMemo(() => {
    const data = JSON.stringify(banks.map((b) => ({ id: b.id, name: b.name, lat: b.lat, lng: b.lng }))).replace(/</g, '\\u003c');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#m{height:100%;margin:0;background:#E4E9DD}.leaflet-control-attribution{font-size:8px}</style></head>
<body><div id="m"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var banks=${data};
var map=L.map('m',{zoomControl:false}).setView([-6.9747,107.6302],12);
L.tileLayer('${TILE_URL}',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);
function icon(a){var s=a?30:22;return L.divIcon({className:'',iconSize:[s,s],iconAnchor:[s/2,s/2],html:'<div style="width:'+s+'px;height:'+s+'px;border-radius:50%;background:'+(a?'#B7F21A':'#6E9D19')+';border:3px solid #20231D;box-sizing:border-box;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>'});}
var markers={};
function post(o){window.ReactNativeWebView.postMessage(JSON.stringify(o));}
banks.forEach(function(b){var m=L.marker([b.lat,b.lng],{icon:icon(false),title:b.name}).addTo(map);m.on('click',function(){post({type:'select',id:b.id});});markers[b.id]=m;});
if(banks.length>1){map.fitBounds(L.latLngBounds(banks.map(function(b){return [b.lat,b.lng];})),{padding:[40,40],maxZoom:14});}
else if(banks.length===1){map.setView([banks[0].lat,banks[0].lng],14);}
function focusBank(id){for(var k in markers){markers[k].setIcon(icon(k===id));}var m=markers[id];if(m){map.flyTo(m.getLatLng(),Math.max(map.getZoom(),14),{duration:0.6});}}
</script></body></html>`;
  }, [banks]);

  const focus = (id?: string) => { if (id) ref.current?.injectJavaScript(`focusBank(${JSON.stringify(id)});true;`); };
  useEffect(() => { focus(selectedId); }, [selectedId]);

  return (
    <WebView
      ref={ref}
      originWhitelist={['*']}
      source={{ html, baseUrl: 'https://ecosort.app' }}
      javaScriptEnabled
      onLoadEnd={() => focus(selectedId)}
      onMessage={(e) => {
        try { const m = JSON.parse(e.nativeEvent.data); if (m.type === 'select') onSelect(String(m.id)); } catch { /* abaikan */ }
      }}
      style={{ flex: 1, backgroundColor: '#E4E9DD' }}
    />
  );
}
