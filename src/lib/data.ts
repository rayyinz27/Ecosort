import { supabase } from './supabase';

export type Video = { id: string; title: string; description: string; url: string; category: string; duration?: number | null };
export type Quiz = { id: string; question: string; options: string[]; answer: string; explanation: string };
export type QuizChapter = { id: string; title: string; description: string; questions: Quiz[] };
export type CatalogItem = { id: string; name: string; category: string; desc: string; tip: string; details: string; images: string[]; video: string; icon: string; color: string };
export type Bank = { id: string; name: string; address: string; hours: string; accepts: string; lat: number; lng: number; phone: string; description?: string; images?: string[] };

// ---------- Data contoh (dipakai jika Supabase belum diisi / masih kosong) ----------
const ytSearch = (q: string) => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);

export const demoVideos: Video[] = [
  { id: 'v1', title: 'Cara memilah sampah organik, daur ulang, dan residu', description: 'Contoh: buka hasil pencarian YouTube tentang dasar pemilahan sampah rumah tangga.', url: ytSearch('cara memilah sampah rumah tangga'), category: 'Dasar' },
  { id: 'v2', title: 'Membuat kompos dari sisa dapur', description: 'Contoh: buka hasil pencarian YouTube tentang membuat kompos sederhana.', url: ytSearch('cara membuat kompos dari sisa makanan'), category: 'Organik' },
  { id: 'v3', title: 'Menyetor sampah ke bank sampah', description: 'Contoh: buka hasil pencarian YouTube tentang cara kerja bank sampah.', url: ytSearch('cara kerja bank sampah'), category: 'Bank Sampah' },
  { id: 'v4', title: 'Mengolah botol plastik bekas', description: 'Contoh: buka hasil pencarian YouTube tentang daur ulang botol plastik.', url: ytSearch('daur ulang botol plastik'), category: 'Daur Ulang' },
];

export const demoQuiz: Quiz[] = [
  { id: 'q1', question: 'Kulit pisang termasuk jenis sampah apa?', options: ['Organik', 'Daur Ulang', 'Residu'], answer: 'Organik', explanation: 'Kulit buah mudah terurai dan bisa diolah menjadi kompos.' },
  { id: 'q2', question: 'Botol plastik PET yang sudah dikosongkan termasuk…', options: ['Organik', 'Daur Ulang', 'Residu'], answer: 'Daur Ulang', explanation: 'Plastik PET dapat diproses kembali melalui bank sampah atau pengepul.' },
  { id: 'q3', question: 'Popok sekali pakai sebaiknya dibuang ke…', options: ['Sampah organik', 'Bank sampah plastik', 'Sampah residu'], answer: 'Sampah residu', explanation: 'Popok sulit didaur ulang lewat jalur umum, jadi dibungkus rapi dan dibuang sebagai residu.' },
  { id: 'q4', question: 'Apa yang sebaiknya dilakukan sebelum menyetor botol plastik?', options: ['Dibiarkan berisi sisa minuman', 'Dikosongkan dan dibilas', 'Dicampur dengan sisa makanan'], answer: 'Dikosongkan dan dibilas', explanation: 'Sampah yang bersih lebih mudah dan layak diterima untuk didaur ulang.' },
  { id: 'q5', question: 'Kardus yang terkena minyak sebaiknya…', options: ['Tetap disetor sebagai kertas bersih', 'Dianggap sulit didaur ulang', 'Dikomposkan bersama sayur'], answer: 'Dianggap sulit didaur ulang', explanation: 'Kertas/kardus harus kering dan bersih; yang berminyak umumnya sulit diproses ulang.' },
  { id: 'q6', question: 'Sisa nasi dan sayur dapat diolah menjadi…', options: ['Kompos', 'Plastik daur ulang', 'Bahan bakar kaleng'], answer: 'Kompos', explanation: 'Sisa makanan adalah sampah organik yang bisa dikomposkan.' },
];

// ---------- Helper ----------
export function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
export const youtubeThumb = (url: string) => {
  const id = youtubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};

// ---------- Fetch ----------
// fallback=true  → jika database kosong/gagal, tampilkan data contoh (untuk pengguna biasa)
// fallback=false → hanya data database (untuk panel admin)
export async function fetchVideos(fallback = true): Promise<{ items: Video[]; demo: boolean }> {
  if (supabase) {
    const { data, error } = await supabase.from('tutorials').select('*').order('id', { ascending: false });
    if (!error && data && (data.length > 0 || !fallback)) {
      return { demo: false, items: data.map((r: any) => ({ id: String(r.id), title: r.title, description: r.description ?? '', url: r.video_url ?? '', category: r.category ?? 'Umum', duration: r.duration_seconds })) };
    }
  }
  return { items: fallback ? demoVideos : [], demo: true };
}

