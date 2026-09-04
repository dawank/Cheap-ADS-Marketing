/**
 * Spintax parsing and text generation helper with 4-Layer Architecture & Anti-Ban Jitter
 * Syntax: {option1|option2|option3}
 * Nested syntax supported: {Halo {kak|gan}|Permisi {bos|om}}
 */

export interface SpintaxPreset {
  id?: string;
  name: string;
  category: string;
  description: string;
  template: string;
}

export interface FourLayerSpintax {
  layer1Hook: string;
  layer2Appreciation: string;
  layer3Link: string;
  layer4Closing: string;
}

export function parseSpintax(text: string): string {
  if (!text) return '';
  
  const regex = /\{([^{}]+)\}/g;
  let matches: RegExpExecArray | null;
  let iterations = 0;
  
  // Recursively resolve inner spins until no braces remain (max 50 passes to prevent loops)
  while ((matches = regex.exec(text)) !== null && iterations < 50) {
    iterations++;
    const fullMatch = matches[0];
    const inner = matches[1];

    // Jangan ubah tag placeholder {LINK} atau {link}
    if (inner.trim().toUpperCase() === 'LINK') {
      continue;
    }

    const options = inner.split('|');
    const chosen = options[Math.floor(Math.random() * options.length)];
    text = text.replace(fullMatch, chosen);
    regex.lastIndex = 0; // reset regex for next pass
  }
  
  return text;
}

/**
 * Punctuation & Emoji Jitter Engine:
 * Memastikan hash karakter dan struktur teks selalu 100% unik di mata filter AI Facebook
 * dengan menyisipkan variasi tanda baca, zero-width spaces (\u200B), dan emoji acak.
 */
export function applyEmojiAndPunctuationJitter(
  text: string, 
  options: { punctuation?: boolean; emoji?: boolean } = { punctuation: true, emoji: true }
): string {
  if (!text) return text;
  let result = text;

  // 1. Emoji Jitter (Tambahkan atau acak emoji pelengkap)
  if (options.emoji) {
    const subtleEmojis = ['✨', '👍', '🙏', '🙌', '💡', '🔥', '🚀', '💯', '😊', '⭐', '🤝', '👌', '⚡'];
    const chosenEmoji = subtleEmojis[Math.floor(Math.random() * subtleEmojis.length)];
    // Sisipkan secara halus di akhir atau sebelum link
    if (Math.random() > 0.4 && !result.includes(chosenEmoji)) {
      result = `${result} ${chosenEmoji}`;
    }
  }

  // 2. Punctuation Jitter
  if (options.punctuation) {
    const punctVariants = ['.', '..', '!', ' ya.', ' yaa!', ' ya gan.', ' ya kak.'];
    const randomPunct = punctVariants[Math.floor(Math.random() * punctVariants.length)];
    result = result.replace(/([.!])$/, randomPunct);

    // Sisipkan 1-2 zero-width spaces tak kasat mata di jeda kata acak untuk merusak hash SHA256 bot FB
    const words = result.split(' ');
    if (words.length > 3) {
      const targetIdx = Math.floor(Math.random() * (words.length - 2)) + 1;
      words[targetIdx] = words[targetIdx] + '\u200B';
      result = words.join(' ');
    }
  }

  return result.replace(/[ \t]{2,}/g, ' ').trim();
}

/**
 * Format teks komentar dengan link promosi secara aman
 */
export function formatCommentWithLink(template: string, link: string, jitter: boolean = true): string {
  if (!template) return link || '';
  const cleanLink = (link || '').trim();

  // 1. Ganti variasi placeholder {LINK}, [LINK], {link}, [link]
  let text = template.replace(/\{LINK\}|\{link\}|\[LINK\]|\[link\]/gi, ` ${cleanLink} `);

  // 2. Ganti placeholder kata "LINK" jika user mengetik tanpa kurung kurawal
  text = text.replace(/:\s*LINK\b/gi, `: ${cleanLink} `);
  text = text.replace(/(\bdi\b|\bke\b)\s+LINK\b/gi, `$1 ${cleanLink} `);
  text = text.replace(/\bLINK\b/g, ` ${cleanLink} `);

  // 3. Jalankan pemrosesan Spintax
  text = parseSpintax(text);

  // 4. Jaga-jaga jika di dalam cabang spintax masih ada tag LINK yang tersisa
  text = text.replace(/\{LINK\}|\{link\}|\[LINK\]|\[link\]/gi, ` ${cleanLink} `);
  text = text.replace(/:\s*LINK\b/gi, `: ${cleanLink} `);
  text = text.replace(/\bLINK\b/g, ` ${cleanLink} `);

  // 5. Normalisasi spasi berlebih
  text = text.replace(/[ \t]{2,}/g, ' ').trim();

  // 6. Jika template tidak memiliki placeholder LINK sama sekali, sisipkan di akhir
  if (cleanLink && !text.includes(cleanLink)) {
    text = `${text} 👉 ${cleanLink}`;
  }

  if (jitter) {
    text = applyEmojiAndPunctuationJitter(text);
  }

  return text;
}

/**
 * Format teks komentar ALAMI TANPA LINK untuk Tahap 1 Mode Siluman
 */
export function formatCommentWithoutLink(template: string): string {
  if (!template) return 'Rekomendasi yang sangat bagus kak, terima kasih infonya!';

  let text = template;
  text = text.replace(/:\s*(\{LINK\}|\{link\}|\[LINK\]|\[link\]|\bLINK\b)/gi, ' info lengkapnya ya');
  text = text.replace(/(\bdi\b|\bke\b)\s+(\{LINK\}|\{link\}|\[LINK\]|\[link\]|\bLINK\b)/gi, '$1 infonya ya');
  text = text.replace(/\{LINK\}|\{link\}|\[LINK\]|\[link\]/gi, 'rekomendasinya');
  text = text.replace(/\bLINK\b/g, 'rekomendasinya');

  text = parseSpintax(text);

  text = text.replace(/\{LINK\}|\{link\}|\[LINK\]|\[link\]/gi, '');
  text = text.replace(/\bLINK\b/g, '');
  text = text.replace(/:\s*$/g, '.');
  text = text.replace(/:\s*([,.-])/g, '$1');
  text = text.replace(/[ \t]{2,}/g, ' ').trim();

  return text || 'Rekomendasi yang sangat bagus kak, terima kasih infonya!';
}

