import React, { useState } from 'react';
import { GroupSearchResult, FBAccount, FBGroup } from '../types';
import { 
  Search, 
  UserPlus, 
  Users, 
  SlidersHorizontal, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Globe, 
  Lock, 
  Play, 
  Pause, 
  Sparkles, 
  Layers, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Zap,
  RotateCcw,
  Plus,
  Link,
  X,
  Compass,
  Trash2
} from 'lucide-react';

interface GroupSearchTabProps {
  searchDatabase: GroupSearchResult[];
  accounts: FBAccount[];
  activeAccount: FBAccount | undefined;
  onAutoJoinSelected: (groupsToJoin: GroupSearchResult[], targetAccountId: string, delaySec: number) => void;
  isJoiningInProgress: boolean;
  joiningProgress: { current: number; total: number; currentGroupName: string };
  onCancelJoining: () => void;
  onOpenInBrowser: (url: string) => void;
  onAddCustomGroup?: (newGroup: GroupSearchResult) => void;
  onExecuteRealGroupSearch?: (keyword: string) => Promise<GroupSearchResult[]>;
  onClearSearchResults?: () => void;
  onResetSearchResults?: () => void;
  onDeleteSearchResult?: (id: string) => void;
}

export function isGroupMarketplace(g: GroupSearchResult): boolean {
  if (g.isMarketplace !== undefined) return g.isMarketplace;
  const text = `${g.name} ${g.category} ${g.description || ''}`.toLowerCase();
  const marketKeywords = [
    'jual beli', 'pasar', 'dagang', 'lapak', 'bursa', 'marketplace', 
    'promo', 'diskon', 'affiliate', 'olshop', 'shopee', 'tokopedia',
    'kulakan', 'reseller', 'dropship', 'bisnis', 'umkm', 'fbb', 'fjb'
  ];
  return marketKeywords.some(k => text.includes(k));
}

const KEYWORD_PRESETS = [
  'Jual Beli',
  'Pasar Online',
  'Jual Beli HP & Gadget',
  'Marketplace',
  'Affiliate & Promo Shopee',
  'Bisnis Online & UMKM',
  'Lowongan Kerja',
  'Kuliner & Resep'
];