export async function fetchQuiz(fallback = true): Promise<{ items: Quiz[]; demo: boolean }> {
  if (supabase) {
    const { data, error } = await supabase.from('quiz_questions').select('*').order('id', { ascending: true });
    if (!error && data && (data.length > 0 || !fallback)) {
      return { demo: false, items: data.map((r: any) => ({ id: String(r.id), question: r.question, options: Array.isArray(r.options) ? r.options.map(String) : [], answer: r.correct_answer, explanation: r.explanation ?? '' })) };
    }
  }
  return { items: fallback ? demoQuiz : [], demo: true };
}

export async function fetchBanks(fallback: Bank[] | null): Promise<{ items: Bank[]; demo: boolean }> {
  if (supabase) {
    const { data, error } = await supabase.from('waste_banks').select('*').order('id', { ascending: true });
    if (!error && data && (data.length > 0 || !fallback)) {
      return { demo: false, items: data.map((r: any) => ({ id: String(r.id), name: r.name, address: r.address, hours: r.opening_hours ?? '-', accepts: (r.accepted_materials ?? []).join(', '), lat: r.latitude, lng: r.longitude, phone: r.phone || 'Kontak belum tersedia', description: r.description ?? '', images: Array.isArray(r.image_urls) ? r.image_urls : [] })) };
    }
  }
  return { items: fallback ?? [], demo: true };
}


// ---------- Katalog ----------
export const VIDEO_CATEGORIES = ['Dasar', 'Organik', 'Daur Ulang', 'Residu', 'Bank Sampah', 'Kompos', 'Tips'];
export const CATALOG_CATEGORIES = ['Organik', 'Daur Ulang', 'Residu'];
const TINT = '#E3F0D1';
const ci = (id: string, name: string, category: string, icon: string, desc: string, tip: string, details: string): CatalogItem =>
  ({ id, name, category, icon, desc, tip, details, images: [], video: '', color: TINT });

export const demoCatalog: CatalogItem[] = [
  ci('c1', 'Sisa makanan', 'Organik', 'leaf', 'Sisa nasi, sayur, buah, dan bahan makanan alami.', 'Pisahkan dari plastik. Bisa diolah menjadi kompos.', 'Sisa makanan mudah terurai oleh mikroorganisme. Jika tercampur dengan sampah lain, ia membuat sampah daur ulang menjadi kotor dan basah sehingga sulit diproses. Jika menumpuk di TPA tanpa udara, ia menghasilkan gas metana.'),
  ci('c2', 'Kulit buah', 'Organik', 'nutrition', 'Kulit pisang, jeruk, apel, dan sisa buah lainnya.', 'Cacah kecil agar lebih cepat terurai menjadi kompos.', 'Kulit buah kaya air dan cepat membusuk. Cacah menjadi potongan kecil agar proses pengomposan lebih cepat. Kulit jeruk terurai lebih lambat karena minyaknya, jadi jangan terlalu banyak dalam satu wadah kompos.'),
  ci('c3', 'Daun & ranting kering', 'Organik', 'flower', 'Daun kering, rumput, dan ranting kecil dari halaman.', 'Kumpulkan terpisah dan campurkan dengan sisa dapur untuk kompos.', 'Daun kering termasuk bahan cokelat (kaya karbon) pada kompos, sedangkan sisa dapur adalah bahan hijau (kaya nitrogen). Campuran keduanya membuat kompos lebih seimbang dan tidak berbau.'),
  ci('c4', 'Botol plastik', 'Daur Ulang', 'water', 'Botol PET dan kemasan plastik yang sudah dikosongkan.', 'Kosongkan, bilas, pipihkan, lalu setor ke bank sampah.', 'Botol PET termasuk plastik yang paling banyak diterima untuk didaur ulang. Pastikan kosong dan dibilas agar tidak berbau. Memipihkan botol menghemat tempat saat dikumpulkan. Tutup botol biasanya dari jenis plastik berbeda, tanyakan ke bank sampah apakah dipisah.'),
  ci('c5', 'Kardus & kertas', 'Daur Ulang', 'newspaper', 'Kertas bersih, koran, kardus, dan buku bekas.', 'Pastikan kering dan tidak terkena minyak.', 'Kertas dan kardus bisa dibuat kembali menjadi kertas atau kemasan. Kertas yang basah, berminyak, atau bekas makanan sulit diproses sehingga sebaiknya masuk residu. Lipat atau ikat kardus agar mudah dibawa.'),
  ci('c6', 'Kaleng minuman', 'Daur Ulang', 'beer', 'Kaleng aluminium dan logam yang dapat diproses kembali.', 'Kosongkan dan bilas sebelum disetorkan.', 'Logam seperti aluminium dan kaleng baja dapat dilebur dan dipakai ulang berkali-kali. Bilas sisa minuman dan pipihkan agar hemat tempat. Hati-hati dengan tepi kaleng yang tajam.'),
  ci('c7', 'Botol kaca', 'Daur Ulang', 'wine', 'Botol dan toples kaca bekas minuman atau makanan.', 'Bilas dan simpan dengan hati-hati agar tidak pecah.', 'Kaca dapat didaur ulang berulang kali. Lepaskan tutupnya dan bilas bersih. Pecahan kaca berbahaya, jadi bungkus dengan kertas tebal dan beri tanda sebelum diserahkan.'),
  ci('c8', 'Popok sekali pakai', 'Residu', 'bandage', 'Sampah yang sulit didaur ulang melalui jalur umum.', 'Bungkus dengan baik dan buang ke tempat residu.', 'Popok mengandung campuran bahan dan terkontaminasi sehingga sulit didaur ulang lewat jalur umum. Buang isi padatnya ke toilet, lalu gulung dan bungkus rapat sebelum dimasukkan ke wadah residu.'),
  ci('c9', 'Tisu bekas', 'Residu', 'document-outline', 'Tisu bekas pakai, tisu basah, dan serbet kertas kotor.', 'Kumpulkan di wadah residu, jangan dicampur dengan kertas bersih.', 'Meski berbahan kertas, serat tisu sudah pendek dan biasanya terkontaminasi sehingga tidak dapat didaur ulang. Tisu basah juga sering mengandung plastik. Jangan dibuang ke toilet karena dapat menyumbat saluran.'),
  ci('c10', 'Styrofoam', 'Residu', 'cube', 'Kemasan makanan dan pelindung barang dari busa polistirena.', 'Kurangi pemakaiannya. Bila sudah terpakai, buang ke wadah residu.', 'Styrofoam ringan, memakan banyak tempat, dan sulit didaur ulang di kebanyakan tempat. Sebisa mungkin hindari memakainya, misalnya dengan membawa wadah makan sendiri.'),
  ci('c11', 'Kemasan sachet', 'Residu', 'pricetag', 'Kemasan kopi, sampo, dan makanan ringan berlapis plastik dan aluminium.', 'Kurangi dengan memilih kemasan isi ulang bila ada.', 'Sachet terdiri dari beberapa lapisan bahan yang menempel sehingga sulit dipisahkan dan didaur ulang lewat jalur umum. Beberapa komunitas mengolahnya menjadi kerajinan, tapi cara terbaik adalah mengurangi pemakaiannya.'),
];