export function generateSpintaxVariations(template: string, count = 5): string[] {
  const results = new Set<string>();
  for (let i = 0; i < count * 4; i++) {
    results.add(parseSpintax(template));
    if (results.size >= count) break;
  }
  return Array.from(results);
}

// ============================================================================
// STRUKTUR SPINTAX 4-LAYER (JUTAAN KOMBINASI ACIS & UNIK)
// Layer 1: Sapaan & Hook (Greetings, Attention Grabbers, Questions)
// Layer 2: Kalimat Apresiasi / Relevansi (Content validation, personal empathy)
// Layer 3: Rekomendasi Link Promosi (Affiliate, product suggestion with {LINK})
// Layer 4: Penutup & Doa Sopan (Gratitude, blessings, courteous closing)
// ============================================================================

export const LAYER_1_HOOKS: string[] = [
  '{{Halo|Hai|Permisi|Assalamualaikum|Selamat {pagi|siang|sore|malam}}|Salam hangat} {semuanya|rekan-rekan|teman-teman|sahabat Facebook|kakak-kakak},',
  '{Wah menarik banget|Bagus sekali|Keren nih pembahasannya|Izin mampir sebentar ya} {kak|gan|om|bang|rekan grup},',
  '{Bismillah,|Izin ikut nimbrung|Mau berbagi info menarik nih|Ada yang lagi butuh rekomendasi?} {kawan-kawan|sahabat semua|teman-teman grup},',
  '{Sore {kak|om|gan}|Siang semuanya|Pagi kawan-kawan}, {kebetulan banget pas lagi baca postingan ini|izin tinggalkan jejak ya|salam kenal semuanya},',
  '{Halo sahabat FB|Hai rekan-rekan grup {yang baik hati|semuanya}|Permisi bapak ibu}, {izin sharing solusi praktis ya|semoga harinya menyenangkan},',
  '{Wah tepat banget ketemu postingan ini|Izin ikut sharing sebentar ya {kak|gan}|Salam silaturahmi buat rekan-rekan di grup},',
  '{Hai hai semuanya!|Halo kawan-kawan pejuang|Izin share info bermanfaat ya rekan},',
  '{Setuju banget sama diskusinya|Wah topik ini selalu ramai dan bermanfaat|Izin menyimak sekaligus berbagi},'
];

export const LAYER_2_APPRECIATIONS: string[] = [
  '{Keren banget pembahasannya, sangat relate sama kebutuhan sehari-hari|Bermanfaat banget postingannya, nambah wawasan baru|Topik yang sangat menarik dan banyak yang mencari infonya}.',
  '{Senang rasanya bisa saling berbagi referensi positif di grup ini|Apresiasi buat yang sudah posting, pembahasannya daging banget|Senang lihat komunitas di grup ini selalu aktif dan positif}.',
  '{Kemarin saya pribadi juga sempat cari-cari referensi yang serupa dan terpercaya|Pengalaman pribadi sempat bingung cari opsi yang kualitasnya terbukti bagus|Banyak teman-teman yang tanya juga rekomendasi terbaik yang hemat dan terpercaya}.',
  '{Memang urusan seperti ini harus cermat pilih yang benar-benar original dan bergaransi|Penting banget untuk dapat opsi yang amanah dan pelayanannya cepat|Setelah coba bandingkan beberapa pilihan, akhirnya nemu yang paling pas di kantong}.',
  '{Setuju banget, kualitas dan kepuasan pembeli tetap nomor satu|Bagus sekali bisa saling mengingatkan dan berbagi solusi bermanfaat di grup ini}.',
  '{Alhamdulillah kemarin nemu opsi yang sangat memuaskan dan hasilnya nyata banget|Ternyata solusinya simpel dan nggak bikin kantong jebol kalau tahu tempatnya}.'
];

export const LAYER_3_LINKS: string[] = [
  '{Buat rekan-rekan yang mau cek info lengkap atau katalognya bisa langsung mampir ke sini ya|Detail produk dan promo menariknya bisa dilihat di sini|Siapa tahu butuh solusi yang sama, langsung intip detailnya}: {LINK}',
  '{Bagi yang tertarik pesan atau klaim vouchernya mumpung ready stock|Cek etalase resminya untuk dapatkan diskon spesial hari ini}: {LINK}',
  '{Bisa langsung kepoin ulasan pembeli dan detail produknya di tautan resmi ini|Untuk info lebih jelas dan pemesanan aman langsung klik}: {LINK}',
  '{Kebetulan lagi ada flash sale potongan harga spesial di toko resminya|Cek promo gratis ongkir dan ulasan aslinya di sini}: {LINK}',
  '{Langsung klik link ini buat lihat varian lengkap dan cara pemesanannya ya|Biar nggak penasaran, langsung cek toko resminya di}: {LINK}',
  '{Rekomendasi terbaik yang sudah banyak ulasan positifnya ada di sini|Solusi praktis dan hemat bisa rekan-rekan akses langsung di}: {LINK}'
];

