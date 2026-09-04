import { 
  FBAccount, 
  FBGroup, 
  GroupSearchResult, 
  ScheduledPost, 
  Campaign, 
  ExecutionLog, 
  GlobalPostHistory,
  ProductBankItem,
  EngineSettings,
  HourlyActivityStat
} from '../types';

export const INITIAL_ACCOUNTS: FBAccount[] = [
  {
    id: 'acc-1',
    name: 'Dawan Klaten (Utama)',
    uid: '100084928192831',
    cookie: 'c_user=100084928192831; xs=42%3Asample_valid_session_token%3A2%3A1719283921; datr=xYz98samplecookie;',
    proxy: 'http://185.199.229.15:8080',
    status: 'active',
    dailyCommentCount: 18,
    maxDailyComments: 60,
    dailyPostCount: 4,
    maxDailyPosts: 15,
    dailyJoinCount: 2,
    maxDailyJoins: 10,
    joinedGroupCount: 4,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    notes: 'Akun utama usia 3 tahun, trust score tinggi, aman untuk campaign harian',
    lastActive: 'Baru saja'
  },
  {
    id: 'acc-2',
    name: 'Budi Santoso Store',
    uid: '100091283748291',
    cookie: 'c_user=100091283748291; xs=45%3Asample_valid_session_token_2%3A2%3A1719283944; datr=AbC12samplecookie;',
    proxy: '',
    status: 'active',
    dailyCommentCount: 9,
    maxDailyComments: 50,
    dailyPostCount: 2,
    maxDailyPosts: 12,
    dailyJoinCount: 1,
    maxDailyJoins: 8,
    joinedGroupCount: 3,
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    notes: 'Akun kedua untuk rotasi promosi niche fashion & elektronik',
    lastActive: '15 menit lalu'
  }
];

export const INITIAL_GROUPS: FBGroup[] = [
  {
    id: 'grp-1',
    accountId: 'acc-1',
    name: 'Jual Beli HP & Elektronik Jabodetabek (FJB)',
    url: 'https://facebook.com/groups/fjb.elektronik.jabodetabek',
    memberCount: 142500,
    privacy: 'public',
    category: 'Jual Beli & Gadget',
    postPermission: 'instant',
    joinedDate: '2024-01-15',
    lastPostedDate: '2025-02-28',
    description: 'Pusat jual beli gadget dan promo murah se-Jabodetabek'
  },
  {
    id: 'grp-2',
    accountId: 'acc-1',
    name: 'Bursa Sepatu & Fashion Pria Wanita Murah',
    url: 'https://facebook.com/groups/fashion.sneakers.murah',
    memberCount: 89400,
    privacy: 'public',
    category: 'Fashion & Pakaian',
    postPermission: 'instant',
    joinedDate: '2024-02-10',
    lastPostedDate: '2025-02-27',
    description: 'Komunitas reseller dan pemburu promo fashion terlengkap'
  },
  {
    id: 'grp-3',
    accountId: 'acc-1',
    name: 'Komunitas Shopee Affiliate & Promo Racun Diskon',
    url: 'https://facebook.com/groups/racun.shopee.affiliate.id',
    memberCount: 235000,
    privacy: 'public',
    category: 'Affiliate & Promo',
    postPermission: 'instant',
    joinedDate: '2024-03-01',
    lastPostedDate: '2025-03-01',
    description: 'Share voucher, diskon cashback 50%, dan racun belanja'
  },
  {
    id: 'grp-4',
    accountId: 'acc-1',
    name: 'Pasar Online UMKM & Kulakan Se-Indonesia',
    url: 'https://facebook.com/groups/pasar.online.umkm.nasional',
    memberCount: 118000,
    privacy: 'public',
    category: 'Bisnis & UMKM',
    postPermission: 'admin_approval',
    joinedDate: '2024-04-12',
    lastPostedDate: '2025-02-20',
    description: 'Jaringan pelaku usaha online dan supplier terpercaya'
  },
  {
    id: 'grp-5',
    accountId: 'acc-2',
    name: 'Jual Beli HP & Elektronik Jabodetabek (FJB)',
    url: 'https://facebook.com/groups/fjb.elektronik.jabodetabek',
    memberCount: 142500,
    privacy: 'public',
    category: 'Jual Beli & Gadget',
    postPermission: 'instant',
    joinedDate: '2024-05-10',
    lastPostedDate: '2025-02-26',
    description: 'Pusat jual beli gadget dan promo murah se-Jabodetabek'
  },
  {
    id: 'grp-6',
    accountId: 'acc-2',
    name: 'Komunitas Shopee Affiliate & Promo Racun Diskon',
    url: 'https://facebook.com/groups/racun.shopee.affiliate.id',
    memberCount: 235000,
    privacy: 'public',
    category: 'Affiliate & Promo',
    postPermission: 'instant',
    joinedDate: '2024-05-15',
    lastPostedDate: '2025-02-25',
    description: 'Share voucher, diskon cashback 50%, dan racun belanja'
  }
];