export async function fetchCatalog(fallback = true): Promise<{ items: CatalogItem[]; demo: boolean }> {
  if (supabase) {
    const { data, error } = await supabase.from('catalog_items').select('*').order('id', { ascending: true });
    if (!error && data && (data.length > 0 || !fallback)) {
      return {
        demo: false,
        items: data.map((r: any) => ({
          id: String(r.id), name: r.name, category: r.category, desc: r.description ?? '', tip: r.tip ?? '', details: r.details ?? '',
          images: Array.isArray(r.image_urls) ? r.image_urls : [], video: r.video_url ?? '',
          icon: r.category === 'Organik' ? 'leaf' : r.category === 'Daur Ulang' ? 'refresh-circle' : 'trash', color: TINT,
        })),
      };
    }
  }
  return { items: fallback ? demoCatalog : [], demo: true };
}


// ---------- Kuis berbab ----------
export const UMUM_ID = 'umum'; // soal tanpa bab

export const demoChapters: QuizChapter[] = [
  { id: 'b1', title: 'Dasar Pemilahan', description: 'Mengenali sampah organik, daur ulang, dan residu.', questions: demoQuiz.slice(0, 3) },
  { id: 'b2', title: 'Daur Ulang & Bank Sampah', description: 'Cara menyiapkan dan menyetor sampah.', questions: demoQuiz.slice(3) },
];

const mapQ = (r: any): Quiz => ({ id: String(r.id), question: r.question, options: Array.isArray(r.options) ? r.options.map(String) : [], answer: r.correct_answer, explanation: r.explanation ?? '' });

export async function fetchQuizChapters(fallback = true): Promise<{ items: QuizChapter[]; demo: boolean }> {
  if (supabase) {
    const [c, q] = await Promise.all([
      supabase.from('quiz_chapters').select('*').order('id', { ascending: true }),
      supabase.from('quiz_questions').select('*').order('id', { ascending: true }),
    ]);
    // jika tabel bab belum ada (SQL update 5 belum dijalankan), semua soal masuk bab "Umum"
    const chapters: any[] = c.error ? [] : c.data ?? [];
    const questions: any[] = q.data ?? [];
    if (!q.error) {
      const items: QuizChapter[] = chapters.map((ch) => ({ id: String(ch.id), title: ch.title, description: ch.description ?? '', questions: questions.filter((x) => String(x.chapter_id) === String(ch.id)).map(mapQ) }));
      const orphan = questions.filter((x) => x.chapter_id == null || !chapters.some((ch) => String(ch.id) === String(x.chapter_id)));
      if (orphan.length > 0) items.push({ id: UMUM_ID, title: 'Umum', description: 'Soal yang belum dimasukkan ke bab.', questions: orphan.map(mapQ) });
      if (items.length > 0 || !fallback) return { demo: false, items };
    }
  }
  return { items: fallback ? demoChapters : [], demo: true };
}
