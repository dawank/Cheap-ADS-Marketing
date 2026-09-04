export type AccountStatus = 'active' | 'cooldown' | 'standby' | 'warmup' | 'checkpoint' | 'unverified';

export interface FBPage {
  id: string;
  name: string;
  category: string;
  likes: number;
}

export interface FBAccount {
  id: string;
  name: string;
  uid: string;
  avatar: string;
  cookie: string;
  token?: string;
  status: AccountStatus;
  proxy: string;
  dailyCommentCount: number;
  dailyPostCount: number;
  dailyJoinCount: number;
  maxDailyComments: number;
  maxDailyPosts: number;
  maxDailyJoins: number;
  joinedGroupsCount?: number;
  joinedGroupCount?: number;
  pages?: FBPage[];
  lastActive: string;
  notes: string;
  userAgent?: string;
  email?: string;
  loginMethod?: 'browser_login' | 'cookie' | 'manual';
  warmUpMinutes?: number;
  warmUpStats?: {
    reelsWatched: number;
    likesGiven: number;
    postsScrolled: number;
  };
  currentTaskDescription?: string;
  standbyUntil?: string;
}

export interface FBGroup {
  id: string;
  name: string;
  fbGroupId?: string;
  coverImage?: string;
  memberCount: number;
  privacy: 'public' | 'private';
  joinStatus?: 'joined' | 'pending' | 'not_joined';
  postPermission: 'instant' | 'admin_approval' | 'closed';
  category: string;
  accountId: string;
  lastPostedAt?: string;
  lastPostedDate?: string;
  joinedDate?: string;
  url: string;
  description?: string;
}

export interface GroupSearchResult {
  id: string;
  name: string;
  fbGroupId?: string;
  coverImage?: string;
  memberCount: number;
  privacy: 'public' | 'private';
  joinStatus: 'not_joined' | 'queued' | 'joining' | 'joined' | 'pending' | 'failed';
  category: string;
  url: string;
  description: string;
  location?: string;
  selected?: boolean;
  postsPerDay?: number; // Jumlah postingan per hari (keaktifan grup)
  rankingScore?: number; // Skor prioritas ranking
  isMarketplace?: boolean; // Grup bertema Jual Beli / Pasar / Komunitas Dagang
  linkFriendly?: boolean; // Toleransi tinggi terhadap link eksternal (rendah risiko blokir)
  activityLevel?: string;
}

export type TargetType = 'page' | 'timeline' | 'group';
export type MediaType = 'none' | 'image' | 'video' | 'link_preview';
export type PostStatus = 'scheduled' | 'running' | 'completed' | 'failed' | 'paused';
export type RepeatInterval = 'none' | 'hourly' | 'daily' | 'weekly';

export interface LocalMediaItem {
  id: string;
  name: string;
  size: number;
  type: 'image' | 'video';
  mimeType: string;
  dataUrl: string;
  filePath?: string;
  duration?: number;
}

export interface ScheduledPost {
  id: string;
  title: string;
  accountId: string;
  targetType: TargetType;
  targetIds: string[]; // group IDs or page IDs
  targetNames?: string[];
  content: string; // supports {spintax|variation}
  linkUrl?: string;
  linkUrls?: string[]; // Multi-link rotator support
  useLinkRotator?: boolean;
  mediaType: MediaType;
  mediaUrls: string[];
  localMedia?: LocalMediaItem[];
  
  // Anti-Ban & Human Emulation Engine
  keystrokeEmulation?: boolean; // mengetik karakter demi karakter natural
  prePostDelaySec?: number; // jeda membaca sebelum post (detik)
  interGroupDelayMin?: number; // jeda min antar grup (detik)
  interGroupDelayMax?: number; // jeda max antar grup (detik)
  batchRestCount?: number; // istirahat setiap X grup
  batchRestMinutes?: number; // lama istirahat (menit)
  workingHoursOnly?: boolean; // hanya posting jam 08:00 - 22:00

  scheduledAt: string;
  repeatInterval: RepeatInterval;
  status: PostStatus;
  successCount: number;
  failureCount: number;
  createdAt: string;
  lastRunAt?: string;
  logs: string[];
}

export type CampaignTargetType = 'group_posts' | 'timeline_posts' | 'mixed';
export type CampaignStatus = 'idle' | 'running' | 'paused' | 'completed' | 'standby' | 'warmup';

export interface GlobalPostHistory {
  id: string;
  postId?: string;
  postUrl: string;
  accountId: string;
  accountName: string;
  groupName: string;
  timestamp: string;
  actionType?: 'comment' | 'reply_top' | 'post';
  linkUsed?: string;
  commentSnippet?: string;
  commentText?: string;
  groupId?: string;
}