export const GroupSearchTab: React.FC<GroupSearchTabProps> = ({
  searchDatabase,
  accounts,
  activeAccount,
  onAutoJoinSelected,
  isJoiningInProgress,
  joiningProgress,
  onCancelJoining,
  onOpenInBrowser,
  onAddCustomGroup,
  onExecuteRealGroupSearch,
  onClearSearchResults,
  onResetSearchResults,
  onDeleteSearchResult
}) => {
  const [keywordInput, setKeywordInput] = useState('Jual Beli');
  const [appliedKeyword, setAppliedKeyword] = useState('Jual Beli');
  const [isSearching, setIsSearching] = useState(false);
  const [minMembers, setMinMembers] = useState<number>(0);
  const [maxMembers, setMaxMembers] = useState<number>(0);
  const [privacyFilter, setPrivacyFilter] = useState<'all' | 'public' | 'private'>('all');
  const [onlyMarketplaceFilter, setOnlyMarketplaceFilter] = useState<boolean>(false);
  const [selectedResultIds, setSelectedResultIds] = useState<string[]>([]);
  const [targetAccountId, setTargetAccountId] = useState<string>(activeAccount?.id || accounts[0]?.id || '');
  const [delaySeconds, setDelaySeconds] = useState<number>(35);
  const [sortBy, setSortBy] = useState<'ranking' | 'members' | 'posts' | 'default'>('ranking');

  // Custom Group Modal
  const [isCustomGroupModalOpen, setIsCustomGroupModalOpen] = useState(false);
  const [customGroupUrl, setCustomGroupUrl] = useState('');
  const [customGroupName, setCustomGroupName] = useState('');
  const [customGroupCategory, setCustomGroupCategory] = useState('Jual Beli & Promosi');
  const [customGroupMembers, setCustomGroupMembers] = useState(25000);
  const [customGroupPrivacy, setCustomGroupPrivacy] = useState<'public' | 'private'>('public');

  const handleClearFilter = () => {
    setAppliedKeyword('');
    setKeywordInput('');
  };

  const handleTriggerSearch = async (customTerm?: string) => {
    const term = customTerm !== undefined ? customTerm : keywordInput;
    console.log('====================================================');
    console.log('[GroupSearchTab] handleTriggerSearch dijalankan untuk kata kunci:', term);
    setIsSearching(true);
    setAppliedKeyword(term);

    if (onExecuteRealGroupSearch && term.trim()) {
      try {
        console.log('[GroupSearchTab] Menghubungi onExecuteRealGroupSearch...');
        const res = await onExecuteRealGroupSearch(term.trim());
        console.log('[GroupSearchTab] Respon pencarian live:', res);
      } catch (err) {
        console.error('[GroupSearchTab] Error saat eksekusi pencarian live:', err);
      }
    } else {
      console.warn('[GroupSearchTab] onExecuteRealGroupSearch tidak tersedia atau kata kunci kosong.');
    }

    setIsSearching(false);
  };

  const handleSelectPreset = (preset: string) => {
    setKeywordInput(preset);
    handleTriggerSearch(preset);
  };

  const handleOpenLiveFBSearch = () => {
    const query = keywordInput.trim() || 'Jual Beli';
    const fbSearchUrl = `https://www.facebook.com/groups/search/groups/?q=${encodeURIComponent(query)}`;
    onOpenInBrowser(fbSearchUrl);
  };

  // Kalkulasi estimasi postingan per hari & skor ranking prioritas
  const getGroupStats = (g: GroupSearchResult) => {
    const members = g.memberCount || 0;
    // Estimasi postingan per hari berdasarkan kapasitas member jika belum diekstrak
    const postsPerDay = g.postsPerDay || Math.max(5, Math.min(95, Math.floor(members / 2500) + 8));
    // Rumus ranking: memadukan member count + frekuensi postingan aktif + kemudahan join (publik)
    const score = Math.round((members / 1000) * 0.7 + (postsPerDay * 2.8) + (g.privacy === 'public' ? 15 : 5));
    return { postsPerDay, score };
  };

  // Filter groups based on applied search keyword
  const filteredResults = searchDatabase.filter(g => {
    const matchesKeyword = appliedKeyword.trim() === '' || 
      g.name.toLowerCase().includes(appliedKeyword.toLowerCase()) ||
      g.category.toLowerCase().includes(appliedKeyword.toLowerCase()) ||
      g.description.toLowerCase().includes(appliedKeyword.toLowerCase());
    
    const count = g.memberCount || 0;
    const matchesMin = count >= minMembers;
    const matchesMax = maxMembers === 0 || count <= maxMembers;
    const matchesPrivacy = privacyFilter === 'all' || g.privacy === privacyFilter;
    const matchesMarketplace = !onlyMarketplaceFilter || isGroupMarketplace(g);

    return matchesKeyword && matchesMin && matchesMax && matchesPrivacy && matchesMarketplace;
  }).sort((a, b) => {
    const statA = getGroupStats(a);
    const statB = getGroupStats(b);

    if (sortBy === 'ranking') {
      return statB.score - statA.score; // Ranking tertinggi di urutan teratas
    }
    if (sortBy === 'members') {
      return (b.memberCount || 0) - (a.memberCount || 0);
    }
    if (sortBy === 'posts') {
      return statB.postsPerDay - statA.postsPerDay;
    }
    return 0;
  });

  const handleToggleSelect = (id: string) => {
    setSelectedResultIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedResultIds.length === filteredResults.length && filteredResults.length > 0) {
      setSelectedResultIds([]);
    } else {
      setSelectedResultIds(filteredResults.map(g => g.id));
    }
  };

  // Pilih semua grup terurut ranking prioritas (Member + Post/hari)
  const handleSelectAllByRanking = () => {
    // Pastikan sorting berubah ke ranking
    setSortBy('ranking');
    const sorted = [...filteredResults].sort((a, b) => {
      return getGroupStats(b).score - getGroupStats(a).score;
    });
    setSelectedResultIds(sorted.map(g => g.id));
  };

  const handleStartAutoJoin = () => {
    // Urutkan grup yang dipilih berdasarkan skor ranking jika dalam mode ranking
    const items = searchDatabase
      .filter(g => selectedResultIds.includes(g.id))
      .sort((a, b) => {
        if (sortBy === 'ranking') {
          return getGroupStats(b).score - getGroupStats(a).score;
        }
        return 0;
      });

    if (items.length === 0) return;
    onAutoJoinSelected(items, targetAccountId, delaySeconds);
  };

  const handleSaveCustomGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGroupUrl.trim()) return;

    let cleanName = customGroupName.trim();
    if (!cleanName) {
      const match = customGroupUrl.match(/facebook\.com\/groups\/([^/?]+)/);
      cleanName = match ? `Grup FB (${match[1]})` : 'Grup Facebook Kustom';
    }

    const newGroupItem: GroupSearchResult = {
      id: `custom-group-${Date.now()}`,
      name: cleanName,
      fbGroupId: `fb-grp-${Date.now()}`,
      url: customGroupUrl.trim().startsWith('http') ? customGroupUrl.trim() : `https://${customGroupUrl.trim()}`,
      memberCount: Number(customGroupMembers) || 15000,
      privacy: customGroupPrivacy,
      category: customGroupCategory || 'Jual Beli',
      coverImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
      description: 'Grup Facebook asli dimasukkan secara manual untuk proses Auto Join & promosi.',
      joinStatus: 'not_joined'
    };

    if (onAddCustomGroup) {
      onAddCustomGroup(newGroupItem);
    }
    setSelectedResultIds(prev => [...prev, newGroupItem.id]);
    setIsCustomGroupModalOpen(false);
    setCustomGroupUrl('');
    setCustomGroupName('');
  };

  const selectedTargetAccount = accounts.find(a => a.id === targetAccountId) || activeAccount;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-[#11141B] p-5 rounded-2xl border border-[#1E293B] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Pencarian Grup & Auto Join</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-semibold">
              Filter Member Aktif & Live FB
            </span>
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Cari grup FB potensial berdasarkan kata kunci, gunakan tombol Cari, atau buka pencarian Live FB langsung di browser.
          </p>
        </div>

        {/* Selected Account Target for Joining & Quick Add */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-[#0D0F15] p-2 rounded-xl border border-[#1E293B]">
            <span className="text-[11px] text-[#94A3B8] pl-1">Akun Pelaksana:</span>
            <select
              value={targetAccountId}
              onChange={(e) => setTargetAccountId(e.target.value)}
              className="text-xs font-semibold bg-[#141824] text-indigo-300 border border-[#232D42] rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (Limit Join: {acc.dailyJoinCount}/{acc.maxDailyJoins})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsCustomGroupModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/60 rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah URL Grup Sendiri</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls Box */}
      <div className="p-5 rounded-2xl bg-[#11141B] border border-[#1E293B] shadow-xl space-y-4">
        
        {/* Keyword Search Row with PROMINENT SEARCH BUTTON */}
        <div>
          <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span>Kata Kunci Pencarian Grup Facebook</span>
            </span>
            <span className="text-[11px] text-[#94A3B8]">
              Ditemukan: <b className="text-white">{filteredResults.length}</b> grup sesuai kriteria
            </span>
          </label>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Ketik kata kunci grup (misal: 'Jual Beli HP', 'Affiliate', 'Marketplace')..."
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTriggerSearch()}
                className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-[#0D0F15] border border-[#1E293B] rounded-xl text-[#E2E8F0] placeholder-[#64748B] focus:border-indigo-500 focus:outline-none"
              />
              {keywordInput && (
                <button
                  type="button"
                  onClick={() => {
                    setKeywordInput('');
                    handleTriggerSearch('');
                  }}
                  className="absolute right-3 top-2.5 text-[#64748B] hover:text-[#CBD5E1]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Tombol CARI GRUP SEKARANG */}
            <button
              id="btn-search-group"
              type="button"
              onClick={() => handleTriggerSearch()}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Search className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
              <span>Cari Grup Sekarang</span>
            </button>

            {/* Tombol CARI LIVE DI FACEBOOK */}
            <button
              type="button"
              onClick={handleOpenLiveFBSearch}
              className="px-4 py-2.5 text-xs font-bold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/60 rounded-xl transition flex items-center justify-center gap-1.5 shrink-0"
              title="Buka pencarian grup live di Facebook browser dengan akun aktif"
            >
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Cari Live di FB</span>
            </button>
          </div>
        </div>

        {/* Niche Keyword Presets */}
        <div>
          <span className="text-[11px] text-[#94A3B8] mb-1.5 block">Preset Kategori Populer:</span>
          <div className="flex flex-wrap gap-1.5">
            {KEYWORD_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                  appliedKeyword === preset
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-indigo-400 font-semibold shadow-sm'
                    : 'bg-[#0D0F15] hover:bg-[#141824] text-[#CBD5E1] border-[#1E293B]'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Pilihan Metode 3: Filter Khusus Grup Jual Beli / Pasar (Toleransi Link Tinggi) */}
        <div className="p-3 bg-[#0D0F15] border border-[#1E293B] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Metode 3: Fokus Grup Jual Beli & Pasar</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  Toleransi Link Bebas
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Grup pasar/jual-beli biasanya memperbolehkan komentar berisi link dagang tanpa diblokir oleh Admin Assist FB.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-xl cursor-pointer transition shrink-0">
            <input
              type="checkbox"
              checked={onlyMarketplaceFilter}
              onChange={(e) => setOnlyMarketplaceFilter(e.target.checked)}
              className="rounded text-emerald-500 bg-[#0D0F15] border-[#232D42] focus:ring-emerald-400"
            />
            <span>Hanya Tampilkan Grup Jual Beli ({searchDatabase.filter(g => isGroupMarketplace(g)).length})</span>
          </label>
        </div>

        {/* Advanced Filters: Min/Max Members & Privacy */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-3 border-t border-[#1E293B]">
          
          {/* Min Members */}
          <div>
            <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1">
              Minimum Member (Anggota)
            </label>
            <select
              value={minMembers}
              onChange={(e) => setMinMembers(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-[#0D0F15] border border-[#1E293B] rounded-xl text-[#CBD5E1] focus:border-indigo-500 focus:outline-none"
            >
              <option value={0}>Semua (Tanpa Minimum)</option>
              <option value={5000}>Min. 5.000 Member</option>
              <option value={10000}>Min. 10.000 Member (Disarankan)</option>
              <option value={50000}>Min. 50.000 Member (Grup Besar)</option>
              <option value={100000}>Min. 100.000 Member (Viral / Raksasa)</option>
              <option value={300000}>Min. 300.000+ Member</option>
            </select>
          </div>

          {/* Max Members */}
          <div>
            <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1">
              Maksimum Member (Anggota)
            </label>
            <select
              value={maxMembers}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-[#0D0F15] border border-[#1E293B] rounded-xl text-[#CBD5E1] focus:border-indigo-500 focus:outline-none"
            >
              <option value={0}>Tanpa Batas Maksimum</option>
              <option value={50000}>Max. 50.000 Member</option>
              <option value={150000}>Max. 150.000 Member</option>
              <option value={500000}>Max. 500.000 Member</option>
              <option value={1000000}>Max. 1.000.000 Member</option>
            </select>
          </div>

          {/* Privacy Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1">
              Tipe Privasi Grup
            </label>
            <select
              value={privacyFilter}
              onChange={(e) => setPrivacyFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-[#0D0F15] border border-[#1E293B] rounded-xl text-[#CBD5E1] focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">Semua Privasi (Publik & Privat)</option>
              <option value="public">Grup Publik Saja (Mudah Gabung)</option>
              <option value="private">Grup Privat Saja</option>
            </select>
          </div>

        </div>

        {/* Smart Membership Questions & Rules Answerer Box */}
        <div className="p-3.5 bg-[#0D0F15] border border-[#1E293B] rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white">Smart Membership Questions Answerer</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                Auto-Jawab Pertanyaan Admin
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">Aktif Otomatis</span>
          </div>

          <p className="text-[11px] text-[#94A3B8]">
            Jika grup mengharuskan menjawab pertanyaan sebelum disetujui, sistem akan otomatis mencentang persetujuan rules dan mengisi jawaban positif:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-[#141824] border border-[#232D42]">
              <span className="text-[#64748B] block text-[10px]">Persetujuan Rules:</span>
              <span className="text-emerald-400 font-medium font-mono">"Ya, saya setuju & patuh rules grup"</span>
            </div>
            <div className="p-2 rounded-lg bg-[#141824] border border-[#232D42]">
              <span className="text-[#64748B] block text-[10px]">Asal Domisili:</span>
              <span className="text-indigo-300 font-medium font-mono">"Indonesia / Sesuai Profil"</span>
            </div>
            <div className="p-2 rounded-lg bg-[#141824] border border-[#232D42]">
              <span className="text-[#64748B] block text-[10px]">Tujuan Gabung:</span>
              <span className="text-cyan-300 font-medium font-mono">"Mencari info & relasi positif"</span>
            </div>
          </div>
        </div>

      </div>

      {/* Auto Join Automation Action Bar with Smart Ranking & Human Delay */}
      <div className="p-4 bg-[#11141B] border border-[#1E293B] rounded-2xl flex flex-col gap-3.5 shadow-xl">
        
        {/* Row 1: Selection, Ranking Quick Action & Sorting Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tombol Pilih Semua Biasa */}
            <button
              onClick={handleSelectAllFiltered}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#141824] hover:bg-[#1C2336] text-[#E2E8F0] border border-[#232D42] transition cursor-pointer"
            >
              {selectedResultIds.length === filteredResults.length && filteredResults.length > 0
                ? 'Batalkan Pilih Semua'
                : `Pilih Semua (${filteredResults.length})`}
            </button>

            {/* Tombol Prioritas: Pilih Semua Terurut Ranking */}
            <button
              type="button"
              onClick={handleSelectAllByRanking}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Prioritaskan grup dengan jumlah anggota terbanyak & postingan teraktif per hari"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Prioritaskan Ranking Teratas (Member & Post/Hari)</span>
            </button>

            <span className="text-xs text-[#94A3B8] pl-1">
              <b className="text-white">{selectedResultIds.length}</b> grup terpilih
            </span>
          </div>

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2 bg-[#0D0F15] px-3 py-1.5 rounded-xl border border-[#1E293B]">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] text-[#94A3B8]">Urutan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-indigo-300 focus:outline-none cursor-pointer"
            >
              <option value="ranking" className="bg-[#0D0F15]">🏆 Skor Ranking (Member & Post/Hari)</option>
              <option value="members" className="bg-[#0D0F15]">👥 Member Terbanyak</option>
              <option value="posts" className="bg-[#0D0F15]">📈 Postingan Teraktif/Hari</option>
              <option value="default" className="bg-[#0D0F15]">Standard (Hasil Temuan)</option>
            </select>
          </div>

        </div>

        {/* Row 2: Human Delay Interval, Reset actions, and Start Auto Join */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-[#1E293B]">
          
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Jeda Manusiawi */}
            <div className="flex items-center gap-2 text-xs text-[#CBD5E1] bg-[#0D0F15] px-3 py-1.5 rounded-xl border border-[#1E293B]">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] text-[#94A3B8]">Interval Waktu Join (Manusiawi):</span>
              <select
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(Number(e.target.value))}
                disabled={isJoiningInProgress}
                className="bg-transparent text-xs font-semibold text-emerald-400 focus:outline-none cursor-pointer"
              >
                <option value={20} className="bg-[#0D0F15]">20 - 30 Detik (Cepat & Wajar)</option>
                <option value={35} className="bg-[#0D0F15]">35 - 50 Detik (Direkomendasikan Natural)</option>
                <option value={60} className="bg-[#0D0F15]">60 - 80 Detik (Sangat Aman / Akun Baru)</option>
                <option value={90} className="bg-[#0D0F15]">90+ Detik (Ultra Relaksasi)</option>
              </select>
            </div>

            {/* Clear & Reset Buttons */}
            {onClearSearchResults && searchDatabase.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Kosongkan semua (${searchDatabase.length}) grup dari hasil pencarian saat ini?`)) {
                    setSelectedResultIds([]);
                    setAppliedKeyword('');
                    setKeywordInput('');
                    onClearSearchResults();
                  }
                }}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition flex items-center gap-1.5 cursor-pointer"
                title="Kosongkan seluruh daftar grup dari hasil pencarian"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Kosongkan ({searchDatabase.length})</span>
              </button>
            )}

            {appliedKeyword && (
              <button
                type="button"
                onClick={handleClearFilter}
                className="px-2 py-1 text-[11px] rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>

          {/* Start / Cancel Auto Join Button */}
          <div>
            {!isJoiningInProgress ? (
              <button
                id="btn-start-autojoin"
                onClick={handleStartAutoJoin}
                disabled={selectedResultIds.length === 0}
                className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-md transition flex items-center gap-2 ${
                  selectedResultIds.length > 0
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-600/25 cursor-pointer ring-1 ring-indigo-400'
                    : 'bg-[#141824] text-[#64748B] cursor-not-allowed border border-[#232D42]'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Mulai Auto Join ({selectedResultIds.length} Grup Terpilih)</span>
              </button>
            ) : (
              <button
                onClick={onCancelJoining}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5 fill-white" />
                <span>Hentikan Antrean Join</span>
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Realtime Progress Banner if joining */}
      {isJoiningInProgress && (
        <div className="p-4 bg-gradient-to-r from-indigo-950/90 to-blue-950/90 border border-indigo-500/40 rounded-2xl shadow-2xl animate-fadeIn space-y-2.5">
          <div className="flex items-center justify-between text-xs text-indigo-200">
            <span className="font-semibold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
              Sedang Auto Join: <span className="text-white font-bold">{joiningProgress.currentGroupName || 'Memproses...'}</span>
            </span>
            <span className="font-mono font-bold text-cyan-300">
              {joiningProgress.current} / {joiningProgress.total} Grup
            </span>
          </div>

          <div className="w-full bg-[#0A0B0E] h-2.5 rounded-full overflow-hidden border border-indigo-500/30">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500 rounded-full"
              style={{ width: `${Math.round((joiningProgress.current / Math.max(1, joiningProgress.total)) * 100)}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-[#94A3B8] flex items-center justify-between">
            <span>Menggunakan akun: <b className="text-[#CBD5E1]">{selectedTargetAccount?.name}</b></span>
            <span>Interval jeda acak antar grup aktif (Simulasi Manusia)</span>
          </p>
        </div>
      )}

      {/* Search Results Grid with Smart Rank Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResults.map((group, rankIndex) => {
          const isSelected = selectedResultIds.includes(group.id);
          const { postsPerDay, score } = getGroupStats(group);

          return (
            <div
              key={group.id}
              className={`p-4 rounded-2xl border transition bg-[#11141B] flex flex-col justify-between shadow-xl ${
                isSelected 
                  ? 'border-indigo-500 bg-gradient-to-b from-indigo-950/20 to-[#11141B] ring-1 ring-indigo-500/40' 
                  : 'border-[#1E293B] hover:border-[#334155]'
              }`}
            >
              <div>
                {/* Header with Rank Badge */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(group.id)}
                    className="mt-1 w-4 h-4 rounded text-indigo-600 bg-[#0D0F15] border-[#232D42] focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="relative">
                    <img
                      src={group.coverImage}
                      alt={group.name}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-[#232D42] shrink-0"
                    />
                    <span className={`absolute -top-1.5 -left-1.5 px-1.5 py-0.2 rounded-md text-[9px] font-bold font-mono shadow ${
                      rankIndex === 0 ? 'bg-amber-500 text-black' :
                      rankIndex === 1 ? 'bg-slate-300 text-black' :
                      rankIndex === 2 ? 'bg-amber-700 text-white' :
                      'bg-[#1E293B] text-indigo-300 border border-[#232D42]'
                    }`}>
                      #{rankIndex + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h3 
                        onClick={() => handleToggleSelect(group.id)}
                        className="text-xs font-bold text-white leading-tight line-clamp-2 hover:text-indigo-400 transition cursor-pointer flex-1"
                      >
                        {group.name}
                      </h3>

                      {onDeleteSearchResult && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Hapus "${group.name}" dari daftar pencarian?`)) {
                              onDeleteSearchResult(group.id);
                            }
                          }}
                          className="p-1 rounded-md text-[#64748B] hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0 cursor-pointer"
                          title="Hapus grup ini dari daftar pencarian"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#141824] border border-[#232D42] text-[#CBD5E1] font-medium">
                        {group.category}
                      </span>
                      {group.privacy === 'public' ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5">
                          <Globe className="w-2.5 h-2.5" /> Publik
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> Privat
                        </span>
                      )}
                      {isGroupMarketplace(group) ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5 font-medium">
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> Ramah Link (Pasar)
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-0.5">
                          🥷 Rekomendasi Mode Siluman
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metrics: Member + Post/Day Activity */}
                <div className="mt-3.5 p-2.5 rounded-xl bg-[#0D0F15] border border-[#1E293B] space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-[#CBD5E1]">
                    <span className="text-[#94A3B8] flex items-center gap-1">
                      <Users className="w-3 h-3 text-indigo-400" /> Jumlah Member:
                    </span>
                    <span className="font-extrabold text-white text-xs">
                      {(group.memberCount || 0).toLocaleString('id-ID')} <span className="text-[10px] font-normal text-[#94A3B8]">anggota</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[#CBD5E1]">
                    <span className="text-[#94A3B8] flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" /> Postingan / Hari:
                    </span>
                    <span className="font-bold text-amber-300 text-xs">
                      ~{postsPerDay} post<span className="text-[10px] font-normal text-[#94A3B8]">/hari</span>
                    </span>
                  </div>

                  {group.location && (
                    <div className="flex items-center justify-between text-[#94A3B8] text-[10px]">
                      <span>Lokasi:</span>
                      <span className="text-[#CBD5E1]">{group.location}</span>
                    </div>
                  )}
                </div>

                <p className="mt-2 text-[11px] text-[#94A3B8] line-clamp-2 italic">
                  {group.description}
                </p>
              </div>

              {/* Status & Actions */}
              <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between gap-2">
                {group.joinStatus === 'joined' ? (
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Sudah Tergabung
                  </span>
                ) : group.joinStatus === 'joining' ? (
                  <span className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 animate-spin" /> Sedang Mengirim Join...
                  </span>
                ) : group.joinStatus === 'pending' ? (
                  <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Menunggu Review
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      onAutoJoinSelected([group], targetAccountId, delaySeconds);
                    }}
                    className="flex-1 py-1.5 px-3 text-[11px] font-semibold rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition flex items-center justify-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Auto Join Grup Ini
                  </button>
                )}

                <button
                  onClick={() => onOpenInBrowser(group.url)}
                  title="Lihat di Built-In Browser FB"
                  className="p-1.5 rounded-lg bg-[#141824] hover:bg-[#1C2336] text-cyan-300 border border-[#232D42] transition"
                >
                  <Globe className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {filteredResults.length === 0 && (
        <div className="text-center py-12 px-4 bg-[#11141B] rounded-2xl border border-[#1E293B] max-w-xl mx-auto space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-white font-bold">
              {searchDatabase.length === 0 
                ? 'Daftar Hasil Pencarian Masih Kosong' 
                : (appliedKeyword ? `Belum Ada Hasil untuk "${appliedKeyword}"` : 'Tidak Ada Grup yang Sesuai Filter')}
            </p>
            <p className="text-xs text-[#94A3B8] mt-1 max-w-md mx-auto">
              {searchDatabase.length === 0 
                ? 'Daftar pencarian telah dikosongkan. Anda dapat melakukan pencarian grup baru secara live, atau memulihkan data contoh bawaan.'
                : 'Coba sesuaikan kata kunci pencarian, bersihkan filter jumlah anggota/privasi, atau cari grup live di Facebook.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {appliedKeyword && searchDatabase.length > 0 && (
              <button
                type="button"
                onClick={handleClearFilter}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tampilkan Semua ({searchDatabase.length} Grup)</span>
              </button>
            )}

            {searchDatabase.length === 0 && onResetSearchResults && (
              <button
                type="button"
                onClick={onResetSearchResults}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Pulihkan Data Contoh</span>
              </button>
            )}

            <button
              onClick={() => handleTriggerSearch()}
              disabled={isSearching}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Search className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
              <span>{isSearching ? 'Mencari Grup Live...' : 'Cari Grup FB Sekarang'}</span>
            </button>

            <button
              onClick={handleOpenLiveFBSearch}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-cyan-300 bg-[#141824] hover:bg-[#1C2336] rounded-xl border border-[#232D42] transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Buka Pencarian di Browser FB</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Tambah URL Grup FB Sendiri */}
      {isCustomGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#11141B] border border-[#1E293B] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#1E293B] bg-[#0D0F15]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Link className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Tambah URL Grup Facebook</h3>
                  <p className="text-[11px] text-[#94A3B8]">Masukkan link grup FB asli untuk langsung di-join oleh akun</p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomGroupModalOpen(false)}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomGroup} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                  URL / Tautan Grup Facebook <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://www.facebook.com/groups/namagrup atau ID grup"
                  value={customGroupUrl}
                  onChange={(e) => setCustomGroupUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#0D0F15] border border-[#1E293B] rounded-xl text-[#E2E8F0] placeholder-[#64748B] focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                  Nama Grup FB (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Komunitas Jual Beli Jabodetabek"
                  value={customGroupName}
                  onChange={(e) => setCustomGroupName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0D0F15] border border-[#1E293B] rounded-xl text-[#E2E8F0] placeholder-[#64748B] focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                    Estimasi Member
                  </label>
                  <input
                    type="number"
                    value={customGroupMembers}
                    onChange={(e) => setCustomGroupMembers(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-[#0D0F15] border border-[#1E293B] rounded-xl text-[#E2E8F0] focus:border-indigo-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                    Tipe Privasi
                  </label>
                  <select
                    value={customGroupPrivacy}
                    onChange={(e) => setCustomGroupPrivacy(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-[#0D0F15] border border-[#1E293B] rounded-xl text-[#CBD5E1] focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="public">Publik</option>
                    <option value="private">Privat</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setIsCustomGroupModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-[#CBD5E1] bg-[#141824] hover:bg-[#1C2336] rounded-xl border border-[#232D42]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl shadow-md transition"
                >
                  Simpan & Tambahkan ke Daftar Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