export const LAYER_4_CLOSINGS: string[] = [
  '{Semoga informasinya bermanfaat ya!|Terima kasih banyak admin & rekan-rekan grup yang baik hati|Semoga rezeki kita semua makin lancar dan berkah}. {🙏|✨|😊}',
  '{Sukses dan sehat selalu buat kita semua.|Matur nuwun sanget atas kesempatannya.|Aamiin ya rabbal alamin, berkah melimpah!} {👍|🤲|❤️}',
  '{Mohon maaf jika ada salah kata, sukses selalu usahanya.|Semoga harinya selalu dipenuhi kelancaran rezeki.|Salam sukses dan kompak selalu!} {🚀|💯|✨}',
  '{Terima kasih sudah membaca, semoga harimu menyenangkan.|Izin pamit dan terima kasih atas ruang diskusinya.|Sehat selalu sahabat!} {🙌|🤝|🌟}',
  '{Semoga bermanfaat buat keluarga dan rekan-rekan semua.|Tetap semangat dan salam kenal dari saya ya!|Berkah untuk admin dan seluruh anggota grup.} {🙏|💐|🎉}'
];

/**
 * Meracik Spintax 4-Layer secara otomatis menghasilkan template utuh
 */
export function build4LayerSpintaxTemplate(
  layer1: string = LAYER_1_HOOKS[0],
  layer2: string = LAYER_2_APPRECIATIONS[0],
  layer3: string = LAYER_3_LINKS[0],
  layer4: string = LAYER_4_CLOSINGS[0]
): string {
  return `${layer1}\n${layer2}\n${layer3}\n${layer4}`;
}

/**
 * Menghasilkan satu teks komentar acak yang diambil dari generator 4-layer
 */
export function generateRandom4LayerComment(linkUrl: string = ''): string {
  const l1 = LAYER_1_HOOKS[Math.floor(Math.random() * LAYER_1_HOOKS.length)];
  const l2 = LAYER_2_APPRECIATIONS[Math.floor(Math.random() * LAYER_2_APPRECIATIONS.length)];
  const l3 = LAYER_3_LINKS[Math.floor(Math.random() * LAYER_3_LINKS.length)];
  const l4 = LAYER_4_CLOSINGS[Math.floor(Math.random() * LAYER_4_CLOSINGS.length)];

  const fullTemplate = `${l1} ${l2} ${l3} ${l4}`;
  return formatCommentWithLink(fullTemplate, linkUrl, true);
}

// ============================================================================
// KOLEKSI 50+ PRESET SPINTAX SUPER KAYA BERBAGAI KATEGORI (ANTI-BAN READY)
// ============================================================================

