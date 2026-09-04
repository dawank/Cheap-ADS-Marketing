import React, { useState } from 'react';
import { Campaign, FBAccount, FBGroup, ExecutionLog } from '../types';
import { 
  MessageSquare, 
  Play, 
  Pause, 
  Plus, 
  Trash2, 
  Link as LinkIcon, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  Users, 
  Globe, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCw, 
  ThumbsUp, 
  Smile,
  Layers,
  Terminal,
  ExternalLink,
  ChevronRight,
  Database,
  SlidersHorizontal,
  Flame,
  Coffee,
  Heart,
  Zap,
  Copy,
  Check,
  Eye,
  ShieldAlert,
  Laptop,
  Target,
  Square
} from 'lucide-react';
import { parseSpintax } from '../utils/spintax';
import { generateCloakedLink, getAppRedirectOrigin } from '../utils/linkCloaker';
import { CloudflareWorkerModal } from './CloudflareWorkerModal';
import { ProductBankItem } from '../types';

interface ProductItem {
  id: string;
  label: string;
  originalUrl: string;
}

interface CampaignTabProps {
  campaigns: Campaign[];
  accounts: FBAccount[];
  activeAccount: FBAccount | undefined;
  groups: FBGroup[];
  productLinks?: ProductBankItem[];
  preSelectedGroupIds?: string[];
  onCreateCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'totalExecuted' | 'successfulComments' | 'failedComments'>) => void;
  onToggleCampaignStatus: (id: string) => void;
  onDeleteCampaign: (id: string) => void;
  onTriggerInstantStep?: (campaignId: string) => void;
  onOpenSpintaxHelper: () => void;
  onOpenDedupModal?: () => void;
  onEmergencyStop?: () => void;
  onOpenWorkerModal?: () => void;
  isAutomationRunning?: boolean;
  logs?: ExecutionLog[];
  dedupCount?: number;
}