export const MOCK_SEARCHABLE_GROUPS: GroupSearchResult[] = [
  {
    id: 'search-grp-1',
    name: 'Jual Beli Online Jogja - Solo - Semarang (JOGLOSEMAR)',
    url: 'https://facebook.com/groups/joglosemar.online.market',
    memberCount: 175000,
    privacy: 'public',
    category: 'Jual Beli',
    activityLevel: 'Sangat Ramai (50+ post/hari)',
    isMarketplace: true,
    joinStatus: 'not_joined',
    description: 'Forum jual beli aneka produk baru dan bekas area Jawa Tengah & DIY'
  },
  {
    id: 'search-grp-2',
    name: 'Info Promo & Flash Sale Shopee Tokopedia TikTok 2025',
    url: 'https://facebook.com/groups/info.promo.flashsale.indonesia',
    memberCount: 310000,
    privacy: 'public',
    category: 'Promo & Diskon',
    activityLevel: 'Sangat Ramai (100+ post/hari)',
    isMarketplace: true,
    joinStatus: 'not_joined',
    description: 'Kumpulan kode voucher diskon dan info promo flash sale setiap hari'
  },
  {
    id: 'search-grp-3',
    name: 'Bursa Gadget Second & Baru Bandung Raya',
    url: 'https://facebook.com/groups/gadget.bandung.raya',
    memberCount: 94000,
    privacy: 'public',
    category: 'Elektronik & HP',
    activityLevel: 'Ramai (30+ post/hari)',
    isMarketplace: true,
    joinStatus: 'not_joined',
    description: 'Lapak jual beli smartphone, laptop, dan aksesoris Bandung'
  },
  {
    id: 'search-grp-4',
    name: 'Reseller & Dropship Fashion Hijab Busana Muslim',
    url: 'https://facebook.com/groups/reseller.hijab.busanamuslim',
    memberCount: 82000,
    privacy: 'public',
    category: 'Fashion & Hijab',
    activityLevel: 'Sedang (15+ post/hari)',
    isMarketplace: true,
    joinStatus: 'not_joined',
    description: 'Pusat grosir dan supplier baju gamis, hijab, dan fashion muslimah'
  },
  {
    id: 'search-grp-5',
    name: 'Komunitas Pecinta Kopi & Kuliner Nusantara',
    url: 'https://facebook.com/groups/kuliner.kopi.nusantara',
    memberCount: 65000,
    privacy: 'public',
    category: 'Kuliner',
    activityLevel: 'Ramai (25+ post/hari)',
    isMarketplace: false,
    joinStatus: 'not_joined',
    description: 'Sharing resep, review kafe, dan jual beli biji kopi lokal'
  }
];

export const INITIAL_SCHEDULED_POSTS: ScheduledPost[] = [];

export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-1',
    name: 'Promosi Viral Sneaker & Gadget Auto-Pilot',
    accountId: 'acc-1',
    accountName: 'Dawan Klaten (Utama)',
    groupIds: ['grp-1', 'grp-2', 'grp-3'],
    targetPostCountPerGroup: 3,
    status: 'paused',
    minDelaySeconds: 20,
    maxDelaySeconds: 45,
    likeBeforeComment: true,
    commentTemplates: [
      'Halo kak, kalau cari rekomendasi promo terbaik bisa langsung mampir ke: {LINK}',
      'Wah pas banget nih, kebetulan lagi ada diskon spesial di sini: {LINK}',
      'Bantu info ya kak, vouchernya masih aktif bisa diklaim di: {LINK}'
    ],
    productLinks: [
      {
        id: 'prod-1',
        originalUrl: 'https://shopee.co.id/product/123456789/987654321',
        label: 'Sneaker Casual Pria Diskon 50%'
      },
      {
        id: 'prod-2',
        originalUrl: 'https://tokopedia.com/officialstore/tws-bluetooth-bass-pro',
        label: 'TWS Bluetooth Bass Pro'
      }
    ],
    smartCloakerEnabled: true,
    cloakerSource: 'app',
    cloakerMode: 'base64',
    enableSubId: true,
    stealthMode: false,
    stealthEditDelaySeconds: 15,
    maxPostAgeHours: 24,
    minPostReactions: 1,
    skipAdminPosts: true,
    enableAntiSpamJitter: true,
    stats: {
      totalGroups: 3,
      totalCommentsSent: 27,
      successfulComments: 26,
      failedComments: 1,
      estimatedClicks: 68
    },
    usePresetTemplates: true,
    linkSource: 'bank',
    selectedBankLinkIds: ['prod-1', 'prod-2', 'prod-3'],
    runInBackground: false,
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_GLOBAL_POST_HISTORY: GlobalPostHistory[] = [
  {
    id: 'hist-1',
    postUrl: 'https://facebook.com/groups/fjb.elektronik.jabodetabek/posts/98127391823',
    groupId: 'grp-1',
    groupName: 'Jual Beli HP & Elektronik Jabodetabek (FJB)',
    accountId: 'acc-1',
    accountName: 'Dawan Klaten (Utama)',
    commentText: 'Halo kak, kalau butuh rekomendasi diskon promo bisa mampir ke: https://s.id/promo-gadget 🔥',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  }
];

