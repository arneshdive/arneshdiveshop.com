import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local'), quiet: true });
config({ path: resolve(process.cwd(), '.env'), quiet: true });

import { inArray, sql } from 'drizzle-orm';
import type { NewBlogPost } from '@/lib/db';

const author = 'Tim Editorial Arnesh Dive';

const posts: NewBlogPost[] = [
  {
    slug: 'cara-memilih-masker-freediving',
    title: 'Masker Bocor atau Cuma Berkabut?',
    excerpt:
      'Bedakan kebocoran dari embun sebelum membeli masker baru, lalu siapkan lensa dan seal dengan cara yang aman.',
    category: 'Freediving',
    coverImageUrl: '/freediving-banner.webp',
    coverImageAlt: 'Freediver memakai masker di bawah permukaan laut',
    author,
    readTimeMinutes: 6,
    divingType: 'freediving',
    relatedCategorySlug: 'masker',
    ctaLabel: 'Lihat pilihan masker',
    ctaHref: '/produk?category=masker',
    isFeatured: false,
    isPublished: true,
    sortOrder: 6,
    publishedAt: new Date('2025-10-14T08:00:00+07:00'),
    sources: [
      {
        title: 'Two Sophies: How do I prevent mask fogging?',
        publisher: 'British Sub-Aqua Club (BSAC)',
        url: 'https://www.bsac.com/news-and-blog/two-sophies-how-do-i-prevent-mask-fogging',
      },
    ],
    content: [
      {
        heading: 'Mulai dengan melihat pola masalahnya',
        paragraphs: [
          'Saat lensa memutih atau buram merata, masalahnya biasanya embun. Saat ada jalur air dingin masuk dari satu sisi, atau Anda harus berulang kali mengosongkan masker, itu lebih mengarah ke seal yang tidak rapat. Keduanya bisa terjadi pada satu dive, tetapi solusinya berbeda. Membeli masker lain karena embun, misalnya, sering tidak menyelesaikan apa-apa.',
          'Sebelum menyalahkan bentuk wajah, perhatikan kapan air muncul. Kebocoran yang baru terasa ketika Anda menggigit mouthpiece dapat berasal dari skirt yang terangkat di bawah hidung. Air yang masuk setelah menoleh ke atas bisa datang dari rambut, hood, atau strap yang berpindah. Bila lensa jernih saat turun lalu berkabut perlahan, cek persiapan lensa dan kebiasaan menyentuh bagian dalamnya.',
          'Jangan pakai tes singkat di toko sebagai janji bahwa masker akan sempurna di laut. Tes itu hanya menyaring model yang jelas tidak cocok. Coba juga gerakan yang benar-benar dilakukan saat menyelam: mengernyit, melihat ke bawah, menoleh, dan bernapas lewat snorkel atau regulator. Jika frame menekan batang hidung atau skirt terasa tertarik saat rahang bergerak, pindah ke model lain.',
        ],
      },
      {
        heading: 'Uji seal tanpa menarik strap sampai keras',
        paragraphs: [
          'Tempelkan masker ke wajah tanpa strap. Tarik napas sangat pelan melalui hidung lalu lepaskan tangan. Masker yang sesuai biasanya bertahan dengan tekanan ringan, bukan karena Anda menyedot sekuat-kuatnya. Tarikan terlalu kuat dapat membuat hampir semua skirt menempel sebentar dan memberi hasil yang menipu.',
          'Setelah itu pasang strap di bagian belakang kepala, bukan rendah di tengkuk, lalu kencangkan secukupnya agar masker tidak bergeser. Strap yang terlalu kencang dapat melipat silikon di area pelipis atau bawah hidung; hasilnya justru rembes. Ratakan rambut dari garis seal, dan pastikan tepi hood tidak masuk ke bawah skirt. Kumis atau rambut wajah di area seal juga dapat membuat air mencari jalan masuk.',
          'Saat berada di air, jangan buru-buru menarik strap ketika ada sedikit air. Tengok apakah skirt terlipat, buang air dengan tenang, lalu posisikan ulang masker. Jika tetap bocor setelah penyesuaian sederhana, akhiri upaya memaksa dan gunakan masker cadangan atau sewaan yang fit. Jangan melanjutkan latihan kedalaman dengan pandangan yang mengganggu komunikasi, orientasi, atau kemampuan mengawasi buddy.',
        ],
        bullets: [
          'Jauhkan rambut, hood, dan tali snorkel dari bawah skirt.',
          'Pastikan frame tidak menyentuh alis atau batang hidung ketika masker dipakai.',
          'Bawa masker cadangan pada perjalanan bila masker utama sudah menunjukkan silikon retak atau strap rapuh.',
        ],
      },
      {
        heading: 'Tangani embun dengan perlakuan yang sesuai bahan',
        paragraphs: [
          'Embun terbentuk ketika kelembapan dari wajah dan napas mengembun pada lensa yang lebih dingin. BSAC menyarankan penggunaan defog sebagai langkah praktis sebelum masuk air. Ikuti petunjuk produk defog, bilas ringan sesuai instruksi, dan hindari mengusap bagian dalam lensa setelahnya. Jari yang baru menyentuh sunscreen, minyak, atau air laut dapat meninggalkan lapisan yang memudahkan embun muncul lagi.',
          'Masker baru bisa membawa residu pabrik, tetapi cara membersihkannya tidak sama untuk setiap produk. Baca instruksi merek lebih dulu, terutama jika lensa memiliki coating, memakai material selain tempered glass, atau produsen memberi cara pembersihan khusus. Pasta gigi, bahan abrasif, dan api sering dipromosikan sebagai jalan pintas; ketiganya berisiko menggores, merusak coating, atau merusak komponen. Tidak ada manfaat keselamatan dari eksperimen itu di malam sebelum trip.',
          'Bilas masker dengan air tawar setelah dipakai, keringkan di tempat teduh, dan simpan di kotaknya ketika benar-benar kering. Bila embun tetap muncul pada beberapa sesi meski defog dipakai sesuai petunjuk, lakukan pemeriksaan ulang pada kondisi lensa dan konsultasikan ke toko atau produsen. Jangan menutupi masalah lensa dengan terus membuka masker di kedalaman.',
        ],
      },
      {
        heading: 'Siapkan sebelum masuk, bukan saat sudah turun',
        paragraphs: [
          'Buat urutan kecil di pinggir air: periksa lensa, bersihkan area seal, pasang strap, lalu coba bernapas dan melihat ke segala arah. Masukkan juga pengecekan masker ke briefing buddy. Buddy perlu tahu jika Anda memakai model baru atau masih menilai fit-nya, karena masalah sederhana di permukaan dapat berubah menjadi distraksi saat latihan line diving.',
          'Masker low-volume dapat membantu freediver mengelola udara saat equalization, tetapi volume rendah tidak menggantikan teknik equalization, pengawasan, atau keputusan untuk membatalkan dive. Jika hidung tersumbat, tekanan pada wajah terasa tidak normal, atau pandangan tidak dapat dibersihkan dengan tenang, kembali ke permukaan bersama buddy dan berhenti dari sesi kedalaman hari itu.',
          'Untuk kunjungan berikutnya ke toko, catat masalah yang benar-benar terjadi: bocor di bawah hidung, frame menekan, atau embun setelah beberapa menit. Catatan itu lebih berguna daripada memilih dari label “freediving” saja. Masker yang tenang di wajah membuat Anda bisa fokus pada prosedur dan buddy, bukan terus membetulkan gear.',
        ],
        note: {
          title: 'Berhenti dan periksa',
          body: 'Jangan memaksa masker yang mengganggu penglihatan atau equalization. Kondisi itu bukan sesuatu yang perlu “dibiasakan” saat latihan.',
        },
      },
    ],
  },
  {
    slug: 'ketebalan-wetsuit-perairan-tropis',
    title: 'Wetsuit Tropis: Suhu Permukaan Bukan Satu-satunya Patokan',
    excerpt:
      'Pilih wetsuit dari suhu di kedalaman, lama sesi, fit, dan perubahan buoyancy—bukan dari cuaca di dermaga saja.',
    category: 'Panduan Gear',
    coverImageUrl: '/lab/reef.jpg',
    coverImageAlt: 'Penyelam memakai wetsuit di atas terumbu tropis',
    author,
    readTimeMinutes: 7,
    relatedCategorySlug: 'wetsuit',
    ctaLabel: 'Lihat koleksi wetsuit',
    ctaHref: '/produk?category=wetsuit',
    isFeatured: false,
    isPublished: true,
    sortOrder: 5,
    publishedAt: new Date('2025-12-06T08:00:00+07:00'),
    sources: [
      {
        title: 'What is a thermocline?',
        publisher: 'NOAA Ocean Service',
        url: 'https://oceanservice.noaa.gov/facts/thermocline.html',
      },
      {
        title: 'Background: Diver',
        publisher: 'Naval Postgraduate School',
        url: 'https://nps.edu/web/awtl/background-diver',
      },
    ],
    content: [
      {
        heading: 'Tanyakan suhu di kedalaman dan rencana sesi',
        paragraphs: [
          'Dermaga yang panas tidak menjawab bagaimana tubuh akan terasa setelah beberapa kali turun. NOAA menjelaskan thermocline sebagai lapisan perubahan suhu yang cepat di kolom air. Kedalamannya berubah menurut lokasi, musim, cuaca, dan pergerakan air. Karena itu, suhu permukaan yang nyaman bisa tidak mewakili bagian dive yang paling lama atau paling diam.',
          'Sebelum memilih suit, tanyakan operator mengenai suhu terbaru di kedalaman rencana, ada tidaknya lapisan air yang terasa lebih dingin, dan apakah dive akan berulang. Tanyakan juga waktu menunggu di permukaan, perjalanan perahu yang berangin, serta apakah Anda akan banyak diam untuk memotret atau menjaga buddy. Semua itu menentukan kehilangan panas, bukan sekadar angka pada prakiraan cuaca.',
          'Diver yang bergerak aktif dalam sesi singkat bisa nyaman dengan perlindungan yang lebih ringan daripada diver yang menghabiskan waktu lama di kedalaman. Sebaliknya, seseorang yang mudah dingin mungkin membutuhkan perlindungan lebih meski temannya memilih suit tipis. Jadikan rekomendasi ketebalan sebagai titik awal percobaan, bukan ukuran ketahanan mental.',
        ],
      },
      {
        heading: 'Bandingkan ketebalan dengan aktivitas yang dilakukan',
        paragraphs: [
          'Tabel ketebalan di toko hanya bisa menjadi titik awal karena suhu bukan satu-satunya variabel. Untuk air hangat dan aktivitas singkat, shorty atau suit ringan mungkin cukup. Untuk sesi panjang, penyelaman berulang, atau air yang berubah dingin di bawah, full suit dengan insulasi lebih banyak dapat memberi margin yang lebih masuk akal. Coba sewa satu konfigurasi sebelum menganggap satu angka cocok sepanjang tahun.',
          'Scuba diver sering berada lebih lama pada kedalaman dan bergerak relatif pelan ketika mengamati atau menunggu, sehingga rasa dingin dapat datang lebih cepat. Freediver menghadapi waktu tunggu di permukaan sekaligus kompresi neoprene ketika turun. Keduanya tidak perlu memakai jawaban yang sama. Jangan mengganti keputusan dengan menambah pemberat atau memaksakan waktu di air ketika tubuh sudah tidak nyaman.',
          'Perlindungan juga bukan hanya ketebalan torso. Hood, kaus kaki, dan sarung tangan yang sesuai kondisi dapat membantu bila bagian ujung tubuh cepat dingin, asalkan dipakai sesuai aturan operator dan tetap memungkinkan kontrol yang aman. Pilih perlengkapan yang masih membuat Anda dapat bernapas penuh, menggerakkan bahu, dan mengoperasikan peralatan.',
        ],
        bullets: [
          'Sesi singkat dan air konsisten hangat: mulai dengan opsi yang lebih ringan bila fit-nya baik.',
          'Dive berulang, menunggu lama, atau thermocline: pertimbangkan full suit atau lapisan lebih hangat.',
          'Toleransi dingin pribadi: catat setelah dive, bukan berdasarkan pilihan teman.',
        ],
      },
      {
        heading: 'Fit menahan lapisan air tipis, celah membuangnya',
        paragraphs: [
          'Wetsuit bekerja dengan membatasi pertukaran air dan membantu tubuh menghangatkan lapisan tipis yang tertahan di dalamnya. Celah di punggung bawah, ketiak, pergelangan, atau leher membuat air terus bersirkulasi. Akibatnya suit yang lebih tebal dapat tetap terasa dingin. Naval Postgraduate School juga mengingatkan bahwa paparan dingin memengaruhi diver; gejala perlu diperlakukan sebagai informasi, bukan ujian ketangguhan.',
          'Coba suit dengan posisi yang akan dipakai: squat, angkat tangan, putar bahu, dan ambil napas penuh. Suit harus rapat tanpa membatasi dada atau membuat leher terasa tercekik. Kerutan besar dan ruang kosong adalah tanda air dapat mudah bergerak; rasa kebas atau napas yang terhambat adalah tanda ukuran atau potongan tidak cocok. Jangan menebus fit buruk dengan memilih neoprene semakin tebal.',
          'Bila menyewa, luangkan waktu mencobanya sebelum jadwal perahu. Minta ukuran lain jika air masuk deras dari bagian tertentu atau ritsleting tidak duduk rapi. Lebih aman mengganti di darat daripada berharap suit akan “mengikuti bentuk badan” setelah setengah jam di air.',
        ],
      },
      {
        heading: 'Setel ulang buoyancy setiap kali konfigurasi berubah',
        paragraphs: [
          'Neoprene menambah daya apung di permukaan dan terkompresi semakin dalam. Ketebalan, ukuran suit, jenis air, tabung, serta konfigurasi lain dapat mengubah jumlah pemberat dan posisi netral Anda. Jangan membawa angka pemberat dari suit lama ke suit baru begitu saja. Lakukan buoyancy check bersama instruktur atau dive professional yang sesuai dengan aktivitas Anda.',
          'Overweight mungkin membuat descent terasa mudah, tetapi dapat membuat ascent dan keadaan darurat lebih berat. Underweight pun dapat menyulitkan menjaga posisi dan prosedur. Untuk freediving, keputusan pemberat dan neutral buoyancy harus dibahas dalam konteks pelatihan serta pengawasan buddy; untuk scuba, cek juga kendali buoyancy pada akhir dive dengan gas yang tersisa. Gear tidak menggantikan prosedur atau pasangan selam.',
          'Keluar dari air bila mulai menggigil, tangan kehilangan koordinasi, sulit fokus, atau keputusan sederhana terasa lambat. Catat kedalaman, durasi, konfigurasi, dan rasa dingin setelahnya. Catatan tersebut memberi dasar yang lebih baik untuk memilih suit berikutnya daripada menebak dari label milimeter.',
        ],
        note: {
          title: 'Kapan sesi harus dihentikan',
          body: 'Dingin yang mengganggu koordinasi atau fokus adalah alasan untuk mengakhiri sesi, menghangatkan tubuh, dan meninjau konfigurasi.',
        },
      },
    ],
  },
  {
    slug: 'budget-perlengkapan-freediving-pemula',
    title: 'Gear Freediving Pemula: Mana yang Dibeli, Mana yang Disewa?',
    excerpt:
      'Prioritaskan barang yang sangat bergantung pada fit, lalu sewa perlengkapan yang kebutuhannya masih berubah.',
    category: 'Freediving',
    coverImageUrl: '/lab/hero-freediver.jpg',
    coverImageAlt: 'Freediver turun mengikuti tali latihan di laut biru',
    author,
    readTimeMinutes: 7,
    divingType: 'freediving',
    relatedCategorySlug: null,
    ctaLabel: 'Lihat gear freediving',
    ctaHref: '/produk?divingType=freediving',
    isFeatured: false,
    isPublished: true,
    sortOrder: 4,
    publishedAt: new Date('2026-02-18T08:00:00+07:00'),
    sources: [
      {
        title: 'Freediving Gear',
        publisher: 'SSI',
        url: 'https://www.divessi.com/en/blog/freediving-gear-9186.html',
      },
      {
        title: 'Beginner’s Guide to Freediving',
        publisher: 'SSI',
        url: 'https://www.divessi.com/en/blog/beginners_guide_freediving-8414.html',
      },
      {
        title: 'Pool Freediving',
        publisher: 'SSI',
        url: 'https://www.divessi.com/en/blog/pool-freediving-10017.html',
      },
    ],
    content: [
      {
        heading: 'Pisahkan dana belajar dari dana perlengkapan',
        paragraphs: [
          'Menyusun budget freediving lebih berguna bila dimulai dari pertanyaan “apa yang belum saya tahu?” daripada “apa yang paling canggih?” SSI menempatkan pelatihan, teknik, dan prosedur keselamatan sebagai bagian dasar aktivitas, bukan tambahan setelah gear lengkap. Sisihkan dulu biaya kelas, akses kolam atau laut, transportasi, dan sesi bersama buddy yang kompeten. Gear yang rapi tidak mengajarkan rescue, equalization, atau kapan harus membatalkan dive.',
          'Buat daftar aktivitas untuk beberapa bulan pertama. Apakah Anda akan ikut kelas kolam, mencoba line diving dengan instruktur, atau baru satu kali trip? Daftar itu membantu membedakan barang yang dipakai setiap sesi dari barang yang kebutuhannya masih berubah. Jangan mengunci uang pada konfigurasi kedalaman sebelum Anda tahu apakah latihan rutin akan berlangsung di kolam, laut, atau keduanya.',
          'Satu aturan praktis: bila kesalahan ukuran akan mengganggu setiap pemakaian, cenderung beli setelah mencoba; bila kebutuhan teknisnya belum jelas, cenderung sewa atau pinjam lebih dulu. Ini bukan larangan membeli, melainkan cara agar keputusan berikutnya datang dari pengalaman yang diawasi, bukan dari foto paket.',
        ],
      },
      {
        heading: 'Beli lebih awal untuk barang yang menyentuh tubuh',
        paragraphs: [
          'Masker, snorkel, dan fin umumnya layak menjadi pembelian bertahap karena fit wajah, gigitan mouthpiece, dan ukuran foot pocket sangat personal. Masker yang selalu bocor atau snorkel yang membuat rahang cepat lelah akan mengganggu hampir setiap latihan. Fin juga perlu dicoba bersama kaus kaki neoprene yang benar-benar akan dipakai; ukuran yang terasa pas tanpa kaus kaki belum tentu pas di air.',
          'Namun “beli personal” bukan berarti harus membeli versi tertinggi. SSI membahas gear freediving sebagai sistem yang dipilih sesuai penggunaan. Untuk pemula, fin yang memungkinkan teknik rapi dan tidak membuat kaki cepat kram lebih bernilai daripada blade yang terlalu kaku. Pilih setelah mendapat umpan balik instruktur tentang teknik, bukan untuk mengejar tampilan atau angka kedalaman.',
          'Simpan ruang untuk barang kecil yang mendukung penggunaan bersih dan teratur, seperti tas jaring atau kotak masker. Barang itu tidak menggantikan gear keselamatan, tetapi membantu Anda merawat barang yang sudah dipilih dengan benar. Bila toko memungkinkan, minta waktu mencoba daripada mengandalkan label ukuran lintas merek.',
        ],
        bullets: [
          'Tahap awal: kelas, masker yang fit, dan snorkel yang nyaman.',
          'Setelah beberapa latihan: fin dan kaus kaki yang sudah dicoba bersama.',
          'Beli berikutnya ketika kebutuhan air, ukuran, dan frekuensi penggunaan sudah jelas.',
        ],
      },
      {
        heading: 'Sewa saat kondisi dan konfigurasi masih berubah',
        paragraphs: [
          'Wetsuit dan weight belt sering lebih masuk akal untuk disewa pada beberapa sesi pertama. Ketebalan suit bergantung pada suhu, durasi, dan toleransi dingin; jumlah pemberat berubah mengikuti suit, salinitas, dan aktivitas. Menentukan keduanya sendiri dari saran umum dapat menghasilkan buoyancy yang tidak aman. Minta instruktur atau profesional setempat memandu pemeriksaan buoyancy setiap kali konfigurasi berubah.',
          'Computer juga bisa menunggu sampai Anda tahu fitur yang diperlukan. SSI membahas latihan kolam sebagai lingkungan yang tetap memerlukan prosedur dan pengawasan. Log atau alarm pada computer tidak membuat latihan aman bila buddy tidak siap atau rencana sesi tidak jelas. Gunakan alat yang tersedia dalam kelas sesuai arahan, lalu beli ketika Anda dapat menjelaskan fungsi yang benar-benar akan dipakai secara konsisten.',
          'Barang sewaan perlu diperiksa sebelum dipakai. Pastikan buckle weight belt dapat dilepas, suit tidak robek di area kritis, dan fin tidak memiliki retak yang mencurigakan. Jika ada keraguan pada kondisi gear, jangan bernegosiasi dengan diri sendiri demi mengikuti jadwal. Ganti unit atau lewati sesi sampai perlengkapan yang layak tersedia.',
        ],
      },
      {
        heading: 'Tunda upgrade sampai masalahnya punya nama',
        paragraphs: [
          'Carbon fin, wetsuit custom, lanyard, dan computer dengan banyak mode dapat berguna pada konteks tertentu. Mereka bukan urutan wajib untuk orang yang baru membangun kebiasaan latihan. Setelah beberapa sesi, tulis masalah yang spesifik: foot pocket bergeser, suit selalu kemasukan air, atau Anda membutuhkan catatan interval yang tidak bisa dipenuhi alat saat ini. Masalah yang jelas membuat percakapan dengan instruktur atau toko jauh lebih berguna.',
          'Jangan memakai upgrade untuk menutup kekurangan prosedur. Freediving tidak dilakukan sendirian, dan tidak ada gear yang menggantikan buddy yang mengawasi, pelatihan yang sesuai, atau keputusan untuk berhenti ketika equalization dan kondisi tubuh tidak baik. Jika dana harus memilih antara akses latihan yang diawasi dan aksesori baru, pertimbangkan yang memperkuat kebiasaan aman terlebih dahulu.',
          'Sebelum checkout, buka daftar aktivitas tadi dan cocokkan satu produk dengan satu kebutuhan nyata. Bila jawabannya masih “barangkali nanti”, sewa atau tunda. Budget yang tidak habis pada item spekulatif tetap tersedia untuk sesi berikutnya, saat Anda punya data tubuh dan latihan untuk membuat pilihan yang lebih tepat.',
        ],
        note: {
          title: 'Jangan jadikan harga sebagai ukuran siap',
          body: 'Kesiapan ditentukan oleh pelatihan, rencana, buddy, dan gear yang cocok serta layak pakai—bukan oleh banyaknya item yang sudah dibeli.',
        },
      },
    ],
  },
  {
    slug: 'bcd-untuk-pemula',
    title: 'Cara Mengecek BCD dan Regulator Sebelum Menyelam',
    excerpt:
      'Ikuti urutan pemeriksaan tanpa terburu-buru, kenali tanda untuk berhenti memakai alat, dan serahkan servis pada teknisi.',
    category: 'Scuba',
    coverImageUrl: '/lab/scuba.jpg',
    coverImageAlt: 'Scuba diver menggunakan BCD di laut terbuka',
    author,
    readTimeMinutes: 7,
    divingType: 'scuba',
    relatedCategorySlug: 'bcd',
    ctaLabel: 'Lihat pilihan BCD',
    ctaHref: '/produk?category=bcd',
    isFeatured: true,
    isPublished: true,
    sortOrder: 1,
    publishedAt: new Date('2026-08-23T08:00:00+07:00'),
    sources: [
      {
        title: 'Scuba Gear Care: 6 Ways to Make Your Gear Summer Ready',
        publisher: 'SSI',
        url: 'https://www.divessi.com/en/blog/scuba-gear-care-6-ways-to-make-your-gear-summer-ready-8390.html',
      },
      {
        title: 'Preseason Checks & Maintenance',
        publisher: 'Divernet',
        url: 'https://www.divernet.com/scuba-diving/scuba-equipment-preseason-checks-maintenance/',
      },
      {
        title: 'Dive Smarter Using Rental Dive Gear',
        publisher: 'Divernet',
        url: 'https://www.divernet.com/scuba-diving/dive-smarter-using-rental-dive-gear/',
      },
    ],
    content: [
      {
        heading: 'Mulai sebelum alat dipakai, tanpa terburu-buru',
        paragraphs: [
          'Pemeriksaan pra-dive tidak menggantikan briefing operator atau buddy check; ini menyiapkan Anda untuk keduanya. Tata BCD, regulator, pengukur tekanan, komputer selam, tabung, dan pemberat di tempat yang cukup lapang. Jika memakai alat sewaan, lebih baik meminta unit pengganti di darat daripada baru menemukan masalah di perahu.',
        ],
      },
      {
        heading: '01 — Periksa BCD dan pengikat tabung',
        paragraphs: [
          'Periksa kantung udara, tali bahu, pengikat tabung (tank band), buckle, serta kantong atau sistem pelepas pemberat. Cari sobekan, jahitan terbuka, buckle retak, atau tali yang mulai aus. Setelah tabung terpasang, goyangkan sistem dengan ringan untuk memastikan posisinya tidak bergeser.',
          'Hubungkan selang inflator tekanan rendah lalu tekan tombol inflasi sebentar. BCD harus mengisi tanpa suara bocor yang terus muncul. Coba tombol deflasi dan setiap katup pembuangan (dump valve); udara harus keluar saat dioperasikan dan katup harus menutup lagi setelah dilepas.',
        ],
      },
      {
        heading: '02 — Beri tekanan pada regulator',
        paragraphs: [
          'Pastikan penutup inlet (dust cap) dan inlet kering sebelum first stage dipasang. Buka valve tabung perlahan dengan wajah tidak berada di depan pressure gauge. Dengarkan kebocoran dan lihat apakah tekanan terbaca stabil. Jika memakai alat sewaan, tunjukkan kejanggalan kepada staf—jangan membongkar sambungan agar jadwal tidak mundur.',
          'Tarik beberapa napas dari regulator utama dan alternate air source. Aliran seharusnya konsisten, tanpa free-flow yang menetap atau tarikan napas yang terasa sangat berat. Tekan purge secukupnya untuk mengenali responsnya, lalu periksa apakah selang retak, tertekuk tajam, atau membatasi gerakan kepala.',
        ],
      },
      {
        heading: '03 — Selesaikan dengan buddy check',
        paragraphs: [
          'Lakukan buddy check memakai urutan yang disepakati operator atau kursus. Pastikan masing-masing tahu lokasi inflator, dump valve, alternate air source, pelepas pemberat, dan buckle utama. Alat yang lolos pemeriksaan pribadi belum cukup bila buddy tidak tahu cara membantu saat situasi berubah.',
        ],
        bullets: [
          'BCD: inflasi, deflasi, sambungan selang, dan semua dump valve bekerja.',
          'Regulator: primary dan alternate bernapas normal; purge tidak macet.',
          'Sistem terpasang: tank band kokoh; pemberat aman dan release dapat dijangkau.',
        ],
      },
      {
        heading: 'Kenali tanda untuk tidak memasuki air',
        paragraphs: [
          'Hentikan penggunaan unit bila BCD tidak menahan udara, inflator terus mengisi, dump valve tidak menutup, atau tank band tidak dapat diamankan dengan benar. Pada regulator, free-flow yang tidak berhenti, kebocoran kuat di sambungan, pressure gauge yang memberi pembacaan tidak masuk akal, napas berat, atau kelembapan di inlet adalah alasan untuk menyerahkan gear ke staf atau teknisi. Jangan menilai risikonya dari apakah masalah itu “mungkin hilang nanti”.',
          'Tanda lain bisa muncul pada material: selang getas, retak, bekas korosi, buckle retak, atau jahitan yang lepas. Foto atau tunjukkan bagian yang dimaksud saat mengembalikan rental agar staf dapat menilai dan menggantinya. Bila itu gear pribadi, catat masalah dan jadwalkan pemeriksaan dengan pusat servis yang memenuhi ketentuan produsen. SSI dan Divernet sama-sama menempatkan perawatan rutin sebagai bagian dari kesiapan gear, bukan pekerjaan darurat di dek kapal.',
          'Jangan membuka first stage, melumasi komponen regulator, mengutak-atik inflator, atau mencoba menambal bladder sendiri. Perawatan pengguna terbatas pada pembilasan, pengeringan, penyimpanan, dan pemeriksaan visual sesuai manual. Servis internal membutuhkan alat, suku cadang, dan pengujian yang tepat. Menunda dive jauh lebih ringan daripada membawa sistem yang diragukan ke bawah air.',
        ],
      },
      {
        heading: 'Setelah dive, buat pemeriksaan berikutnya lebih mudah',
        paragraphs: [
          'Bilas BCD dan regulator dengan air tawar sesuai petunjuk produsen setelah dipakai, lalu biarkan kering di tempat teduh sebelum disimpan. SSI mengingatkan bahwa sisa garam dan penyimpanan lembap memperpendek umur gear. Untuk regulator, jaga dust cap tetap kering dan terpasang hanya saat inlet sudah benar-benar kering. Hindari menekan purge saat first stage tidak terpasang dan tidak bertekanan kecuali manual memang mengizinkan prosedur tertentu.',
          'Catat kebocoran kecil, tombol yang seret, atau komponen yang perlu diperiksa saat Anda masih mengingatnya. Catatan singkat membantu membedakan masalah baru dari kebiasaan lama dan memberi teknisi konteks yang berguna. Jangan menunggu sampai perjalanan berikutnya untuk mencari manual, riwayat servis, atau toko yang dapat menangani merek Anda.',
          'Pemeriksaan ini tetap perlu diikuti briefing, batas sertifikasi, rencana gas, dan buddy check. Bila satu komponen meragukan, berhenti menggunakan set itu sampai dinilai oleh pihak yang tepat.',
        ],
        note: {
          title: 'Tidak untuk DIY servis',
          body: 'Jika fungsi udara atau buoyancy tidak normal, jangan membongkar atau memperbaiki sendiri. Tandai unit, laporkan, dan gunakan teknisi yang sesuai.',
        },
      },
    ],
  },
  {
    slug: 'regulator-din-vs-yoke',
    title: 'DIN vs Yoke untuk Regulator Pribadi yang Dibawa Bepergian',
    excerpt:
      'Pilih koneksi berdasarkan silinder yang akan disewa, lalu rencanakan adaptor dan pemeriksaan sambungan sebelum perjalanan.',
    category: 'Scuba',
    coverImageUrl: '/scuba-banner.webp',
    coverImageAlt: 'Scuba diver bernapas melalui regulator di bawah air',
    author,
    readTimeMinutes: 6,
    divingType: 'scuba',
    relatedCategorySlug: 'regulator',
    ctaLabel: 'Lihat regulator scuba',
    ctaHref: '/produk?category=regulator',
    isFeatured: false,
    isPublished: true,
    sortOrder: 3,
    publishedAt: new Date('2026-04-11T08:00:00+07:00'),
    sources: [
      {
        title: 'Ask Mark: 300-Bar Cylinders, DIN vs Yoke',
        publisher: 'Divernet',
        url: 'https://divernet.com/scuba-diving/technique-scuba-diving/askmark-full-face-masks-300-bar-cylinders-din-vs-yoke/',
      },
      {
        title: 'DIN/Yoke Regulator',
        publisher: 'Undercurrent',
        url: 'https://www.undercurrent.org/UCnow/dive_magazine/2019/DINYokeRegulator201911.html',
      },
    ],
    content: [
      {
        heading: 'Yang berbeda adalah sambungan first stage',
        paragraphs: [
          'DIN dan yoke menggambarkan cara first stage terhubung ke valve silinder, bukan kualitas napas regulator secara otomatis. Pada yoke, first stage menjepit bagian luar valve dan O-ring berada pada valve silinder. Pada DIN, first stage disekrup ke dalam valve dan O-ring berada pada regulator. Divernet dan Undercurrent membahas perbedaan ini beserta konteks tekanan dan kompatibilitasnya.',
          'Koneksi DIN yang sesuai dapat lebih terlindung karena O-ring berada di dalam sambungan. Namun manfaat itu tidak menghapus kebutuhan memeriksa O-ring, kebersihan inlet, dan kondisi valve tiap kali memasang regulator. Yoke pun bukan pilihan yang “kurang aman” bila dipasangkan, dirawat, dan digunakan sesuai konfigurasi yang benar. Hindari menyederhanakan pilihan menjadi satu koneksi selalu unggul di semua perjalanan.',
          'Pertanyaan yang lebih berguna adalah: silinder apa yang akan tersedia pada operator yang benar-benar Anda pesan? Jangan menjawabnya dari negara tujuan atau cerita forum yang sudah lama. Operator, kapal, dan armada sewaan dapat memakai konfigurasi berbeda. Tanyakan langsung sebelum membayar atau mengemas regulator pribadi.',
        ],
      },
      {
        heading: 'Konfirmasi valve silinder sebelum berangkat',
        paragraphs: [
          'Kirim pertanyaan spesifik kepada operator: apakah silinder sewaan menerima DIN, yoke, atau valve dengan insert yang dapat dilepas; tekanan kerja yang digunakan; dan apakah adaptor tersedia. Minta jawaban tertulis atau foto valve jika perjalanan Anda bergantung pada koneksi tertentu. Ini juga waktu untuk memberi tahu mereka bila regulator Anda memiliki bentuk first stage atau selang yang tidak biasa.',
          'Beberapa valve dapat menerima lebih dari satu konfigurasi melalui insert, tetapi jangan berasumsi semua silinder begitu. Regulator yoke tidak boleh dipaksa ke valve yang tidak sesuai, dan adaptor bukan alasan untuk mengabaikan kondisi sambungan. Jika operator menyediakan adaptor, tanyakan siapa yang memasang dan bagaimana prosedur pemeriksaannya. Bila membawa adaptor sendiri, pastikan itu produk yang tepat untuk arah konversi yang dibutuhkan.',
          'Untuk pemilik regulator DIN yang menyewa silinder yoke, adaptor DIN-ke-yoke dapat menjadi opsi perjalanan. Tambahan itu membuat sistem lebih panjang dan perlu ruang yang cukup di belakang kepala. Masukkan adaptor ke daftar barang, bukan ke daftar asumsi; kehilangan bagian kecil ini dapat membuat regulator pribadi tidak dapat dipakai.',
        ],
        bullets: [
          'Tanyakan jenis valve dan kompatibilitas sebelum perjalanan, bukan saat gear sudah dirakit.',
          'Bawa adaptor hanya untuk kombinasi yang memang telah dikonfirmasi operator.',
          'Simpan O-ring dan penutup debu sesuai rekomendasi produsen, bukan sebagai pengganti servis.',
        ],
      },
      {
        heading: 'Pasang dengan bersih dan berhenti saat ada keraguan',
        paragraphs: [
          'Di hari dive, periksa O-ring pada posisi yang semestinya: bersih, utuh, dan tidak terjepit. Pastikan inlet regulator serta dust cap kering sebelum dipasang. Sejajarkan sambungan tanpa memaksa ulir atau penjepit. Kencangkan dengan tangan sesuai desainnya; alat tambahan atau tenaga berlebihan dapat merusak komponen dan menyamarkan bahwa bagian awalnya tidak lurus.',
          'Buka valve perlahan dan arahkan pressure gauge menjauh dari wajah. Dengarkan aliran udara yang tidak biasa, lalu lakukan pemeriksaan napas primary dan alternate air source bersama buddy. Jika muncul kebocoran yang jelas, O-ring tampak rusak, sambungan tidak duduk sempurna, atau tekanan tidak terbaca normal, tutup valve dan minta bantuan staf. Jangan mencoba “memperbaiki cepat” dengan melumasi, mencongkel, atau membuka regulator.',
          'Stop-use bukan kegagalan perjalanan. Operator mungkin dapat menyediakan silinder, adaptor, atau regulator sewaan yang sesuai. Pilihan itu lebih baik daripada menyelam dengan sambungan yang Anda sendiri tidak yakin. Regulator pribadi memberi konsistensi rasa dan riwayat perawatan, tetapi tidak menggantikan pemeriksaan set lengkap dan buddy system.',
        ],
      },
      {
        heading: 'Pilih dari pola sewa, bukan klaim yang terlalu luas',
        paragraphs: [
          'Jika mayoritas dive Anda memakai silinder yoke yang sudah dikonfirmasi dan perjalanan jarang berubah, regulator yoke dapat menjadi pilihan sederhana. Jika Anda sering bertemu valve DIN atau ingin membawa satu regulator dengan adaptor yang sesuai untuk silinder yoke, DIN mungkin lebih fleksibel bagi pola Anda. Tidak perlu mengubah semua gear hanya karena satu trip menawarkan konfigurasi berbeda.',
          'Perhitungkan juga dukungan servis untuk merek yang dipilih, ketersediaan kit resmi, dan jadwal servis produsen. Koneksi yang cocok hari ini tetap membutuhkan perawatan berkala. Jangan menggunakan ulasan daring atau rekomendasi teman sebagai pengganti manual regulator dan pemeriksaan oleh teknisi yang berwenang.',
          'Sebelum keberangkatan, taruh tiga hal di daftar: konfirmasi valve, adaptor bila diperlukan, dan tanggal servis regulator. Tiga langkah itu memberi keputusan yang dapat diverifikasi tanpa membuat klaim luas tentang tempat mana yang “pasti” memakai satu jenis sambungan.',
        ],
        note: {
          title: 'Jangan paksa kompatibilitas',
          body: 'Sambungan yang tidak cocok, O-ring yang rusak, atau kebocoran saat dibuka adalah alasan untuk berhenti dan meminta solusi dari operator atau teknisi.',
        },
      },
    ],
  },
  {
    slug: 'cara-merawat-peralatan-setelah-menyelam',
    title: 'Cara Merawat Peralatan Setelah Menyelam: Bilas, Keringkan, Simpan',
    excerpt:
      'Urutan setelah menyelam di air laut untuk membuang garam, mengeringkan alat, dan menemukan masalah sebelum penyimpanan.',
    category: 'Scuba',
    coverImageUrl: '/lab/underwater-light.jpg',
    coverImageAlt: 'Cahaya menembus air di sekitar penyelam',
    author,
    readTimeMinutes: 7,
    divingType: 'scuba',
    relatedCategorySlug: null,
    ctaLabel: 'Lihat perlengkapan scuba',
    ctaHref: '/produk?divingType=scuba',
    isFeatured: false,
    isPublished: true,
    sortOrder: 2,
    publishedAt: new Date('2026-06-27T08:00:00+07:00'),
    sources: [
      {
        title: 'Scuba Gear Care: 6 Ways to Make Your Gear Summer Ready',
        publisher: 'SSI',
        url: 'https://www.divessi.com/en/blog/scuba-gear-care-6-ways-to-make-your-gear-summer-ready-8390.html',
      },
      {
        title: 'How to Clean Your Scuba Gear',
        publisher: 'Divernet',
        url: 'https://divernet.com/scuba-gear/how-to-clean-your-scuba-gear/',
      },
      {
        title: 'How to Store Scuba Gear',
        publisher: 'Divernet / DAN Europe',
        url: 'https://divernet.com/scuba-gear/dan-europe-how-to-store-scuba-gear/',
      },
    ],
    content: [
      {
        heading: 'Bilas garam sebelum mengering di sela peralatan',
        paragraphs: [
          'Setelah menyelam di air laut, jangan biarkan peralatan tertutup rapat di tas sampai esok hari bila ada akses air tawar. Sisa garam mudah tertinggal pada tali, ritsleting, buckle, selang, dan katup. Mulai dengan membilas bagian luar BCD, wetsuit, fin, masker, regulator, dan aksesori menggunakan air tawar yang cukup.',
          'Bilas bukan berarti menyemprot secepat mungkin lalu menyimpan alat dalam keadaan basah. Gerakkan buckle, ritsleting, dan bagian yang memang boleh dioperasikan pengguna agar air tawar menjangkau celah. Untuk wetsuit, bilas sisi luar dan dalam. Gunakan pembersih hanya bila manual mengizinkan; bahan rumah tangga yang keras dapat merusak neoprene, silikon, atau lapisan lensa.',
          'Pisahkan barang yang penuh pasir dari barang yang sudah bersih. Pasir pada fin atau boot dapat berpindah ke masker dan mouthpiece di dalam tas. Urutannya sederhana: bilas, periksa, tiriskan, lalu beri ruang agar udara dapat bergerak.',
        ],
      },
      {
        heading: 'Regulator: lindungi inlet dari air',
        paragraphs: [
          'Pastikan penutup inlet (dust cap) kering dan terpasang rapat sebelum membilas first stage. Jangan menekan tombol purge ketika regulator tidak terhubung ke tabung dan tidak bertekanan, kecuali manual merek memberi instruksi lain. Bilas second stage dan selang dari luar dengan lembut, lalu tiriskan.',
          'Jika air masuk ke inlet atau dust cap tidak dapat menutup dengan baik, berhenti di situ dan minta teknisi memeriksanya. Pembilasan oleh pengguna tidak mencakup membuka first stage atau melepas selang untuk membersihkan bagian dalam.',
        ],
      },
      {
        heading: 'BCD: bilas bagian luar dan bladder',
        paragraphs: [
          'Ikuti manual produsen untuk membilas bladder bagian dalam. Banyak model memungkinkan sedikit air tawar dimasukkan lewat inflator, digerakkan perlahan, lalu dikeluarkan melalui katup yang direkomendasikan. Tujuannya membuang residu, bukan membongkar inflator.',
          'Saat membilas bagian luar, periksa dump valve, oral inflator, sambungan selang tekanan rendah, buckle, dan pengikat tabung. BCD yang tidak menahan udara atau tombol yang macet perlu diberi tanda dan diserahkan ke teknisi sebelum dipakai lagi.',
        ],
        bullets: [
          'Regulator: dust cap harus kering sebelum first stage dibilas.',
          'BCD: ikuti manual untuk pembilasan dan pengeringan bladder.',
          'Masker dan fin: bilas air tawar dan jauhkan dari panas matahari langsung.',
        ],
      },
      {
        heading: 'Keringkan sampai udara benar-benar bisa bekerja',
        paragraphs: [
          'Gantung peralatan di tempat teduh dengan sirkulasi udara, bukan di dalam mobil panas atau di bawah matahari langsung berjam-jam. Panas dan UV dapat mempercepat penuaan bahan, sementara tas tertutup yang lembap memberi ruang bagi bau dan jamur. Balik wetsuit setelah sisi pertama cukup kering agar bagian dalam tidak tertinggal lembap. Gunakan hanger yang tidak menekan bahu atau lipatan neoprene secara tajam.',
          'BCD perlu dikeringkan bagian luar dan dalamnya. Simpan sedikit terisi udara bila manual merek menganjurkannya agar bladder tidak saling menempel; jangan menggantungnya dari inflator hose. Untuk regulator, biarkan air keluar dari area yang dibolehkan manual, lalu simpan dengan selang yang tidak ditekuk tajam. Masker sebaiknya masuk kotak hanya ketika lensa dan skirt sudah kering agar silikon tidak menempel atau berjamur.',
          'Cek tiap item saat mengering, bukan setelah seluruhnya masuk gudang. Cari ritsleting yang seret, jahitan lepas, retak pada fin, lensa tergores, dan selang yang terlihat aus. Pemeriksaan visual tidak menggantikan servis berkala, tetapi membantu Anda menjadwalkannya sebelum masalah muncul di lokasi dive.',
        ],
      },
      {
        heading: 'Simpan agar bentuk dan fungsi tetap terjaga',
        paragraphs: [
          'DAN Europe melalui panduan yang dimuat Divernet menekankan penyimpanan gear dalam keadaan bersih dan kering. Pilih tempat sejuk, teduh, dan berventilasi; jauhkan dari bahan kimia, panas berlebih, serta benda berat yang dapat menekan masker atau melipat fin. Hindari menyimpan wetsuit dalam bola padat di dasar tas untuk waktu lama. Lipatan tajam membuat Anda sulit melihat apakah ada kerusakan ketika akan dipakai lagi.',
          'Susun kit berdasarkan bagian yang perlu dicek sebelum trip berikutnya. Simpan regulator dengan dust cap, catatan servis, dan manual di tempat yang mudah ditemukan. Pisahkan pemberat dari masker dan komputer. Jika gear tidak akan dipakai cukup lama, buat pengingat untuk memeriksa kekeringan dan jadwal servis alih-alih menganggap pembilasan hari ini cukup untuk berbulan-bulan.',
          'Beberapa hari sebelum perjalanan berikutnya, buka kembali tas dan periksa apakah masih ada bagian lembap, bau, korosi, atau selang yang berubah. Dengan begitu, alat yang perlu diservis ditemukan saat masih ada waktu—bukan ketika tabung sudah terpasang.',
        ],
        note: {
          title: 'Urutan yang mudah diulang',
          body: 'Bilas air tawar, periksa visual, tiriskan dan keringkan di tempat teduh, lalu simpan bersih serta kering. Serahkan masalah fungsi kepada teknisi.',
        },
      },
    ],
  },
];