export const CampaignTab: React.FC<CampaignTabProps> = ({
  campaigns,
  accounts,
  activeAccount,
  groups,
  productLinks = [],
  preSelectedGroupIds = [],
  onCreateCampaign,
  onToggleCampaignStatus,
  onDeleteCampaign,
  onTriggerInstantStep,
  onOpenSpintaxHelper,
  onOpenDedupModal,
  onEmergencyStop,
  onOpenWorkerModal,
  isAutomationRunning = false,
  logs = [],
  dedupCount = 0
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [campaignName, setCampaignName] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(activeAccount?.id || accounts[0]?.id || '');
  const [targetType, setTargetType] = useState<Campaign['targetType']>('group_posts');
  const [totalTargetPosts, setTotalTargetPosts] = useState<number>(10);
  const [useAllPresetTemplates, setUseAllPresetTemplates] = useState(true);
  const [linkSource, setLinkSource] = useState<'manual' | 'bank'>('bank');
  const [selectedBankLinkIds, setSelectedBankLinkIds] = useState<string[]>(
    productLinks.filter(p => p.isActive).map(p => p.id)
  );
  const [runInBackground, setRunInBackground] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(preSelectedGroupIds);
  const [targetPostUrlsRaw, setTargetPostUrlsRaw] = useState('');
  const [autoKeywordsRaw, setAutoKeywordsRaw] = useState('rekomendasi, info, jual, cari, butuh, diskon, promo');
  const [commentTemplates, setCommentTemplates] = useState<string[]>([
    '{Halo kak|Permisi kak|Wah info menarik}. Buat yang lagi cari referensi murah & terpercaya bisa cek di: {LINK} - {Semoga membantu ya|Recommended banget}!',
    '{Mantap pembahasannya gan|Setuju banget|Keren infonya}! Sekadar info tambahan promo flash sale hari ini bisa lihat di: {LINK} - {Jangan sampai kehabisan|Buruan dicek} 🙏'
  ]);
  
  // Cloudflare Worker & Link Cloaker
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [cloakerSource, setCloakerSource] = useState<'app' | 'worker'>('app');
  const [workerUrl, setWorkerUrl] = useState<string>(() => {
    return localStorage.getItem('cheapads_worker_url') || '';
  });
  const [smartCloakerEnabled, setSmartCloakerEnabled] = useState(true);
  const [cloakerMode, setCloakerMode] = useState<'base64' | 'plain'>('base64');
  
  // Produk & Multi-Link Rotator (Nama Produk + Link Asli Tujuan)
  const [productItems, setProductItems] = useState<ProductItem[]>([
    { id: 'p1', label: 'Gadget Flash Sale Shopee', originalUrl: 'https://shope.ee/flashsale-gadget-promo' },
    { id: 'p2', label: 'Produk Terlaris Tokopedia', originalUrl: 'https://tokopedia.link/promo-terlaris-diskon' },
    { id: 'p3', label: 'Affiliate Viral TikTok Shop', originalUrl: 'https://vt.tiktok.com/ZS2xAffiliateViral/' }
  ]);

  // Mode Siluman (Kirim Teks Dulu, Selang Waktu Diedit Sisipkan Link)
  const [stealthMode, setStealthMode] = useState(true);
  const [stealthEditDelaySeconds, setStealthEditDelaySeconds] = useState(15);

  const [useLinkRotator, setUseLinkRotator] = useState(true);
  const [enableSubId, setEnableSubId] = useState(true);
  const [subIdPrefix, setSubIdPrefix] = useState('fb_aff');
  
  // Safety & Freshness Filters
  const [delayMinSeconds, setDelayMinSeconds] = useState(90);
  const [delayMaxSeconds, setDelayMaxSeconds] = useState(180);
  const [dailyLimit, setDailyLimit] = useState(25);
  const [maxPostAgeHours, setMaxPostAgeHours] = useState(24);
  const [maxCommentsThreshold, setMaxCommentsThreshold] = useState(100);
  const [onCrowdedAction, setOnCrowdedAction] = useState<'skip' | 'reply_top'>('reply_top');
  const [onExhaustedAction, setOnExhaustedAction] = useState<'standby' | 'warmup'>('warmup');
  const [batchCooldownCount, setBatchCooldownCount] = useState(5);
  const [batchCooldownMinutes, setBatchCooldownMinutes] = useState(15);
  const [sortByRecent, setSortByRecent] = useState(true);
  const [keystrokeEmulation, setKeystrokeEmulation] = useState(true);
  const [randomizeEmoji, setRandomizeEmoji] = useState(true);
  const [likeBeforeComment, setLikeBeforeComment] = useState(true);

  const currentAccount = accounts.find(a => a.id === selectedAccountId) || activeAccount;
  const currentAccountGroups = groups.filter(g => g.accountId === (currentAccount?.id || ''));

  const handleSaveWorkerUrl = (url: string) => {
    setWorkerUrl(url);
    localStorage.setItem('cheapads_worker_url', url);
  };

  const handleAddTemplate = () => {
    setCommentTemplates(prev => [
      ...prev,
      '{Halo teman-teman|Halo semuanya}, ada rekomendasi menarik nih: {LINK} - {Terima kasih banyak|Semoga berkah selalu}!'
    ]);
  };

  const handleUpdateTemplate = (index: number, text: string) => {
    setCommentTemplates(prev => {
      const copy = [...prev];
      copy[index] = text;
      return copy;
    });
  };

  const handleRemoveTemplate = (index: number) => {
    if (commentTemplates.length <= 1) return;
    setCommentTemplates(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddProduct = () => {
    const newIdx = productItems.length + 1;
    setProductItems(prev => [
      ...prev, 
      { id: `prod-${Date.now()}`, label: `Produk Rekomendasi ${newIdx}`, originalUrl: 'https://shope.ee/link-affiliate-baru' }
    ]);
  };

  const handleUpdateProduct = (index: number, field: 'label' | 'originalUrl', val: string) => {
    setProductItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleRemoveProduct = (index: number) => {
    if (productItems.length <= 1) return;
    setProductItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim() || productItems.length === 0) return;

    // Hitung link yang akan disebar: jika mantulan aktif, bungkus sesuai domain (aplikasi bawaan atau worker)
    const effectiveWorker = cloakerSource === 'worker' ? workerUrl.trim() : 'app';
    const processedLinks = productItems.map(p => {
      if (smartCloakerEnabled) {
        return generateCloakedLink(p.originalUrl, effectiveWorker, cloakerMode);
      }
      return p.originalUrl;
    });

    const postUrls = targetPostUrlsRaw
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0);

    const keywords = autoKeywordsRaw
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    let finalShareLinks = processedLinks;
    let finalProductLabels = productItems.map(p => p.label);

    if (linkSource === 'bank' && productLinks.length > 0) {
      const chosenBankItems = productLinks.filter(p => 
        selectedBankLinkIds.length > 0 ? selectedBankLinkIds.includes(p.id) : p.isActive
      );
      if (chosenBankItems.length > 0) {
        finalShareLinks = chosenBankItems.map(p => p.originalUrl);
        finalProductLabels = chosenBankItems.map(p => p.label);
      }
    }

    const newCampaign = {
      name: campaignName.trim(),
      accountId: selectedAccountId,
      targetType,
      targetGroupIds: selectedGroupIds,
      targetPostUrls: postUrls.length > 0 ? postUrls : [
        'https://facebook.com/groups/auto-target-post-1',
        'https://facebook.com/groups/auto-target-post-2'
      ],
      autoDetectKeywords: keywords,
      commentTemplates,
      shareLink: finalShareLinks[0] || 'https://shope.ee/flashsale-gadget-promo',
      shareLinks: finalShareLinks,
      productLabels: finalProductLabels,
      useLinkRotator,
      enableSubId,
      subIdPrefix,
      linkPosition: 'end' as const,
      delayMinSeconds: Number(delayMinSeconds) || 90,
      delayMaxSeconds: Number(delayMaxSeconds) || 180,
      dailyLimit: Number(dailyLimit) || 25,
      status: 'idle' as const,
      totalTargetPosts: Math.max(1, Number(totalTargetPosts) || 10),
      randomizeEmoji,
      likeBeforeComment,
      maxPostAgeHours: Number(maxPostAgeHours) || 24,
      maxCommentsThreshold: Number(maxCommentsThreshold) || 100,
      onCrowdedAction,
      onExhaustedAction,
      batchCooldownCount: Number(batchCooldownCount) || 5,
      batchCooldownMinutes: Number(batchCooldownMinutes) || 15,
      sortByRecent,
      keystrokeEmulation,
      // Fitur Baru Auto-Pilot, Presets & Background Mode
      useAllPresetTemplates,
      runInBackground,
      linkSource,
      selectedBankLinkIds,
      // Fitur Cara 1 & Cara 2
      smartCloakerEnabled,
      cloakerWorkerUrl: workerUrl,
      cloakerMode,
      stealthMode,
      stealthEditDelaySeconds: Number(stealthEditDelaySeconds) || 15
    };

    onCreateCampaign(newCampaign);
    setShowCreateModal(false);
    setCampaignName('');
  };

  const totalCommentsAcrossCampaigns = campaigns.reduce((acc, c) => acc + c.totalExecuted, 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'running');

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Anti-Conflict Database Access */}
      <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Campaign Auto-Comment & Link Affiliate</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Safe Pacing & Dedup Active
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Sebar link affiliate secara acak & aman ke postingan fresh (&lt;24 jam) dengan rotasi multi-link dan pencegah tabrakan antar-akun.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {isAutomationRunning && onEmergencyStop && (
            <button
              onClick={onEmergencyStop}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 border border-red-500 rounded-lg shadow-sm transition flex items-center gap-1.5"
              title="Hentikan browser & loop otomasi seketika"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Emergency STOP</span>
            </button>
          )}

          <button
            onClick={() => setShowWorkerModal(true)}
            className="px-3.5 py-2 text-xs font-semibold text-amber-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition flex items-center gap-1.5"
            title="Setup Pemantul Link Gratis di Cloudflare Workers"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Setup Link Mantulan</span>
          </button>

          {onOpenDedupModal && (
            <button
              onClick={onOpenDedupModal}
              className="px-3.5 py-2 text-xs font-semibold text-emerald-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Anti-Tabrakan DB ({dedupCount})</span>
            </button>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Campaign Baru</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-3.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">{campaigns.length} <span className="text-xs font-normal text-slate-500">Campaign</span></div>
            <div className="text-xs text-slate-400">{activeCampaigns.length} Sedang Berjalan</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-3.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">{totalCommentsAcrossCampaigns} <span className="text-xs font-normal text-slate-500">Komentar</span></div>
            <div className="text-xs text-slate-400">Total Terkirim</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-3.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-400 font-mono">100%</div>
            <div className="text-xs text-slate-400">Anti-Tabrakan Terkunci</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-3.5">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">90-180s</div>
            <div className="text-xs text-slate-400">Jeda Aman Human Pacing</div>
          </div>
        </div>
      </div>

      {/* Active Campaigns List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Daftar Campaign Auto-Comment</span>
            <span className="text-xs text-[#94A3B8] font-normal">({campaigns.length} total)</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {campaigns.map((campaign) => {
            const isRunning = campaign.status === 'running';
            const isStandby = campaign.status === 'standby';
            const isWarmup = campaign.status === 'warmup';
            const account = accounts.find(a => a.id === campaign.accountId);
            const percent = Math.min(100, Math.round((campaign.totalExecuted / Math.max(1, campaign.totalTargetPosts)) * 100));

            return (
              <div
                key={campaign.id}
                className={`p-5 rounded-2xl border transition bg-[#11141B] flex flex-col justify-between space-y-4 shadow-xl ${
                  isRunning 
                    ? 'border-emerald-500/80 ring-2 ring-emerald-500/20 bg-gradient-to-b from-emerald-950/20 to-[#11141B]' 
                    : isStandby
                    ? 'border-amber-500/50 bg-gradient-to-b from-amber-950/20 to-[#11141B]'
                    : isWarmup
                    ? 'border-cyan-500/50 bg-gradient-to-b from-cyan-950/20 to-[#11141B]'
                    : 'border-[#1E293B]'
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded font-mono ${
                          campaign.targetType === 'group_posts' 
                            ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' 
                            : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                        }`}>
                          {campaign.targetType === 'group_posts' ? 'Postingan Grup' : campaign.targetType === 'timeline_posts' ? 'Timeline / Beranda' : 'Campuran'}
                        </span>
                        <span className="text-[11px] text-[#94A3B8] font-mono">
                          Akun: <b className="text-[#CBD5E1]">{account?.name || 'FB Account'}</b>
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1.5">{campaign.name}</h4>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isRunning && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                          Sedang Berjalan
                        </span>
                      )}
                      {isStandby && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Coffee className="w-3 h-3" />
                          Standby (Menunggu Post Baru)
                        </span>
                      )}
                      {isWarmup && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          <Heart className="w-3 h-3 text-rose-400" />
                          Warm-Up Organik
                        </span>
                      )}
                      {!isRunning && !isStandby && !isWarmup && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#141824] text-[#94A3B8] border border-[#232D42]">
                          {campaign.status === 'paused' ? 'Dijeda' : 'Siap Mulai'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Multi-Link Rotator Preview */}
                  <div className="mt-3 p-2.5 rounded-xl bg-[#0D0F15] border border-[#1E293B] space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[#94A3B8]">
                        <LinkIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="text-[11px] font-semibold text-white">
                          {campaign.shareLinks && campaign.shareLinks.length > 1 
                            ? `Rotasi ${campaign.shareLinks.length} Link Affiliate` 
                            : 'Link Sasaran'}
                        </span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        {campaign.smartCloakerEnabled && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5" /> Link Mantulan (302)
                          </span>
                        )}
                        {campaign.stealthMode && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                            🥷 Mode Siluman ({campaign.stealthEditDelaySeconds || 15}s)
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="font-mono text-cyan-300 truncate text-[11px]">
                      {campaign.shareLinks?.[0] || campaign.shareLink}
                    </p>
                  </div>

                  {/* Anti-Ban Badges Summary */}
                  <div className="mt-2.5 flex items-center gap-2 flex-wrap text-[10px]">
                    {campaign.useAllPresetTemplates && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-semibold">
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" /> 50+ Preset Spintax
                      </span>
                    )}
                    {campaign.runInBackground && (
                      <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                        <Laptop className="w-2.5 h-2.5" /> Latar Belakang
                      </span>
                    )}
                    {campaign.smartCloakerEnabled && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" /> Direct Redirect (1x Klik Shopee)
                      </span>
                    )}
                    {campaign.stealthMode && (
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        Anti-Admin Assist: Teks Dulu ➔ Edit Link
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-[#141824] text-[#94A3B8] border border-[#232D42]">
                      Maks Umur: &lt;{campaign.maxPostAgeHours || 24} Jam
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#141824] text-[#94A3B8] border border-[#232D42]">
                      Batas: {campaign.maxCommentsThreshold || 100} Komen
                    </span>
                  </div>

                  {/* Progress & Safety Indicators */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#94A3B8]">Progres Komen:</span>
                      <span className="font-mono font-bold text-white">
                        {campaign.totalExecuted} / {campaign.totalTargetPosts} post ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#0D0F15] h-2 rounded-full overflow-hidden border border-[#1E293B]">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#94A3B8] pt-1 font-mono">
                      <span>Jeda aman: <b className="text-[#CBD5E1]">{campaign.delayMinSeconds}s - {campaign.delayMaxSeconds}s</b></span>
                      <span>Batas harian: <b className="text-[#CBD5E1]">{campaign.dailyLimit} komen/akun</b></span>
                    </div>
                  </div>
                </div>

                {/* Controller Actions */}
                <div className="pt-3 border-t border-[#1E293B] flex items-center justify-between gap-2">
                  <button
                    onClick={() => onToggleCampaignStatus(campaign.id)}
                    className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                      isRunning
                        ? 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Jeda</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Jalankan Campaign</span>
                      </>
                    )}
                  </button>

                  {isRunning && (
                    <button
                      onClick={() => {
                        if (onEmergencyStop) onEmergencyStop();
                        onToggleCampaignStatus(campaign.id);
                      }}
                      title="Hentikan proses seketika dan tutup browser"
                      className="py-1.5 px-3 text-xs font-bold rounded-lg bg-rose-600/20 hover:bg-rose-600/35 text-rose-300 border border-rose-500/40 transition flex items-center gap-1.5"
                    >
                      <Square className="w-3.5 h-3.5 fill-rose-400" />
                      <span>Stop Instan</span>
                    </button>
                  )}

                  <button
                    onClick={() => onTriggerInstantStep(campaign.id)}
                    title="Kirim 1 komentar instan sekarang"
                    className="py-1.5 px-3 text-xs font-semibold rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Kirim 1 Komen</span>
                  </button>

                  <button
                    onClick={() => onDeleteCampaign(campaign.id)}
                    title="Hapus Campaign"
                    className="p-1.5 rounded-lg bg-[#141824] hover:bg-rose-950/80 text-[#94A3B8] hover:text-rose-400 border border-[#232D42] transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {campaigns.length === 0 && (
          <div className="text-center py-12 bg-[#11141B] rounded-2xl border border-[#1E293B]">
            <MessageSquare className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
            <p className="text-sm text-[#CBD5E1] font-semibold">Belum ada campaign auto-comment.</p>
            <p className="text-xs text-[#94A3B8] mt-1">Buat campaign pertama untuk mulai mempromosikan link affiliate secara otomatis & aman.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-3 px-4 py-2 text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition"
            >
              + Buat Campaign Baru
            </button>
          </div>
        )}
      </div>

      {/* Live Automation Execution Stream Log */}
      <div className="p-5 bg-[#11141B] border border-[#1E293B] rounded-2xl space-y-3 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Live Execution Terminal & Anti-Ban Stream</h3>
          </div>
          <span className="text-[11px] font-mono text-[#94A3B8] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Engine Online
          </span>
        </div>

        <div className="max-h-56 overflow-y-auto space-y-1.5 font-mono text-[11px] bg-[#0D0F15] p-3 rounded-xl border border-[#1E293B]">
          {logs.slice(0, 10).map((log) => (
            <div key={log.id} className="flex items-start gap-2 text-[#CBD5E1]">
              <span className="text-[#64748B] shrink-0">[{log.timestamp}]</span>
              <span className={`shrink-0 font-bold ${
                log.status === 'success' ? 'text-emerald-400' : log.status === 'warning' ? 'text-amber-400' : 'text-cyan-400'
              }`}>
                [{log.type.toUpperCase()}]
              </span>
              <span className="text-[#94A3B8] font-medium">({log.accountName}):</span>
              <span className="text-[#E2E8F0]">{log.message}</span>
              {log.linkUrl && (
                <span className="text-indigo-400 truncate max-w-[150px]">➡️ {log.linkUrl}</span>
              )}
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-[#64748B] text-center py-4">Belum ada aktivitas campaign yang berjalan.</p>
          )}
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#11141B] border border-[#1E293B] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            <div className="flex items-center justify-between p-5 border-b border-[#1E293B] bg-[#0D0F15]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Buat Campaign Auto-Comment & Link Rotator Baru</h3>
                  <p className="text-xs text-[#94A3B8]">Konfigurasi penyebaran link affiliate aman dengan spintax dan filter anti-ban</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 overflow-y-auto space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                  Nama Campaign <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Auto Comment Link Affiliate Shopee & TikTok Viral"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-[#0D0F15] border border-[#1E293B] rounded-xl text-[#E2E8F0] placeholder-[#64748B] focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                    Pilih Akun Pelaksana
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#0D0F15] border border-[#1E293B] rounded-xl text-[#CBD5E1] focus:border-indigo-500 focus:outline-none"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (Limit: {acc.dailyCommentCount}/{acc.maxDailyComments})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                    Target Area Komentar
                  </label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-[#0D0F15] border border-[#1E293B] rounded-xl text-[#CBD5E1] focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="group_posts">Komentar di Postingan Grup FB</option>
                    <option value="timeline_posts">Komentar di Postingan Timeline / Beranda</option>
                    <option value="mixed">Campuran (Grup & Timeline)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Target Route Guidance & Total Posts Count */}
              <div className="p-3 bg-[#0D0F15] border border-[#1E293B] rounded-xl space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Jalur Eksekusi:</span>
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                      targetType === 'timeline_posts'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : targetType === 'mixed'
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                          : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                    }`}>
                      {targetType === 'timeline_posts' ? 'Timeline / Beranda Facebook' : targetType === 'mixed' ? 'Campuran (Grup & Timeline)' : 'Postingan Grup Facebook'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[#94A3B8] whitespace-nowrap">Target Jumlah Postingan:</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={totalTargetPosts}
                      onChange={(e) => setTotalTargetPosts(Math.max(1, Number(e.target.value)))}
                      className="w-16 px-2 py-1 text-xs text-center font-mono font-bold bg-[#141824] border border-[#232D42] rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-[#94A3B8] leading-relaxed bg-[#141824] p-2.5 rounded-lg border border-[#232D42]">
                  {targetType === 'timeline_posts' && (
                    <p className="text-amber-200/90">
                      ⚡ <b>Jalur Timeline:</b> Akun akan membuka Beranda Facebook, scrolling santai secara acak membaca feed, lalu mencari dan mengomentari {totalTargetPosts} postingan teman/publik aktif di timeline tanpa perlu masuk ke grup.
                    </p>
                  )}
                  {targetType === 'group_posts' && (
                    <p className="text-indigo-200/90">
                      👥 <b>Jalur Grup:</b> Akun akan membuka daftar grup yang diikuti, membaca isi postingan anggota grup, lalu mengomentari {totalTargetPosts} postingan grup yang fresh dan aktif.
                    </p>
                  )}
                  {targetType === 'mixed' && (
                    <p className="text-purple-200/90">
                      🔄 <b>Jalur Campuran:</b> Akun akan bergantian berkomentar di postingan Timeline Beranda dan postingan Grup Facebook (total {totalTargetPosts} postingan) untuk aktivitas alami yang paling organik & anti-curiga.
                    </p>
                  )}
                </div>
              </div>

              {/* Pilihan Metode 1: Link Mantulan & Rotasi Produk */}
              <div className="p-4 bg-[#0D0F15] border border-[#1E293B] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-amber-500/20 text-amber-400">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Metode 1: Link Mantulan & Rotasi Produk</span>
                      <span className="text-[10px] text-[#94A3B8]">1x klik langsung mental ke Shopee/Lazada (Anti-blokir domain FB)</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowWorkerModal(true)}
                    className="text-[10px] text-amber-300 hover:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Panduan Setup (Rp 0)</span>
                  </button>
                </div>

                {/* Switcher Aktifkan Link Mantulan */}
                <div className="p-2.5 rounded-lg bg-[#141824] border border-[#232D42] flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-[#CBD5E1] cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={smartCloakerEnabled}
                      onChange={(e) => setSmartCloakerEnabled(e.target.checked)}
                      className="rounded text-amber-500 bg-[#0D0F15] border-[#232D42] focus:ring-amber-400"
                    />
                    <span>Gunakan Link Mantulan Otomatis (Rekomendasi)</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 font-mono font-semibold">100% Kebal Sensor FB</span>
                </div>

                {/* Pilihan Sumber Link Mantulan */}
                {smartCloakerEnabled && (
                  <div className="space-y-2.5 p-3 rounded-xl bg-[#0D0F15] border border-[#232D42]">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-white font-bold flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        Pilihan Domain Pemantul:
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowWorkerModal(true)}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Buka Generator & Tester Link
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <label className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2 transition ${
                        cloakerSource === 'app' 
                          ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-300' 
                          : 'bg-[#141824] border-[#232D42] text-[#94A3B8]'
                      }`}>
                        <input
                          type="radio"
                          name="cloakerSource"
                          value="app"
                          checked={cloakerSource === 'app'}
                          onChange={() => setCloakerSource('app')}
                          className="text-emerald-500 bg-[#0D0F15] border-[#232D42] focus:ring-emerald-400"
                        />
                        <div className="truncate">
                          <div className="font-semibold text-white text-[11px] flex items-center gap-1">
                            <Laptop className="w-3 h-3 text-emerald-400" />
                            <span>Bawaan Aplikasi (Tanpa Setup)</span>
                          </div>
                          <div className="text-[10px] font-mono text-[#64748B] truncate">{getAppRedirectOrigin()}</div>
                        </div>
                      </label>

                      <label className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2 transition ${
                        cloakerSource === 'worker' 
                          ? 'bg-indigo-950/20 border-indigo-500/50 text-indigo-300' 
                          : 'bg-[#141824] border-[#232D42] text-[#94A3B8]'
                      }`}>
                        <input
                          type="radio"
                          name="cloakerSource"
                          value="worker"
                          checked={cloakerSource === 'worker'}
                          onChange={() => setCloakerSource('worker')}
                          className="text-indigo-500 bg-[#0D0F15] border-[#232D42] focus:ring-indigo-400"
                        />
                        <div className="truncate">
                          <div className="font-semibold text-white text-[11px] flex items-center gap-1">
                            <Globe className="w-3 h-3 text-indigo-400" />
                            <span>Cloudflare Worker Pribadi</span>
                          </div>
                          <div className="text-[10px] text-[#64748B] truncate">
                            {workerUrl ? workerUrl : 'Belum diisi (Klik buat gratis)'}
                          </div>
                        </div>
                      </label>
                    </div>

                    {cloakerSource === 'worker' && (
                      <div className="pt-1">
                        <input
                          type="url"
                          value={workerUrl}
                          onChange={(e) => handleSaveWorkerUrl(e.target.value)}
                          placeholder="https://pemantul-promo.namamu.workers.dev"
                          className="w-full px-3 py-1.5 text-xs bg-[#141824] border border-[#232D42] rounded-lg text-emerald-300 placeholder-[#64748B] focus:border-indigo-500 focus:outline-none font-mono"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Mode Sumber Link: Bank Link vs Manual */}
                <div className="p-3 bg-[#141824] border border-[#232D42] rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
                      Sumber Link Promosi:
                    </span>
                    <div className="flex items-center gap-1.5 bg-[#0D0F15] p-1 rounded-lg border border-[#232D42]">
                      <button
                        type="button"
                        onClick={() => setLinkSource('bank')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                          linkSource === 'bank'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                            : 'text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        Bank Link ({productLinks.filter(p => p.isActive).length} aktif)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLinkSource('manual')}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                          linkSource === 'manual'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                            : 'text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        Input Manual
                      </button>
                    </div>
                  </div>

                  {linkSource === 'bank' && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] text-[#94A3B8] flex items-center justify-between">
                        <span>Pilih link aktif dari Bank Link untuk rotasi otomatis:</span>
                        <span className="text-[10px] font-mono text-cyan-400">
                          {selectedBankLinkIds.length} dipilih
                        </span>
                      </div>
                      {productLinks.length === 0 ? (
                        <div className="p-3 rounded-lg bg-[#0D0F15] border border-dashed border-[#232D42] text-center text-xs text-[#94A3B8]">
                          Bank link masih kosong. Silakan tambahkan link di menu <b>Bank Link</b> atau pilih tab Input Manual.
                        </div>
                      ) : (
                        <div className="max-h-44 overflow-y-auto space-y-1.5 p-2 bg-[#0D0F15] rounded-lg border border-[#232D42]">
                          {productLinks.map((item) => {
                            const isChecked = selectedBankLinkIds.includes(item.id);
                            return (
                              <label
                                key={item.id}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition border text-xs ${
                                  isChecked
                                    ? 'bg-cyan-950/20 border-cyan-500/40 text-cyan-200'
                                    : 'bg-[#141824] border-[#232D42] text-[#94A3B8] hover:bg-[#1a2030]'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedBankLinkIds([...selectedBankLinkIds, item.id]);
                                      } else {
                                        setSelectedBankLinkIds(selectedBankLinkIds.filter(id => id !== item.id));
                                      }
                                    }}
                                    className="rounded text-cyan-500 bg-[#0D0F15] border-[#334155] focus:ring-cyan-400"
                                  />
                                  <span className="font-semibold truncate text-white">{item.label}</span>
                                </div>
                                <span className="text-[10px] font-mono text-[#64748B] shrink-0 ml-2">
                                  {item.marketplace}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Mode Latar Belakang (Run in background) */}
                <div className="p-3 rounded-xl bg-[#141824] border border-[#232D42] flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-white font-medium">
                    <input
                      type="checkbox"
                      checked={runInBackground}
                      onChange={(e) => setRunInBackground(e.target.checked)}
                      className="rounded text-blue-500 bg-[#0D0F15] border-[#334155] focus:ring-blue-400"
                    />
                    <div className="flex items-center gap-1.5">
                      <Laptop className="w-3.5 h-3.5 text-blue-400" />
                      <span>Mode Latar Belakang (Run in Background)</span>
                    </div>
                  </label>
                  <span className="text-[10px] text-[#94A3B8]">Jendela browser tersembunyi / headless</span>
                </div>

                {/* Daftar Produk & Link Tujuan Asli (Jika Input Manual) */}
                {linkSource === 'manual' && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">Daftar Link & Produk Manual (Rotasi Otomatis):</span>
                      <button
                        type="button"
                        onClick={handleAddProduct}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Tambah Produk
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {productItems.map((prod, idx) => {
                        const effectiveTarget = cloakerSource === 'worker' ? workerUrl : 'app';
                        const cloaked = generateCloakedLink(prod.originalUrl, effectiveTarget, cloakerMode);
                        return (
                          <div key={prod.id || idx} className="p-2.5 bg-[#141824] border border-[#232D42] rounded-xl space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-[#64748B] w-4">{idx + 1}.</span>
                              <input
                                type="text"
                                required
                                value={prod.label}
                                onChange={(e) => handleUpdateProduct(idx, 'label', e.target.value)}
                                placeholder="Nama/Label Produk (misal: Sepatu Pria Promo)"
                                className="w-1/3 px-2.5 py-1.5 text-xs bg-[#0D0F15] border border-[#232D42] rounded-lg text-white placeholder-[#64748B] focus:border-indigo-500 focus:outline-none"
                              />
                              <input
                                type="url"
                                required
                                value={prod.originalUrl}
                                onChange={(e) => handleUpdateProduct(idx, 'originalUrl', e.target.value)}
                                placeholder="https://shope.ee/link-affiliate-asli"
                                className="flex-1 px-2.5 py-1.5 text-xs bg-[#0D0F15] border border-[#232D42] rounded-lg text-[#CBD5E1] placeholder-[#64748B] focus:border-indigo-500 focus:outline-none font-mono"
                              />
                              {productItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProduct(idx)}
                                  className="p-1 text-[#94A3B8] hover:text-rose-400 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Preview Link Mantulan yang akan disebar */}
                            {smartCloakerEnabled && (
                              <div className="flex items-center justify-between text-[10px] pl-6 text-[#94A3B8] pt-1 border-t border-[#1E293B]">
                                <span className="flex items-center gap-1 truncate max-w-[70%] font-mono text-emerald-400 font-semibold">
                                  <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span>Hasil Mantulan Aman: {cloaked}</span>
                                </span>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => navigator.clipboard.writeText(cloaked)}
                                    className="text-cyan-400 hover:underline flex items-center gap-0.5"
                                  >
                                    <Copy className="w-2.5 h-2.5" /> Salin
                                  </button>
                                  <a
                                    href={cloaked}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-indigo-400 hover:underline flex items-center gap-0.5"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5" /> Tes Klik
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SubID Tracking */}
                <div className="flex items-center justify-between pt-2 border-t border-[#1E293B] text-xs">
                  <label className="flex items-center gap-2 text-[#CBD5E1] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableSubId}
                      onChange={(e) => setEnableSubId(e.target.checked)}
                      className="rounded text-indigo-600 bg-[#141824] border-[#232D42] focus:ring-indigo-500"
                    />
                    <span>Otomatis Tambah Tracking SubID (<code>?sub_id=akun_grup</code>)</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 font-medium">Rotasi otomatis per komentar</span>
                </div>
              </div>

              {/* Pilihan Metode 2: Mode Siluman (Anti-Admin Assist) */}
              <div className="p-4 bg-[#0D0F15] border border-[#1E293B] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-indigo-500/20 text-indigo-400">
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Metode 2: Mode Siluman (Komentar Teks ➔ Lalu Edit Sisipkan Link)</span>
                      <span className="text-[10px] text-[#94A3B8]">Mengelabui bot Admin Assist FB yang memblokir link saat pertama posting</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#141824] border border-[#232D42] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-[#CBD5E1] cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={stealthMode}
                        onChange={(e) => setStealthMode(e.target.checked)}
                        className="rounded text-indigo-600 bg-[#0D0F15] border-[#232D42] focus:ring-indigo-500"
                      />
                      <span>Aktifkan Mode Siluman (Kirim Teks Alami Dulu, Lalu Edit)</span>
                    </label>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                      Bypass Admin Assist
                    </span>
                  </div>

                  {stealthMode && (
                    <div className="pt-2 border-t border-[#1E293B] space-y-2 text-xs text-[#94A3B8]">
                      <p className="text-[11px] leading-relaxed text-[#CBD5E1]">
                        💡 <b>Cara Kerja:</b> Bot pertama-tama akan mengirim komentar tanpa link sama sekali (100% lolos sensor bot grup). Setelah menunggu beberapa detik, bot secara otomatis kembali ke komentar tersebut dan mengeditnya untuk menyisipkan link promosi Anda.
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-[#CBD5E1]">Jeda waktu sebelum mengedit komentar:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={5}
                            max={120}
                            value={stealthEditDelaySeconds}
                            onChange={(e) => setStealthEditDelaySeconds(Number(e.target.value))}
                            className="w-16 px-2 py-1 text-xs text-center bg-[#0D0F15] border border-[#232D42] rounded-lg text-white font-mono"
                          />
                          <span className="text-[11px] text-[#CBD5E1]">detik</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Spintax Comment Templates & Preset Library */}
              <div className="space-y-3">
                {/* Fitur Unggulan: 50+ Preset Spintax Acak */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 border border-amber-500/30 space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useAllPresetTemplates}
                      onChange={(e) => setUseAllPresetTemplates(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-0 bg-[#0D0F15] border-[#334155]"
                    />
                    <div>
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                        Gunakan Seluruh Template dari Pustaka Preset Secara Acak (50+ Preset Super Kaya)
                      </span>
                      <p className="text-[11px] text-[#CBD5E1] mt-0.5 leading-relaxed">
                        <b>Mode Auto-Pilot Rekomendasi:</b> Anda tidak perlu mengetik template komentar manual! Sistem otomatis meracik jutaan variasi kalimat alami 4-layer (Hook, Appreciation, Link, Closing) dari 50+ preset terbaik secara acak pada setiap eksekusi komentar.
                      </p>
                    </div>
                  </label>
                </div>

                {!useAllPresetTemplates && (
                  <div className="space-y-2 p-3 bg-[#0D0F15] border border-[#1E293B] rounded-xl">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#CBD5E1] flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Template Komentar Manual (Spintax)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={onOpenSpintaxHelper}
                          className="text-[10px] text-cyan-300 hover:underline font-semibold"
                        >
                          Buka Bantuan Spintax
                        </button>
                        <button
                          type="button"
                          onClick={handleAddTemplate}
                          className="text-[10px] text-indigo-400 hover:underline font-semibold flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" /> Tambah Template
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {commentTemplates.map((tmpl, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={tmpl}
                            onChange={(e) => handleUpdateTemplate(idx, e.target.value)}
                            placeholder="{Halo kak|Hai}! Cek promo di: {LINK}"
                            className="flex-1 px-3 py-1.5 text-xs bg-[#141824] border border-[#1E293B] rounded-xl text-[#E2E8F0] placeholder-[#64748B] focus:border-indigo-500 focus:outline-none"
                          />
                          {commentTemplates.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTemplate(idx)}
                              className="p-1.5 text-[#94A3B8] hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Anti-Ban & Smart Filters Section */}
              <div className="p-4 bg-[#0D0F15] border border-[#1E293B] rounded-xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Proteksi Anti-Ban & Filter Kesegaran Postingan</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                    Tingkat Keamanan Tinggi
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-[#94A3B8] block mb-1">Maks Umur Postingan</span>
                    <select
                      value={maxPostAgeHours}
                      onChange={(e) => setMaxPostAgeHours(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-[#141824] border border-[#232D42] rounded-lg text-white text-xs font-mono"
                    >
                      <option value={6}>&lt; 6 Jam Terakhir</option>
                      <option value={12}>&lt; 12 Jam Terakhir</option>
                      <option value={24}>&lt; 24 Jam (Direkomendasikan)</option>
                      <option value={72}>&lt; 3 Hari</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#94A3B8] block mb-1">Batas Keramaian Komen</span>
                    <select
                      value={maxCommentsThreshold}
                      onChange={(e) => setMaxCommentsThreshold(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-[#141824] border border-[#232D42] rounded-lg text-white text-xs font-mono"
                    >
                      <option value={30}>Maks 30 Komentar</option>
                      <option value={50}>Maks 50 Komentar</option>
                      <option value={100}>Maks 100 Komentar</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#94A3B8] block mb-1">Jika Post Terlalu Ramai</span>
                    <select
                      value={onCrowdedAction}
                      onChange={(e) => setOnCrowdedAction(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-[#141824] border border-[#232D42] rounded-lg text-white text-xs font-mono"
                    >
                      <option value="reply_top">Balas Komen Teratas (Top)</option>
                      <option value="skip">Lewati (Skip ke Post Lain)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-[11px] text-[#94A3B8] block mb-1">Jeda Waktu Acak (Detik)</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={delayMinSeconds}
                        onChange={(e) => setDelayMinSeconds(Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-[#141824] border border-[#232D42] rounded-lg text-white text-xs font-mono"
                      />
                      <span className="text-[#64748B]">-</span>
                      <input
                        type="number"
                        value={delayMaxSeconds}
                        onChange={(e) => setDelayMaxSeconds(Number(e.target.value))}
                        className="w-full px-2 py-1.5 bg-[#141824] border border-[#232D42] rounded-lg text-white text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#94A3B8] block mb-1">Batas Harian per Akun</span>
                    <input
                      type="number"
                      value={dailyLimit}
                      onChange={(e) => setDailyLimit(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-[#141824] border border-[#232D42] rounded-lg text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-[#94A3B8] block mb-1">Jika Post Habis</span>
                    <select
                      value={onExhaustedAction}
                      onChange={(e) => setOnExhaustedAction(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-[#141824] border border-[#232D42] rounded-lg text-white text-xs font-mono"
                    >
                      <option value="warmup">Pemanasan Organik (Warm-Up)</option>
                      <option value="standby">Standby (Menunggu Post Baru)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1E293B] space-y-2 text-xs">
                  <label className="flex items-center gap-2 text-[#CBD5E1] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={keystrokeEmulation}
                      onChange={(e) => setKeystrokeEmulation(e.target.checked)}
                      className="rounded text-indigo-600 bg-[#141824] border-[#232D42] focus:ring-indigo-500"
                    />
                    <span>Simulasi Pengetikan Manusia (Human Keystroke Emulation 50-120ms/huruf)</span>
                  </label>

                  <label className="flex items-center gap-2 text-[#CBD5E1] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={likeBeforeComment}
                      onChange={(e) => setLikeBeforeComment(e.target.checked)}
                      className="rounded text-indigo-600 bg-[#141824] border-[#232D42] focus:ring-indigo-500"
                    />
                    <span>Otomatis Like postingan sebelum kirim komentar</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#CBD5E1] bg-[#141824] hover:bg-[#1C2336] rounded-xl border border-[#232D42] transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400 transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Simpan & Siapkan Campaign
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal Panduan & Generator Cloudflare Worker Gratis */}
      <CloudflareWorkerModal
        isOpen={showWorkerModal}
        onClose={() => setShowWorkerModal(false)}
        initialWorkerUrl={workerUrl}
        onSaveWorkerUrl={handleSaveWorkerUrl}
      />

    </div>
  );
};