export const SPINTAX_PRESETS: SpintaxPreset[] = [
  // 1-5: Sapaan & Apresiasi Netizen (High Engagement)
  {
    name: '01. Sapaan Ramah & Pembuka (Greetings)',
    category: 'Sapaan',
    description: 'Sapaan santun pembuka dengan variasi waktu dan panggilan akrab komunitas Facebook.',
    template: '{{Halo|Hai|Permisi|Assalamualaikum|Selamat {pagi|siang|sore|malam}}|Salam kenal} {semuanya|rekan-rekan|teman-teman|sahabat Facebook|para juragan|kakak-kakak}, {izin {berbagi info|lewat sebentar|buka lapak}|semoga harinya menyenangkan ya} {🙏|✨|😊}',
  },
  {
    name: '02. Komentar Organik & Apresiasi Netizen',
    category: 'Organik',
    description: 'Komentar bernada natural untuk menaikkan interaksi tanpa terkesan seperti promosi bot.',
    template: '{{Wah keren banget|Sangat bermanfaat|Mantap sekali|Setuju banget sama} {postingan|pembahasan|ulasan|sharing} ini {kak|gan|om|bang}! {Izin {nyimak|tinggalkan jejak|tambah referensi}|Semoga makin sukses ya}. {Kalau butuh info tambahan terkait topik ini bisa cek|Siapa tahu butuh solusi serupa bisa intip}: {LINK} {👍|🚀|💡}',
  },
  {
    name: '03. Pancingan Diskusi & Tanya Jawab Komunitas',
    category: 'Diskusi',
    description: 'Pertanyaan pancingan agar audiens terpancing berkomentar dan memicu algoritma FB.',
    template: '{Mau tanya dong rekan-rekan|Kira-kira ada yang punya pengalaman serupa gak ya|Menurut teman-teman di grup ini gimana}? {Kira-kira {lebih bagus|lebih rekomen} opsi A atau B|Ada solusi terbaik gak ya}? {Bagi yang mau sharing atau cek info lengkapnya boleh mampir ke|Diskusi lebih lanjut juga ada di}: {LINK} {🤔|💬|✨}',
  },
  {
    name: '04. Validasi Masalah & Rekomendasi Solutif',
    category: 'Solusi',
    description: 'Menanggapi keluhan audiens dengan rekomendasi yang tampak tulus membantu.',
    template: '{Benar banget apa yang dibahas di postingan ini|Sering banget ngalamin masalah yang sama persis|Memang kalau belum tahu solusinya bikin pusing ya}. {Untung sekarang sudah ada alternatif yang jauh lebih simpel|Alhamdulillah setelah nemu solusi ini jadi lebih tenang}. {Bagi yang mau coba juga bisa langsung cek detailnya}: {LINK} {🙌|💡}',
  },
  {
    name: '05. Curhat Pengalaman Nyata & Storytelling',
    category: 'Storytelling',
    description: 'Pendekatan humanis bercerita hasil memuaskan setelah menggunakan produk.',
    template: '{Awalnya sempat skeptis dan coba berbagai cara|Jujur pertama kali coba sempat ragu apakah worth it|Dari kemarin banyak teman kantor yang nanyain}. {Ternyata hasilnya beneran di luar ekspektasi dan sangat membantu|Kualitasnya top markotop dan nggak mengecewakan sama sekali}. {Coba cek sendiri ulasan dan etalasenya di}: {LINK} {⭐|💯|🔥}',
  },

  // 6-10: Jual Beli, Flash Sale & Marketplace
  {
    name: '06. Hard Selling & Flash Sale Diskon Terbatas',
    category: 'Jual Beli',
    description: 'Promosi to-the-point dengan penawaran diskon terbatas dan dorongan beli cepat.',
    template: '🔥 {PROMO SPESIAL|CUCI GUDANG|FLASH SALE HARI INI|DISKON BESAR-BESARAN}! {Dapatkan harga termurah|Hemat hingga {30%|50%|70%}|Stok sangat terbatas} hanya untuk {hari ini|minggu ini|pembeli tercepat}. {Jangan sampai kehabisan|Buruan amankan slot Anda}! Langsung cek di sini: {LINK} atau hubungi WA: {WA} {🛒|⚡|💥}',
  },
  {
    name: '07. Toko Marketplace Shopee / Tokped / TikTok',
    category: 'E-Commerce',
    description: 'Mengarahkan pembeli ke marketplace resmi dengan voucher gratis ongkir dan COD.',
    template: '🛍️ {Ready Stock Siap Kirim|Bisa COD Bayar di Tempat|Garansi 100% Original}! {Beli lebih aman dan dapatkan voucher gratis ongkir|Klaim cashback spesial hari ini} di toko resmi kami. {Langsung klik link etalase|Cek detail produk & ulasan pembeli}: {LINK} {📦|🚚|🎉}',
  },
  {
    name: '08. Promo Gajian & Payday Sale Mantap',
    category: 'Jual Beli',
    description: 'Memanfaatkan momentum gajian dengan penawaran bundle hemat.',
    template: '🎉 {PAYDAY SALE SPESIAL GAJIAN|PROMO AKHIR BULAN HEMAT|WAKTUNYA REWARD DIRI SENDIRI}! {Beli 1 gratis 1 atau diskon gila-gilaan|Banyak voucher gratis ongkir tanpa minimal belanja}. {Yuk manfaatkan promo selagi kuota masih ada}: {LINK} {💳|🎁|🛍️}',
  },
  {
    name: '09. Cuci Gudang & Clearance Sale Habiskan Stok',
    category: 'Jual Beli',
    description: 'Menimbulkan FOMO dengan clearance sale sisa kuota gudang.',
    template: '⚠️ {CUCI GUDANG BESAR-BESARAN|HABISKAN STOK GUDANG|HARGA MODAL DILEPAS}! {Barang baru kualitas terjamin|Sisa beberapa pcs saja siapa cepat dia dapat}. {Amankan sebelum keduluan yang lain}: {LINK} {📦|🏃‍♂️|⚡}',
  },
  {
    name: '10. Paket Bundling Hemat & Ekstra Hadiah',
    category: 'Jual Beli',
    description: 'Penawaran paket hemat lebih dari 1 barang plus free bonus.',
    template: '🎁 {PAKET BUNDLE SUPER HEMAT|BELI LEBIH BANYAK LEBIH UNTUNG|BONUS SPESIAL BULAN INI}! {Sudah termasuk free gift menarik|Ongkir bersubsidi ke seluruh wilayah}. {Cek varian bundle pilihanmu sekarang}: {LINK} {✨|📦|👍}',
  },

  // 11-15: Gaya Kasual Netizen & Gaul FB
  {
    name: '11. Gaya Kasual Netizen (Santai & Lucu)',
    category: 'Netizen',
    description: 'Bahasa santai tongkrongan FB yang akrab dan tidak kaku.',
    template: '{Wkwkwk relate parah sama postingan ini|Gak nyangka nemu ginian di beranda|Auto ngangguk-ngangguk pas baca}. {Btw yang lagi nyari racun produk viral yang beneran mantul bisa intip|Buat yang nanya-nanya belinya di mana, spill linknya di sini}: {LINK} {🤣|✌️|🔥}',
  },
  {
    name: '12. Spill Racun Belanjaan Viral TikTok / FB',
    category: 'Netizen',
    description: 'Pola spill racun belanjaan yang disukai netizen masa kini.',
    template: '👀 {Izin spill racun yang lagi viral banget|Kemarin FYP terus akhirnya ikutan beli|Racun belanjaan yang beneran worth the hype nih}! {Harganya receh tapi fungsinya juara banget|Udah dipake seminggu dan gak nyesel sama sekali}. {Spill link tokonya di sini ya}: {LINK} {🛒|😍|✨}',
  },
  {
    name: '13. Solusi Dompet Tipis Kualitas Artis',
    category: 'Netizen',
    description: 'Bahasa humoris penawaran barang mewah dengan harga sangat ramah kantong.',
    template: '{Solusi tampil keren saat dompet lagi kritis|Gak perlu mahal-mahal kalau yang terjangkau aja kualitasnya sebagus ini|Definisi harga kaki lima kualitas bintang lima}. {Langsung serbu sebelum harga naik lagi}: {LINK} {😎|💸|👍}',
  },
  {
    name: '14. Izin Numpang Lapak Santai Netizen',
    category: 'Netizen',
    description: 'Permisi yang sopan tapi tidak kaku di sela-sela postingan ramai.',
    template: '{Izin nyempil di postingan ramai ya agan-agan|Izin gelar tiker sebentar sambil pantau diskusi seru|Numpang gelar lapak kecil-kecilan ya masbro}. {Siapa tahu ada yang lagi cari keperluan harian terpercaya}: {LINK} {🙏|☕|🚬}',
  },
  {
    name: '15. Anti Ribet Club (Solusi Instan)',
    category: 'Netizen',
    description: 'Penyampaian untuk audiens yang suka kepraktisan dan hasil instan.',
    template: '{Buat kalian yang masuk tim anti-ribet|Gak usah pusing muter-muter cari yang belum jelas|Ini opsi paling simpel dan praktis yang pernah dicoba}. {Tinggal klik langsung sampai rumah}: {LINK} {⚡|👌|🏠}',
  },

  // 16-20: Sopan, Santun & Syariah / Islami
  {
    name: '16. Pembuka Islami & Doa Rezeki Berkah',
    category: 'Syariah',
    description: 'Penuh doa keberkahan, etika silaturahmi yang menyejukkan hati.',
    template: 'Bismillahir rahmanir rahim. {Assalamualaikum warahmatullahi wabarakatuh|Salam silaturahmi buat sahabat beriman sekalian}. {Semoga Allah SWT selalu melimpahkan kesehatan dan kelapangan rezeki untuk kita semua}. {Izin ikhtiar menjemput rezeki halal, barangkali ada yang berkenan atau membutuhkan}: {LINK} {Jazakumullah khairan katsiran|Matur nuwun sanget}. {🤲|🙏|✨}',
  },
  {
    name: '17. Perniagaan Amanah & Jujur Tanpa Riba',
    category: 'Syariah',
    description: 'Menonjolkan komitmen kejujuran, kehalalan dan transaksi tanpa tipu-tipu.',
    template: '{Mencari keberkahan dalam setiap transaksi|Insya Allah amanah dan transparan 100%|Jual beli halal berkah untuk keluarga}. {Kualitas barang terjamin sesuai deskripsi foto}. {Katalog lengkap dan pemesanan}: {LINK} {Alhamdulillah, terima kasih sahabat}. {🤲|🌿|⭐}',
  },
  {
    name: '18. Doa Pembuka Usaha & Usaha Lancar',
    category: 'Syariah',
    description: 'Mendoakan sesama anggota grup agar usaha dan pekerjaan mereka sukses.',
    template: '{Semoga hari ini pintu rezeki terbuka lebar untuk admin dan rekan-rekan grup semua}. {Izin berbagi info kebaikan dan kebutuhan harian keluarga}. {Bisa ditinjau langsung di etalase kami}: {LINK}. {Semoga menjadi wasilah kebaikan bersama.} {🤲|🙏}',
  },
  {
    name: '19. Produk Herbal & Thibbun Nabawi Alami',
    category: 'Syariah',
    description: 'Khusus produk kesehatan alami, madu, habbatussauda, atau minyak herbal.',
    template: '🌿 {IKHTIAR SEHAT DENGAN BAHAN ALAMI|HERBAL BERKUALITAS 100% MURNI|SOLUSI KESEHATAN KELUARGA SUNNAH}. {Tanpa bahan kimia berbahaya, aman dikonsumsi jangka panjang}. {Cek khasiat dan testimoni konsumen}: {LINK} {Sehat selalu untuk kita sekeluarga.} {🤲|🌱}',
  },
  {
    name: '20. Busana Muslim, Gamis & Perlengkapan Ibadah',
    category: 'Fashion',
    description: 'Promosi gamis syari, koko, mukena, sajadah dengan bahan adem nyaman.',
    template: '✨ {BUSANA MUSLIM & PERLENGKAPAN IBADAH PREMIUM|GAMIS / KOKO ELEGAN BAHAN ADEM}! {Jahitan rapi kualitas butik, bahan jatuh dan nyaman dipakai seharian}. {Bisa COD & promo potongan harga}: {LINK} {Makin nyaman beribadah.} {🧕|🕌|✨}',
  },

  // 21-25: Gadget, Elektronik & Komputer
  {
    name: '21. Jual Beli Gadget & Smartphone Second/Baru',
    category: 'Gadget',
    description: 'Format jual beli HP dengan jaminan nominuss dan kelengkapan.',
    template: '📱 {DIJUAL|WTS|READY STOCK} {Smartphone / Gadget Berkualitas}! Kondisi {mulus seperti baru 98%|normal 100% no minus|nominus siap pakai garansi panjang}, kelengkapan {fullset original|lengkap dusbook|siap pakai}. {Bisa COD area terdekat atau rekber marketplace aman}. {Cek spek & harga nett}: {LINK} atau WA: {WA} {🔋|✨|🤝}',
  },
  {
    name: '22. Laptop, PC Gaming & Aksesoris Komputer',
    category: 'Gadget',
    description: 'Promosi laptop kerja/kuliah, part PC, dan periferal.',
    template: '💻 {LAPTOP KERJA / KULIAH / GAMING SIAP TEMPUR|READY UNIT MULUS BERGARANSI}! {Baterai awet, SSD kencang, boot hitungan detik, performa lancar tanpa kendala}. {Gratis install software dasar siap pakai}. {Detail spek dan harga spesial}: {LINK} {⚡|🖥️|🎮}',
  },
  {
    name: '23. Aksesoris HP (TWS, Fast Charger, Casing)',
    category: 'Gadget',
    description: 'Aksesoris handphone harian dengan harga bersahabat dan kualitas mantap.',
    template: '🎧 {AKSESORIS HP TERLARIS|TWS BASS NENDANG & FAST CHARGING ORIGINAL}! {Suara jernih tahan berjam-jam, charger dingin dan aman untuk baterai}. {Diskon cuci gudang hari ini}: {LINK} {🔋|🎶|📦}',
  },
  {
    name: '24. Servis HP / Laptop / Konsultasi Hardware',
    category: 'Jasa',
    description: 'Menawarkan jasa servis reparasi perangkat elektronik.',
    template: '🔧 {JASA SERVIS HP / LAPTOP BERGARANSI|KONSULTASI GRATIS TANYA RUSAK}! {Atasi mati total, ganti LCD, batre kembung, upgrade SSD, instal ulang}. {Bisa ditunggu atau dipanggil ke rumah}. {Hubungi kami}: {WA} atau {LINK} {🛠️|💻}',
  },
  {
    name: '25. Smart Watch & Gadget Penunjang Produktivitas',
    category: 'Gadget',
    description: 'Jam tangan pintar dan perlengkapan olahraga modern.',
    template: '⌚ {SMARTWATCH TAMPILAN MEWAH FITUR LENGKAP|MONITOR KESEHATAN & NOTIF HP}! {Bisa terima telepon, detak jantung, water resistant, baterai tahan seminggu}. {Klaim diskon khusus pembeli hari ini}: {LINK} {🏃‍♂️|✨|🎁}',
  },

  // 26-30: Kuliner, Makanan & Minuman Viral
  {
    name: '26. Kuliner Enak & Camilan Viral Bikin Nagih',
    category: 'Kuliner',
    description: 'Promosi makanan ringan, frozen food viral, atau snack gurih lezat.',
    template: '🍲 {PENCINTA KULINER WAJIB COBA|SNACK / FROZEN FOOD VIRAL BIKIN NAGIH}! Rasa {dijamin nagih dan bikin kangen|gurih pedas nikmat bumbu meresap|100% Halal & higienis}. {Melayani pesanan partai/acara|Siap kirim aman sampai luar kota}. {Order sekarang sebelum kehabisan}: {LINK} {😋|🤤|🍱}',
  },
  {
    name: '27. Katering Harian, Tumpeng & Nasi Kotak Acara',
    category: 'Kuliner',
    description: 'Jasa catering untuk syukuran, arisan, kantor atau makan siang.',
    template: '🍱 {CATERING HARIAN / NASI BOX ACARA SYUKURAN|MENU LENGKAP RASA JUARA}! {Menu bervariasi setiap hari, higienis, porsi pas, harga terjangkau}. {Gratis ongkir untuk pemesanan rutin kantor/keluarga}. {Cek daftar menu & pricelist}: {LINK} / WA: {WA} {🍛|🎉|👨‍🍳}',
  },
  {
    name: '28. Kopi Nusantara, Bubuk Kopi & Minuman Segar',
    category: 'Kuliner',
    description: 'Promosi biji kopi arabika/robusta pilihan atau minuman botol.',
    template: '☕ {BIJI / BUBUK KOPI ASLI NUSANTARA|AROMA WANGI ROASTING FRESH}! {Pilihan tepat buat nemenin kerja dan santai pagi hari}. {Tanpa pengawet dan perasa buatan, rasa mantap}. {Beli fresh roasted coffee di}: {LINK} {☕|🌿|✨}',
  },
  {
    name: '29. Oleh-Oleh Khas Daerah & Makanan Tradisional',
    category: 'Kuliner',
    description: 'Makanan khas daerah yang bisa dikirim ke seluruh nusantara.',
    template: '🎁 {OLEH-OLEH KHAS DAERAH ASLI & FRESH|RASA AUTENTIK NIKMAT}! {Kemasan vacuum kedap udara, tahan perjalanan jauh}. {Cocok buat hadiah keluarga atau stok di rumah}. {Pesan langsung di sini}: {LINK} {📦|🥘|🍪}',
  },
  {
    name: '30. Sambal Rumahan Bikin Nafsu Makan Nambah',
    category: 'Kuliner',
    description: 'Sambal botolan pedas nagih dengan berbagai varian cumi/teri/bawang.',
    template: '🌶️ {SAMBAL RUMAHAN JUARA PEDASNYA BIKIN KERINGETAN|VARIAN CUMI / BAWANG / TERI}! {Bikin nasi sepiring gak bakalan cukup, lauknya melimpah}. {Tanpa bahan pengawet kimia, 100% Halal}. {Cobain kenikmatannya sekarang}: {LINK} {🔥|🍚|🤤}',
  },

  // 31-35: Fashion, Sepatu & Pakaian
  {
    name: '31. Sepatu Sneakers Pria & Wanita Keren',
    category: 'Fashion',
    description: 'Sneakers kasual kekinian bahan nyaman dipakai seharian.',
    template: '👟 {SNEAKERS KEKINIAN TAMPIL KEREN & NYAMAN DIPAKAI|KUALITAS PREMIUM SOL EMPUK}! {Desain stylish cocok untuk kuliah, kerja, maupun hangout santai}. {Bisa bayar COD & tukar size jika tidak pas}. {Lihat katalog ukuran & warna}: {LINK} {🚶‍♂️|🔥|✨}',
  },
  {
    name: '32. Kaos Polos / Distro Katun Combed Tebal Adem',
    category: 'Fashion',
    description: 'Pakaian pria basic bahan 100% cotton combed nyaman anti gerah.',
    template: '👕 {KAOS DISTRO / BASIC 100% COTTON COMBED|BAHAN TEBAL ADEM MENYERAP KERINGAT}! {Jahitan rantai standar distro, sablon awet tidak mudah pecah}. {Pilihan warna lengkap dari size S sampai 3XL}. {Beli paket bundle hemat di}: {LINK} {🕶️|🛍️|👌}',
  },
  {
    name: '33. Tas Wanita Elegan & Dompet Multifungsi',
    category: 'Fashion',
    description: 'Tas selempang, tote bag, atau ransel wanita model mewah harga bersahabat.',
    template: '👜 {TAS SELEMPANG / TOTE BAG WANITA ELEGAN|DESAIN MEWAH HARGA BERSAHABAT}! {Muat banyak barang, bahan kulit sintetis tebal tidak mudah mengelupas}. {Lengkapi OOTD harianmu sekarang}: {LINK} {👠|🌸|✨}',
  },
  {
    name: '34. Celana Jeans & Chino Pria Nyaman Melar',
    category: 'Fashion',
    description: 'Celana panjang harian bahan melar nyaman beraktivitas.',
    template: '👖 {CELANA JEANS / CHINO PRIA SLIMFIT STRETCH|BAHAN MELAR NYAMAN TIDAK KAKU}! {Cocok untuk acara formal maupun santai sehari-hari}. {Warna tidak mudah luntur setelah dicuci}. {Cek panduan ukuran & warna}: {LINK} {💼|👌}',
  },
  {
    name: '35. Jaket Hoodie / Windbreaker Tahan Angin',
    category: 'Fashion',
    description: 'Jaket riding motor atau outdoor tahan cuaca dingin.',
    template: '🧥 {JAKET HOODIE / WINDBREAKER TAHAN ANGIN & GERIMIS|NYAMAN BUAT MOTORAN}! {Bahan tebal furing lembut, melindungi tubuh dari angin malam}. {Ready berbagai ukuran dan warna}: {LINK} {🏍️|❄️|🔥}',
  },

  // 36-40: Skincare, Kecantikan & Kesehatan
  {
    name: '36. Paket Skincare Wajah Glowing BPOM Aman',
    category: 'Kecantikan',
    description: 'Perawatan wajah mengatasi flek, jerawat, dan kusam ber-BPOM.',
    template: '✨ {RAHASIA WAJAH GLOWING BERSIH BEBAS JERAWAT|PAKET SKINCARE BPOM 100% AMAN}! {Atasi kulit kusam, flek hitam, dan bekas jerawat membandel}. {Cocok untuk semua jenis kulit pria & wanita}. {Cek testimoni sebelum & sesudah}: {LINK} {🌸|🧖‍♀️|💆‍♂️}',
  },
  {
    name: '37. Parfum Tahan Lama Aroma Mewah Berkelas',
    category: 'Kecantikan',
    description: 'Minyak wangi bibit mewah wangi seharian memikat lawan bicara.',
    template: '🌸 {PARFUM WANGI MEWAH TAHAN HINGGA 12 JAM|AROMA ELEGAN DISUKAI BANYAK ORANG}! {Tidak meninggalkan noda di baju, non alkohol aman dipakai salat}. {Spesial promo beli 1 dapat 2}: {LINK} {💨|✨|❤️}',
  },
  {
    name: '38. Vitamin & Suplemen Daya Tahan Tubuh',
    category: 'Kesehatan',
    description: 'Menjaga stamina tubuh agar tidak mudah lelah beraktivitas.',
    template: '💪 {JAGA DAYA TAHAN TUBUH & STAMINA TETAP FIT|SUPLEMEN HERBAL ALAMI KELUARGA}! {Membantu meningkatkan energi dan menjaga kebugaran tubuh harian}. {Original terdaftar resmi}: {LINK} {🏃‍♀️|🌿|☀️}',
  },
  {
    name: '39. Perawatan Rambut Rontok & Penumbuh Alami',
    category: 'Kecantikan',
    description: 'Minyak kemiri atau tonic penumbuh rambut dan anti ketombe.',
    template: '💇‍♀️ {SOLUSI RAMBUT RONTOK & KETOMBE MEMBANDEL|PENUMBUH RAMBUT ALAMI AMAN}! {Rambut lebih tebal, kuat, dan berkilau alami tanpa lepek}. {Sudah banyak yang buktikan hasilnya}: {LINK} {🌿|💆‍♀️|✨}',
  },
  {
    name: '40. Pelangsing Tubuh & Detoksifikasi Alami',
    category: 'Kesehatan',
    description: 'Teh celup detoks melancarkan pencernaan dan menurunkan lingkar perut.',
    template: '🍵 {TEH DETOKS ALAMI BIKIN PERUT BEGAH JADI RAMPING|LANCARKAN BAB TANPA MULES}! {Membantu membuang racun dan lemak berlebih secara alami}. {Rasanya enak dan tidak pahit}: {LINK} {🍃|⚖️|🙌}',
  },

  // 41-45: Bisnis, Peluang Usaha & Lowongan
  {
    name: '41. Kemitraan Reseller & Dropshipper Modal Minim',
    category: 'Bisnis',
    description: 'Merekrut reseller dari rumah tanpa stok barang.',
    template: '💼 {DIBUKA KEMITRAAN BARU|PELUANG BISNIS DARI RUMAH|DICARI RESELLER & DROPSHIPPER}! {Modal kecil bahkan bisa tanpa modal|Dibimbing dari nol sampai menghasilkan|Bahan postingan sudah disiapkan}. {Margin keuntungan tebal & repeat order tinggi}. {Info pendaftaran & bimbingan gratis}: {LINK} {📈|💰|🚀}',
  },
  {
    name: '42. Info Lowongan Kerja & Rekrutmen Karyawan',
    category: 'Loker',
    description: 'Penyebaran info lowongan kerja dengan posisi fleksibel.',
    template: '📢 {INFO LOWONGAN KERJA TERBARU|URGENTLY NEEDED|DIBUTUHKAN SEGERA}! {Posisi terbuka untuk pria/wanita usia produktif|Kandidat aktif, jujur & bertanggung jawab}. {Benefit gaji pokok, insentif, dan jenjang karir}. {Kirimkan lamaran / CV Anda di}: {LINK} {📝|🏢|💼}',
  },
  {
    name: '43. Kelas Pelatihan Online & Skill Digital Marketing',
    category: 'Edukasi',
    description: 'Mengajak audiens belajar skill baru untuk menaikkan income.',
    template: '🎓 {BELAJAR SKILL DIGITAL YANG DIBUTUHKAN ZAMAN SEKARANG|PELATIHAN PRAKTIS SAMPAI BISA}! {Materi terstruktur dari dasar, cocok untuk pemula sekalipun}. {Investasi leher ke atas terbaik untuk masa depan}: {LINK} {💻|📚|💡}',
  },
  {
    name: '44. Peluang Agen Afiliasi & Komisi Harian',
    category: 'Bisnis',
    description: 'Membangun passive income lewat program afiliasi produk laris.',
    template: '💸 {CARA DAPAT INCOME TAMBAHAN DARI HP|PROGRAM AFILIASI DENGAN KOMISI BESAR}! {Cukup share link produk berkualitas, komisi langsung cair}. {Bebas jam kerja, bisa dikerjakan di mana saja}. {Daftar gratis di sini}: {LINK} {📲|💵|🎉}',
  },
  {
    name: '45. Jasa Pembuatan Website & Landing Page Profesional',
    category: 'Jasa',
    description: 'Jasa digital untuk UMKM yang ingin naik kelas online.',
    template: '🌐 {JASA PEMBUATAN WEBSITE & LANDING PAGE TINGGI KONVERSI|TAMPIL PROFESIONAL DI GOOGLE}! {Desain responsif mobile-friendly, loading super cepat, terima beres}. {Konsultasi gratis & portofolio}: {LINK} {🚀|🖥️|✨}',
  },

  // 46-52: Properti, Otomotif, Rumah Tangga & Closing Sopan
  {
    name: '46. Properti, Rumah Subsidi & Tanah Kavling',
    category: 'Properti',
    description: 'Penawaran rumah murah DP 0% atau tanah kavling legalitas aman.',
    template: '🏡 {RUMAH IMPIAN KELUARGA DP 0%|LOKASI STRATEGIS BEBAS BANJIR|CICILAN RINGAN}! {Akses mudah dekat stasiun tol dan fasilitas umum, legalitas SHM aman}. {Bisa KPR dibantu sampai approved}. {Survey lokasi & info brosur}: {LINK} atau WA: {WA} {🔑|🌳|🏠}',
  },
  {
    name: '47. Jual Beli Motor Bekas / Baru Tarikan Mantap',
    category: 'Otomotif',
    description: 'Jual beli motor kondisi istimewa surat lengkap.',
    template: '🏍️ {DIJUAL MOTOR BEKAS KONDISI ISTIMEWA SIAP PAKAI|SURAT LENGKAP STNK BPKB AKUR}! {Pajak hidup panjang, mesin halus kering tarikan responsif}. {Bisa nego santai di tempat atau tukar tambah}. {Cek foto detail & lokasi unit}: {LINK} {🛣️|🔑|👍}',
  },
  {
    name: '48. Jual Beli Mobil Bekas Kualitas Showroom',
    category: 'Otomotif',
    description: 'Unit mobil bekas bebas banjir dan bukan bekas tabrakan.',
    template: '🚗 {MOBIL BEKAS BERKUALITAS TERAWAT|BEBAS BANJIR & BEBAS TABRAKAN}! {Interior wangi rapi, kaki-kaki empuk senyap, service record resmi bengkel}. {Bisa cash maupun kredit DP minim}. {Jadwalkan test drive hari ini}: {LINK} {🚘|✨|🤝}',
  },
  {
    name: '49. Perlengkapan Rumah Tangga & Alat Dapur Praktis',
    category: 'Rumah Tangga',
    description: 'Peralatan masak serbaguna memudahkan ibu rumah tangga.',
    template: '🍳 {PERLENGKAPAN DAPUR & RUMAH TANGGA PRAKTIS|MASAK JADI LEBIH CEPAT & MENYENANGKAN}! {Bahan tebal anti lengket, hemat gas, mudah dibersihkan}. {Promo bundling diskon cuci gudang}: {LINK} {👩‍🍳|🔪|🏠}',
  },
  {
    name: '50. Jasa Sedot WC, Pipa Mampet & Tukang Bangunan',
    category: 'Jasa',
    description: 'Jasa teknis darurat rumah tangga fast response 24 jam.',
    template: '🛠️ {JASA SEDOT WC & PELANCARAN PIPA SALURAN MAMPET|RESPON CEPAT 24 JAM}! {Dikerjakan dengan mesin modern tanpa bongkar lantai, bersih tuntas bergaransi}. {Melayani seluruh area kota & sekitarnya}. {Hubungi kami sekarang}: {LINK} atau WA: {WA} {🚽|🔧|📞}',
  },
  {
    name: '51. Call to Action Khusus WhatsApp & Fast Response',
    category: 'Kontak',
    description: 'Mendorong audiens langsung menghubungi via WhatsApp untuk konsultasi.',
    template: '📲 {Tertarik atau mau tanya-tanya dulu seputar produk/layanan ini?|Info pemesanan & respon super cepat|Admin ramah siap melayani 24 jam}. {Langsung klik link WhatsApp resmi di bawah ini}: {WA} atau kunjungi {LINK}. {Melayani kirim ke seluruh Indonesia bisa bayar di tempat!} {💬|🤝|📦}',
  },
  {
    name: '52. Closing Sopan Santun & Penutup Paling Elegan',
    category: 'Penutup',
    description: 'Penutup serbaguna yang selalu sopan, menghargai admin, dan menyejukkan hati.',
    template: '{Matur nuwun sanget atas izinnya admin dan rekan-rekan grup sekalian|Terima kasih banyak atas perhatiannya|Mohon maaf lahir batin apabila mengganggu linimasa}. {Semoga usaha dan ikhtiar rekan-rekan semua selalu dimudahkan dan menghasilkan keberkahan berlimpah}. {Aamiin ya rabbal alamin|Sehat dan sukses selalu sahabat!} {🙏|❤️|🌟|🤲}',
  },
];

export function getRandomSpintaxPreset(): SpintaxPreset {
  return SPINTAX_PRESETS[Math.floor(Math.random() * SPINTAX_PRESETS.length)];
}

/**
 * Otomatis mengambil satu template dari 50+ pustaka preset secara acak
 * dan mengisikan link target dengan aman.
 */
export function get50PlusRandomizedComment(linkUrl: string = ''): string {
  // 50% peluang gunakan preset utuh, 50% peluang gunakan generator 4-layer super dinamis
  if (Math.random() > 0.5) {
    const preset = getRandomSpintaxPreset();
    return formatCommentWithLink(preset.template, linkUrl, true);
  } else {
    return generateRandom4LayerComment(linkUrl);
  }
}
