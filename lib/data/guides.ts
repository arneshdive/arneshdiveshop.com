export interface GuideSection {
  heading: string;
  body: string[];
}

export interface Guide {
  slug: string;
  title: string;
  description: string;
  icon: string;
  category?: string;
  divingType?: 'freediving' | 'scuba';
  publishedAt: string;
  intro: string;
  sections: GuideSection[];
  ctaLabel: string;
}

export const guides: Guide[] = [
  {
    slug: 'cara-memilih-masker-freediving',
    title: 'Cara Memilih Masker Freediving yang Tepat',
    description:
      'Panduan memilih masker freediving berdasarkan volume, fit wajah, dan material — agar tidak bocor dan nyaman dipakai lama.',
    icon: 'solar:eye-linear',
    category: 'masker',
    divingType: 'freediving',
    publishedAt: '2026-09-17',
    intro:
      'Masker adalah satu-satunya penghalang antara mata Anda dan air laut, jadi kesalahan memilih ukuran atau tipe akan langsung terasa di setiap sesi. Untuk freediving, ada satu prinsip yang membedakannya dari masker scuba biasa: volume internal.',
    sections: [
      {
        heading: 'Kenapa volume rendah itu penting',
        body: [
          'Semakin besar rongga udara di dalam masker, semakin banyak udara dari paru-paru yang harus dikeluarkan untuk equalize saat turun ke kedalaman. Masker scuba pada umumnya punya volume lebih besar karena dirancang untuk kenyamanan jangka panjang, bukan efisiensi udara.',
          'Masker freediving didesain low-volume — lensa diposisikan sedekat mungkin dengan mata — sehingga equalizing lebih hemat udara dan lebih cepat, terutama penting di kedalaman di atas 10-15 meter.',
        ],
      },
      {
        heading: 'Cara mengecek fit sebelum beli',
        body: [
          'Tes standar: tempelkan masker ke wajah tanpa strap, tarik napas pelan lewat hidung. Jika masker menempel dan tidak jatuh selama beberapa detik, sil (bagian silikon yang menyentuh kulit) cocok dengan bentuk wajah Anda.',
          'Perhatikan juga area di atas hidung dan di bawah mata — dua titik ini paling sering bocor jika ukuran tidak pas. Untuk wajah kecil atau tulang pipi menonjol, cari varian "low profile" atau ukuran S dari brand yang sama.',
        ],
      },
      {
        heading: 'Silikon hitam vs bening',
        body: [
          'Silikon bening memasukkan lebih banyak cahaya, membuat penglihatan sedikit lebih terang dan cocok untuk fotografi bawah air. Silikon hitam memblokir cahaya dari samping, mengurangi silau dan sering disukai untuk spearfishing karena tidak memantulkan cahaya ke arah ikan.',
        ],
      },
    ],
    ctaLabel: 'Lihat Masker Freediving',
  },
  {
    slug: 'fin-freediving-vs-fin-scuba',
    title: 'Fin Freediving vs Fin Scuba: Apa Bedanya?',
    description:
      'Perbedaan panjang blade, material, dan mekanisme kaki antara fin freediving dan fin scuba — serta kenapa keduanya tidak bisa saling gantikan.',
    icon: 'solar:swimming-linear',
    category: 'fin',
    publishedAt: '2026-09-17',
    intro:
      'Fin freediving dan fin scuba sering terlihat mirip di rak toko, tapi keduanya dirancang untuk masalah yang berbeda: efisiensi tenaga vs kontrol di kondisi sulit.',
    sections: [
      {
        heading: 'Panjang blade',
        body: [
          'Fin freediving punya blade panjang (60-100+ cm) yang menyimpan energi dari setiap kayuhan kaki, menghasilkan dorongan besar dengan tenaga otot yang lebih sedikit — penting saat menahan napas. Fin scuba jauh lebih pendek karena penyelam scuba tidak perlu mengejar efisiensi napas yang sama, dan blade pendek lebih mudah dikendalikan di arus atau ruang sempit seperti wreck.',
        ],
      },
      {
        heading: 'Kekakuan (stiffness) blade',
        body: [
          'Freediver pemula sebaiknya mulai dari blade soft/medium — lebih mudah dikayuh dan tidak membuat betis cepat lelah. Blade stiff/carbon baru masuk akal setelah teknik kayuhan (finning) sudah efisien, karena tenaga yang terbuang akibat teknik buruk jadi jauh lebih terasa di blade keras.',
          'Karbon lebih ringan dan mengembalikan energi lebih baik dari fiberglass, tapi harganya signifikan lebih mahal dan lebih rapuh jika terbentur karang atau dasar laut berbatu.',
        ],
      },
      {
        heading: 'Foot pocket: tertutup vs terbuka',
        body: [
          'Fin freediving umumnya pakai foot pocket tertutup (full-foot) yang pas ketat tanpa boot — mengurangi gesekan air. Fin scuba biasanya open-heel dengan strap, dipakai bersama boot neoprene untuk melindungi kaki dan memudahkan jalan di darat sebelum masuk air.',
        ],
      },
    ],
    ctaLabel: 'Lihat Semua Fin',
  },
  {
    slug: 'ketebalan-wetsuit-perairan-tropis',
    title: 'Ketebalan Wetsuit yang Tepat untuk Perairan Tropis Indonesia',
    description:
      'Panduan memilih ketebalan wetsuit 1.5mm, 3mm, atau 5mm sesuai suhu air dan durasi menyelam di perairan Indonesia.',
    icon: 'solar:t-shirt-linear',
    category: 'wetsuit',
    publishedAt: '2026-09-17',
    intro:
      'Suhu air di sebagian besar perairan Indonesia berkisar 26-29°C di permukaan, tapi bisa turun signifikan begitu masuk thermocline di kedalaman. Ketebalan yang tepat tergantung durasi menyelam dan seberapa dalam Anda akan turun, bukan cuma suhu di permukaan.',
    sections: [
      {
        heading: '1.5-2mm: snorkeling dan freedive dangkal',
        body: [
          'Cukup untuk sesi singkat di kedalaman dangkal (di bawah 10-15 meter) di air hangat. Fungsinya lebih ke melindungi kulit dari gesekan dan ubur-ubur daripada menahan dingin.',
        ],
      },
      {
        heading: '3mm: pilihan paling umum di Indonesia',
        body: [
          'Ketebalan paling serbaguna untuk freediving dan scuba di sebagian besar spot Indonesia — cukup hangat untuk sesi 1-2 jam, termasuk saat menembus thermocline di kedalaman menengah, tanpa membuat gerakan terlalu terbatas.',
        ],
      },
      {
        heading: '5mm ke atas: penyelaman dalam atau berulang',
        body: [
          'Dipertimbangkan untuk lokasi dengan thermocline kuat (misalnya beberapa titik di Indonesia timur), penyelaman berulang dalam satu hari, atau bagi penyelam yang lebih cepat merasa dingin. Trade-off-nya: lebih kaku, buoyancy lebih besar (butuh lebih banyak pemberat), dan lebih mahal.',
        ],
      },
    ],
    ctaLabel: 'Lihat Wetsuit',
  },
  {
    slug: 'bcd-untuk-pemula',
    title: 'BCD untuk Pemula: Panduan Memilih BCD Scuba',
    description:
      'Perbedaan BCD jacket-style dan back-inflate, serta apa yang perlu diperhatikan penyelam pemula saat memilih BCD pertama.',
    icon: 'solar:life-buoy-linear',
    category: 'bcd',
    divingType: 'scuba',
    publishedAt: '2026-09-17',
    intro:
      'BCD (Buoyancy Control Device) menentukan seberapa nyaman dan terkontrol Anda di dalam air. Untuk pembelian pertama, dua hal yang paling menentukan adalah tipe inflasi dan ukuran yang pas dengan tubuh.',
    sections: [
      {
        heading: 'Jacket-style vs back-inflate',
        body: [
          'Jacket-style mengembang di sekeliling tubuh (samping dan punggung), memberi stabilitas ekstra di permukaan — cocok untuk pemula karena lebih mudah mengapung tegak tanpa usaha. Back-inflate hanya mengembang di punggung, menghasilkan trim (posisi tubuh horizontal) yang lebih baik di dalam air dan lebih disukai penyelam berpengalaman atau yang menuju teknis diving.',
        ],
      },
      {
        heading: 'Ukuran menentukan segalanya',
        body: [
          'BCD yang kebesaran akan bergeser dan membuat tangki bergoyang; yang kekecilan membatasi pernapasan. Kebanyakan brand punya size chart berdasarkan lingkar dada, bukan ukuran baju biasa — selalu cek chart tersebut, jangan menebak dari S/M/L pakaian sehari-hari.',
        ],
      },
      {
        heading: 'Kapasitas angkat (lift capacity)',
        body: [
          'BCD untuk penyelaman air hangat dengan wetsuit tipis butuh lift capacity lebih kecil dibanding BCD untuk drysuit atau wetsuit tebal di air dingin. Untuk kebanyakan penyelam di Indonesia, lift capacity 14-18kg sudah cukup untuk kebutuhan rekreasi standar.',
        ],
      },
    ],
    ctaLabel: 'Lihat BCD',
  },
  {
    slug: 'regulator-din-vs-yoke',
    title: 'Regulator Scuba: DIN vs Yoke, Mana yang Harus Dipilih?',
    description:
      'Perbedaan koneksi regulator DIN dan Yoke, kompatibilitas dengan tabung, dan rekomendasi untuk penyelam yang sering menyelam di luar negeri.',
    icon: 'solar:gas-station-linear',
    category: 'regulator',
    divingType: 'scuba',
    publishedAt: '2026-09-17',
    intro:
      'Perbedaan DIN dan Yoke ada di cara first stage regulator terhubung ke katup tabung — bukan soal kualitas, tapi soal kompatibilitas dengan tabung yang tersedia di lokasi Anda menyelam.',
    sections: [
      {
        heading: 'Yoke: paling umum di Asia Tenggara',
        body: [
          'Sistem Yoke menjepit regulator di atas katup tabung menggunakan sekrup penjepit. Ini adalah standar paling umum di dive center Indonesia dan Asia Tenggara pada umumnya, jadi jika Anda kebanyakan menyewa tabung dari operator lokal, Yoke adalah pilihan paling praktis.',
        ],
      },
      {
        heading: 'DIN: standar untuk tekanan tinggi dan Eropa',
        body: [
          'Sistem DIN menyekrup langsung ke dalam katup, menghasilkan sambungan lebih kuat dan mendukung tekanan tabung lebih tinggi (232-300 bar) — umum di Eropa dan untuk technical/deep diving. Regulator DIN lebih ringkas tapi tidak semua dive center di Indonesia stok tabung katup DIN.',
        ],
      },
      {
        heading: 'Solusi praktis: adaptor atau konvertibel',
        body: [
          'Banyak first stage modern dijual dengan adaptor DIN-to-Yoke yang bisa dilepas-pasang, atau dalam varian "convertible" yang bisa diubah antara keduanya. Jika Anda sering menyelam di beberapa negara, ini adalah pilihan paling aman ketimbang berkomitmen di satu sistem.',
        ],
      },
    ],
    ctaLabel: 'Lihat Regulator',
  },
  {
    slug: 'checklist-perlengkapan-freediving-pemula',
    title: 'Checklist Perlengkapan Freediving untuk Pemula',
    description:
      'Urutan prioritas perlengkapan freediving yang perlu dibeli lebih dulu bagi pemula, dari yang wajib sampai yang bisa menyusul.',
    icon: 'solar:checklist-linear',
    divingType: 'freediving',
    publishedAt: '2026-09-17',
    intro:
      'Freediving tidak butuh perlengkapan sebanyak scuba, tapi urutan pembelian tetap penting — sebagian alat langsung memengaruhi keamanan, sebagian lain baru terasa manfaatnya setelah teknik dasar dikuasai.',
    sections: [
      {
        heading: 'Prioritas 1: masker, snorkel, fin',
        body: [
          'Tiga alat ini adalah fondasi dan sebaiknya dibeli sekaligus di awal. Masker low-volume, snorkel sederhana (tanpa katup/purge berlebihan yang justru menambah volume), dan fin dengan blade soft/medium untuk pemula.',
        ],
      },
      {
        heading: 'Prioritas 2: wetsuit dan weight belt',
        body: [
          'Setelah sering menyelam di sesi lebih dari 30-45 menit, wetsuit 3mm jadi investasi berikutnya — melindungi dari gesekan dan menjaga suhu tubuh. Weight belt (sabuk pemberat) baru relevan setelah tahu kebutuhan pemberat dari sesi latihan buoyancy check, bukan dibeli asal di awal.',
        ],
      },
      {
        heading: 'Prioritas 3: freediving computer dan lanyard',
        body: [
          'Freediving computer (mencatat kedalaman dan waktu) dan lanyard (tali pengaman ke tali pemandu) jadi penting begitu mulai latihan di kedalaman atau di kolam constant weight — bukan kebutuhan sesi snorkeling santai di permukaan.',
        ],
      },
    ],
    ctaLabel: 'Lihat Perlengkapan Freediving',
  },
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return guides.find((guide) => guide.slug === slug);
}

// Used for the Article JSON-LD `image` field and OpenGraph — the guides
// have no dedicated photography, so this reuses the site's existing
// diving-type banners (falling back to the homepage hero for category-only
// guides) rather than shipping schema.org markup with no image at all.
export function getGuideImagePath(guide: Guide): string {
  if (guide.divingType === 'freediving') return '/freediving-banner.webp';
  if (guide.divingType === 'scuba') return '/scuba-banner.webp';
  return '/hero-diver.webp';
}

export function getGuideForFilter(
  categorySlug?: string,
  divingType?: string
): Guide | undefined {
  if (categorySlug) {
    const match = guides.find(
      (guide) => guide.category === categorySlug && (!divingType || guide.divingType === divingType)
    );
    if (match) return match;
    const categoryOnly = guides.find((guide) => guide.category === categorySlug);
    if (categoryOnly) return categoryOnly;
  }
  if (divingType) {
    return guides.find((guide) => guide.divingType === divingType && !guide.category);
  }
  return undefined;
}