export interface Campaign {
  id: string;
  name: string;
  accountId: string;
  accountName?: string;
  targetType?: CampaignTargetType;
  targetGroupIds?: string[];
  groupIds?: string[];
  targetPostUrls?: string[]; // manual URLs or auto scraped
  autoDetectKeywords?: string[];
  commentTemplates: string[]; // with {spintax|variations}
  shareLink?: string; // primary link
  shareLinks?: string[]; // Multi-link rotator (Shopee, Tokopedia, TikTok, etc.)
  productLinks?: Array<{ id: string; originalUrl: string; label: string }>;
  useLinkRotator?: boolean;
  enableSubId?: boolean;
  subIdPrefix?: string;
  linkPosition?: 'end' | 'inline' | 'separate';
  delayMinSeconds?: number;
  delayMaxSeconds?: number;
  minDelaySeconds?: number;
  maxDelaySeconds?: number;
  dailyLimit?: number;
  status: CampaignStatus | 'active';
  totalTargetPosts?: number;
  targetPostCountPerGroup?: number;
  totalExecuted?: number;
  successfulComments?: number;
  failedComments?: number;
  stats?: {
    totalGroups: number;
    totalCommentsSent: number;
    successfulComments: number;
    failedComments: number;
    estimatedClicks: number;
  };
  createdAt: string;
  lastExecutedAt?: string;
  randomizeEmoji?: boolean;
  likeBeforeComment?: boolean;
  
  // Anti-Ban & Freshness Engine Filters
  maxPostAgeHours?: number; // 6, 12, 24, 72 hours
  maxCommentsThreshold?: number; // e.g. 50 or 100 comments max
  onCrowdedAction?: 'skip' | 'reply_top'; // Skip crowded or hijack top comment
  onExhaustedAction?: 'standby' | 'warmup'; // When no new post is available
  batchCooldownCount?: number; // rest after every X comments
  batchCooldownMinutes?: number; // rest for Y minutes
  sortByRecent?: boolean; // sort group feed chronologically
  keystrokeEmulation?: boolean; // human speed keystroke
  skipAdminPosts?: boolean;
  minPostReactions?: number;
  enableAntiSpamJitter?: boolean;

  // Smart Link Cloaker & Stealth Mode
  smartCloakerEnabled?: boolean; // Ubah link jadi format mantulan instan aman anti-spam FB
  cloakerSource?: 'app' | 'worker';
  cloakerWorkerUrl?: string; // e.g. https://pemantul.namakamu.workers.dev
  cloakerMode?: 'base64' | 'plain';
  productLabels?: string[]; // Label/nama produk pendamping link
  stealthMode?: boolean; // Mode Siluman: Kirim komentar teks alami dulu, baru diedit masukkan link (tembus Admin Assist)
  stealthEditDelaySeconds?: number; // Jeda sebelum diedit (detik)

  // Perombakan Auto-Pilot & Preset Library
  useAllPresetTemplates?: boolean; // 🌟 Gunakan Seluruh Template dari Pustaka Preset Secara Acak (50+ Preset)
  usePresetTemplates?: boolean;
  runInBackground?: boolean; // Mode Latar Belakang: jalan tanpa menutupi layar kerja
  linkSource?: 'manual' | 'bank'; // Sumber link: manual input atau ambil dari Bank Link
  selectedBankLinkIds?: string[]; // Daftar ID dari Bank Link yang dipilih untuk rotasi
}

export interface ProductBankItem {
  id: string;
  label: string;
  originalUrl: string;
  category?: string;
  cloakerMode: 'direct' | 'base64' | 'worker';
  workerUrl?: string;
  enableSubId: boolean;
  subIdPrefix: string;
  isActive: boolean;
  sentTodayCount: number;
  totalSentCount: number;
  clicks?: number;
  createdAt: string;
  notes?: string;
}

export interface EngineSettings {
  runInBackground: boolean; // Menjalankan browser di latar belakang tanpa menutupi layar
  showBrowserWindow: boolean;
  humanDelayMin: number; // Jeda minimum antar interaksi (detik)
  humanDelayMax: number; // Jeda maksimum antar interaksi (detik)
  keystrokeEmulation: boolean; // Ketik karakter demi karakter alami
  likeBeforeComment: boolean; // Berikan reaksi jempol sebelum komentar
  readingDelaySec: number; // Durasi membaca/scroll sebelum aksi
  batchRestCount: number; // Beristirahat setiap X aksi
  batchRestMinutes: number; // Lama istirahat batch (menit)
  stealthMode: boolean; // Mode siluman
  stealthEditDelaySec: number; // Jeda sebelum mengedit komentar dengan link
  emojiJitter: boolean; // Variasi emoji acak anti-spam hash
  punctuationJitter: boolean; // Variasi tanda baca acak
  maxDailyCommentsPerAccount: number; // Batas harian aman per akun
}