export const DEFAULT_ENGINE_SETTINGS: EngineSettings = {
  runInBackground: false,
  showBrowserWindow: true,
  humanDelayMin: 15,
  humanDelayMax: 35,
  keystrokeEmulation: true,
  likeBeforeComment: true,
  readingDelaySec: 6,
  batchRestCount: 10,
  batchRestMinutes: 5,
  stealthMode: false,
  stealthEditDelaySec: 15,
  emojiJitter: true,
  punctuationJitter: true,
  maxDailyCommentsPerAccount: 50
};

export const INITIAL_PRODUCT_BANK: ProductBankItem[] = [
  {
    id: 'prod-1',
    label: 'Shopee Affiliate - Sneaker Casual Pria',
    originalUrl: 'https://shopee.co.id/product/123456789/987654321',
    category: 'Fashion',
    cloakerMode: 'base64',
    enableSubId: true,
    subIdPrefix: 'fb_aff',
    isActive: true,
    sentTodayCount: 14,
    totalSentCount: 128,
    clicks: 42,
    createdAt: new Date().toISOString(),
    notes: 'Katalog sepatu sneaker diskon 50%'
  },
  {
    id: 'prod-2',
    label: 'Tokopedia - Gadget TWS Bluetooth Bass',
    originalUrl: 'https://tokopedia.com/officialstore/tws-bluetooth-bass-pro',
    category: 'Gadget',
    cloakerMode: 'direct',
    enableSubId: true,
    subIdPrefix: 'fb_tws',
    isActive: true,
    sentTodayCount: 8,
    totalSentCount: 95,
    clicks: 31,
    createdAt: new Date().toISOString(),
    notes: 'Earphone viral promo gratis ongkir'
  },
  {
    id: 'prod-3',
    label: 'TikTok Shop - Paket Skincare Glowing BPOM',
    originalUrl: 'https://shop.tiktok.com/view/product/17293847291',
    category: 'Kecantikan',
    cloakerMode: 'base64',
    enableSubId: true,
    subIdPrefix: 'fb_glow',
    isActive: true,
    sentTodayCount: 19,
    totalSentCount: 210,
    clicks: 76,
    createdAt: new Date().toISOString(),
    notes: 'Viral TikTok paket serum & toner'
  },
  {
    id: 'prod-4',
    label: 'WhatsApp Admin - Konsultasi & Order Cepat',
    originalUrl: 'https://wa.me/6281234567890?text=Halo%20Admin%20mau%20order',
    category: 'Kontak',
    cloakerMode: 'direct',
    enableSubId: false,
    subIdPrefix: 'wa_direct',
    isActive: true,
    sentTodayCount: 6,
    totalSentCount: 54,
    clicks: 19,
    createdAt: new Date().toISOString(),
    notes: 'Nomor WhatsApp customer service utama'
  }
];

export const generateInitialHourlyStats = (): HourlyActivityStat[] => {
  const currentHour = new Date().getHours();
  const stats: HourlyActivityStat[] = [];
  
  // Pola distribusi 24 jam realistis: jam pagi santai, jam siang & malam ramai
  const baseCurve = [
    0, 0, 0, 0, 0, 1, 2, 4, 7, 10, 12, 15, 14, 11, 9, 8, 12, 16, 19, 22, 18, 13, 6, 2
  ];

  for (let h = 0; h < 24; h++) {
    const hourLabel = `${h.toString().padStart(2, '0')}:00`;
    // Hanya isi data hingga jam sekarang, selebihnya 0 jika belum terlalui
    const isPast = h <= currentHour;
    const count = isPast ? Math.max(0, baseCurve[h] + Math.floor(Math.random() * 3 - 1)) : 0;
    const success = Math.floor(count * 0.95);
    const failed = count - success;

    stats.push({
      hour: hourLabel,
      commentsCount: count,
      successCount: success,
      failedCount: failed
    });
  }

  return stats;
};

export const INITIAL_LOGS: ExecutionLog[] = [
  {
    id: 'log-init',
    timestamp: new Date().toTimeString().slice(0, 8),
    type: 'system',
    status: 'info',
    accountName: 'Sistem',
    target: 'CheapAds Engine',
    message: 'CheapAds Pro Engine siap digunakan. 6 Menu Navigasi Modern & Auto-Pilot 50+ Preset aktif.'
  }
];