const legacySlugs = [
  'checklist-perlengkapan-freediving-pemula',
  'fin-freediving-vs-fin-scuba',
  'snorkeling-vs-freediving-vs-scuba',
];

async function main() {
  const { blogPosts, db } = await import('@/lib/db');

  // Editorial changes are intentionally made directly in PostgreSQL, so the
  // database—not an admin form or ORM hook—owns the modification timestamp.
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION set_blog_posts_updated_at()
    RETURNS trigger AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);
  await db.execute(sql`DROP TRIGGER IF EXISTS blog_posts_updated_at ON blog_posts`);
  await db.execute(sql`
    CREATE TRIGGER blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION set_blog_posts_updated_at()
  `);

  console.log(`Menyiapkan ${posts.length} artikel blog...`);

  for (const post of posts) {
    await db
      .insert(blogPosts)
      .values(post)
      .onConflictDoUpdate({
        target: blogPosts.slug,
        set: {
          title: post.title,
          excerpt: post.excerpt,
          category: post.category,
          coverImageUrl: post.coverImageUrl,
          coverImageAlt: post.coverImageAlt,
          author: post.author,
          readTimeMinutes: post.readTimeMinutes,
          content: post.content,
          sources: post.sources,
          relatedCategorySlug: post.relatedCategorySlug,
          divingType: post.divingType,
          ctaLabel: post.ctaLabel,
          ctaHref: post.ctaHref,
          isFeatured: post.isFeatured,
          isPublished: post.isPublished,
          sortOrder: post.sortOrder,
          publishedAt: post.publishedAt,
          updatedAt: new Date(),
        },
      });

    console.log(`✓ ${post.title}`);
  }

  await db
    .update(blogPosts)
    .set({ isPublished: false, updatedAt: new Date() })
    .where(inArray(blogPosts.slug, legacySlugs));

  console.log('Blog siap. Tiga artikel lama telah diarsipkan.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