export interface HourlyActivityStat {
  hour: string; // '00:00', '01:00', ... '23:00'
  commentsCount: number;
  successCount: number;
  failedCount: number;
}

export interface FourLayerSpintax {
  layer1Hook: string;
  layer2Appreciation: string;
  layer3Link: string;
  layer4Closing: string;
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  type: 'comment' | 'post' | 'join' | 'system' | 'account' | 'browser' | 'warmup' | 'dedup';
  status: 'success' | 'warning' | 'error' | 'info';
  accountName: string;
  target: string;
  message: string;
  details?: string;
  linkUrl?: string;
}

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  history: string[];
  historyIndex: number;
}

export interface SmartJoinSettings {
  autoAnswerRules: boolean;
  defaultRulesConsent: string;
  defaultCity: string;
  defaultSource: string;
  aiSolverEnabled: boolean;
}

declare global {
  interface Window {
    electronFB?: {
      isDesktop: boolean;
      platform: string;
      injectCookies: (partition: string, cookieString: string) => Promise<{ success: boolean; error?: string }>;
      setPartitionProxy: (partition: string, proxyRules: string) => Promise<{ success: boolean; error?: string }>;
      openExternal: (url: string) => Promise<{ success: boolean }>;
      autoLogin: (params: { partition: string; email?: string; password?: string; proxyRules?: string }) => Promise<{ success: boolean; uid?: string; cookieString?: string; name?: string; avatar?: string; error?: string }>;
      extractSession: (params: { partition: string }) => Promise<{ success: boolean; isLoggedIn: boolean; uid?: string; cookieString?: string; cookiesCount?: number; error?: string }>;
      searchLiveGroups: (params: { partition: string; cookieString: string; keyword: string; scrollCount?: number }) => Promise<{ success: boolean; groups: GroupSearchResult[]; keyword: string; totalFound: number; error?: string }>;
      fetchMyJoinedGroups: (params: { partition: string; cookieString: string; accountId: string }) => Promise<{ success: boolean; groups: FBGroup[]; error?: string }>;
      joinGroup: (params: { partition: string; cookieString: string; groupUrl: string; groupId?: string }) => Promise<{ success: boolean; result?: any; error?: string }>;
      postToGroup: (params: { 
        partition: string; 
        cookieString: string; 
        groupUrl: string; 
        groupId?: string; 
        postText: string; 
        imageUrl?: string;
        mediaType?: string;
        mediaUrls?: string[];
        localMedia?: LocalMediaItem[];
        keystrokeEmulation?: boolean;
        prePostDelaySec?: number;
      }) => Promise<{ success: boolean; message?: string; error?: string }>;
      commentOnPost: (params: { 
        partition: string; 
        cookieString: string; 
        postUrl: string; 
        commentText: string;
        keystrokeEmulation?: boolean;
        likeBeforeComment?: boolean;
        readingDelaySec?: number;
      }) => Promise<{ success: boolean; message?: string; error?: string }>;
      runHumanGroupCommentCycle: (params: {
        partition: string;
        cookieString: string;
        targetType?: CampaignTargetType;
        totalTargetPosts?: number;
        targetGroups?: Array<{ url: string; name?: string } | string>;
        commentTemplates?: string[];
        shareLinks?: string[];
        useLinkRotator?: boolean;
        enableSubId?: boolean;
        subIdPrefix?: string;
        accountName?: string;
        warmupFeedSeconds?: number;
        groupReadingSeconds?: number;
        delayMinSeconds?: number;
        delayMaxSeconds?: number;
        keystrokeEmulation?: boolean;
        likeBeforeComment?: boolean;
        stealthMode?: boolean;
        stealthEditDelaySeconds?: number;
        smartCloakerEnabled?: boolean;
        cloakerWorkerUrl?: string;
        cloakerMode?: 'base64' | 'plain';
        showBrowser?: boolean;
        runInBackground?: boolean;
        maxGroupsToProcess?: number;
      }) => Promise<{ success: boolean; totalProcessed?: number; successfulCount?: number; failedCount?: number; cancelled?: boolean; error?: string }>;
      stopAutomation: () => Promise<{ success: boolean; error?: string }>;
      refreshProfile: (params: {
        partition: string;
        cookieString: string;
        uid?: string;
      }) => Promise<{ success: boolean; name?: string; avatar?: string; error?: string }>;
      onAutomationLog: (callback: (log: ExecutionLog) => void) => () => void;
    };
  }
}

