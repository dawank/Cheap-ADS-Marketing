import React, { useState } from 'react';
import { FBGroup, FBAccount } from '../types';
import { 
  Users, 
  Search, 
  ExternalLink, 
  Send, 
  MessageSquare, 
  ShieldAlert, 
  CheckCircle2, 
  Globe, 
  Lock, 
  Zap, 
  Clock, 
  Filter, 
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface GroupsTabProps {
  groups: FBGroup[];
  activeAccount: FBAccount | undefined;
  onNavigateToPost: (groupIds: string[]) => void;
  onNavigateToCampaign: (groupIds: string[]) => void;
  onOpenInBrowser: (url: string) => void;
  onLeaveGroup: (groupId: string) => void;
  onSyncGroups: () => void;
}

export const GroupsTab: React.FC<GroupsTabProps> = ({
  groups,
  activeAccount,
  onNavigateToPost,
  onNavigateToCampaign,
  onOpenInBrowser,
  onLeaveGroup,
  onSyncGroups
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [privacyFilter, setPrivacyFilter] = useState<'all' | 'public' | 'private'>('all');
  const [permissionFilter, setPermissionFilter] = useState<'all' | 'instant' | 'admin_approval'>('all');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!activeAccount) {
    return (
      <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800">
        <p className="text-sm text-slate-400">Pilih atau tambahkan akun Facebook terlebih dahulu untuk melihat daftar grup.</p>
      </div>
    );
  }

  const accountGroups = groups.filter(g => g.accountId === activeAccount.id);

  const filteredGroups = accountGroups.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          g.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (g.description && g.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPrivacy = privacyFilter === 'all' ? true : g.privacy === privacyFilter;
    const matchesPermission = permissionFilter === 'all' ? true : g.postPermission === permissionFilter;
    return matchesSearch && matchesPrivacy && matchesPermission;
  });

  const totalAudience = accountGroups.reduce((acc, curr) => acc + (curr.memberCount || 0), 0);
  const instantCount = accountGroups.filter(g => g.postPermission === 'instant').length;

  const handleToggleSelectAll = () => {
    if (selectedGroupIds.length === filteredGroups.length) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(filteredGroups.map(g => g.id));
    }
  };

  const handleToggleGroup = (id: string) => {
    setSelectedGroupIds(prev => 
      prev.includes(id) ? prev.filter(gId => gId !== id) : [...prev, id]
    );
  };

  const handleSync = async () => {
    console.log('====================================================');
    console.log('[GroupsTab] Tombol Sinkronkan Grup diklik untuk akun:', activeAccount.name);
    setIsSyncing(true);
    try {
      await onSyncGroups();
    } catch (err) {
      console.error('[GroupsTab] Error saat menjalankan onSyncGroups:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Account Summary */}
      <div className="bg-[#11141B] p-5 rounded-2xl border border-[#1E293B] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Grup Yang Diikuti</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
              Akun: {activeAccount.name}
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Daftar grup Facebook aktif yang sudah tergabung pada akun <span className="text-white font-semibold">{activeAccount.name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-md shadow-indigo-600/20 border border-indigo-400/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Clock className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sedang Mensinkronkan...' : 'Sinkronkan Grup Akun'}</span>
          </button>

          <button
            onClick={() => onOpenInBrowser('https://www.facebook.com/groups/joins/')}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-[#141824] hover:bg-[#1C2336] text-cyan-300 border border-[#232D42] transition flex items-center gap-1.5"
            title="Buka daftar grup Anda di Browser FB"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Buka di Browser FB</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl bg-[#11141B] border border-[#1E293B] flex items-center gap-3.5 shadow-lg">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">{accountGroups.length}</div>
            <div className="text-xs text-[#94A3B8]">Total Grup Diikuti</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#11141B] border border-[#1E293B] flex items-center gap-3.5 shadow-lg">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">{instantCount} <span className="text-xs font-normal text-[#94A3B8]">grup</span></div>
            <div className="text-xs text-[#94A3B8]">Posting Langsung (Instant Post)</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#11141B] border border-[#1E293B] flex items-center gap-3.5 shadow-lg">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-white">{(totalAudience / 1000).toFixed(1)}k+</div>
            <div className="text-xs text-[#94A3B8]">Total Jangkauan Audience Member</div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#11141B] p-4 rounded-xl border border-[#1E293B] shadow-lg">
        
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama grup, kategori, deskripsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#0D0F15] border border-[#1E293B] rounded-lg text-[#E2E8F0] placeholder-[#64748B] focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Privacy Filter */}
          <select
            value={privacyFilter}
            onChange={(e) => setPrivacyFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-[#0D0F15] border border-[#1E293B] rounded-lg text-[#CBD5E1] focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">Semua Privasi (Publik & Privat)</option>
            <option value="public">Grup Publik</option>
            <option value="private">Grup Privat</option>
          </select>

          {/* Permission Filter */}
          <select
            value={permissionFilter}
            onChange={(e) => setPermissionFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-[#0D0F15] border border-[#1E293B] rounded-lg text-[#CBD5E1] focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">Semua Izin Post</option>
            <option value="instant">Instant Post (Tanpa Approval)</option>
            <option value="admin_approval">Butuh Persetujuan Admin</option>
          </select>
        </div>
      </div>

      {/* Batch Action Bar if items selected */}
      {selectedGroupIds.length > 0 && (
        <div className="p-3 bg-gradient-to-r from-indigo-950/80 to-blue-950/80 border border-indigo-500/40 rounded-xl flex items-center justify-between animate-fadeIn shadow-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-200">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs ring-1 ring-indigo-400">
              {selectedGroupIds.length}
            </span>
            <span>Grup Terpilih untuk Tindakan Massal</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToPost(selectedGroupIds)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Jadwalkan Auto Post ({selectedGroupIds.length})</span>
            </button>
            <button
              onClick={() => onNavigateToCampaign(selectedGroupIds)}
              className="px-3 py-1.5 text-xs font-semibold text-[#E2E8F0] bg-[#141824] hover:bg-[#1C2336] border border-[#232D42] rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Buat Campaign Komen ({selectedGroupIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroups.map((group) => {
          const isSelected = selectedGroupIds.includes(group.id);

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
                {/* Header with Checkbox & Image */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleGroup(group.id)}
                    className="mt-1 w-4 h-4 rounded text-indigo-600 bg-[#0D0F15] border-[#232D42] focus:ring-indigo-500 cursor-pointer"
                  />
                  <img
                    src={group.coverImage}
                    alt={group.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-[#232D42] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-white leading-tight line-clamp-2 hover:text-indigo-400 transition cursor-pointer" onClick={() => handleToggleGroup(group.id)}>
                      {group.name}
                    </h3>
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
                    </div>
                  </div>
                </div>

                {/* Details Bar */}
                <div className="mt-3.5 p-2.5 rounded-xl bg-[#0D0F15] border border-[#1E293B] space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-[#CBD5E1]">
                    <span className="text-[#94A3B8] flex items-center gap-1">
                      <Users className="w-3 h-3 text-indigo-400" /> Jumlah Member:
                    </span>
                    <span className="font-bold text-white">{(group.memberCount || 0).toLocaleString('id-ID')}</span>
                  </div>

                  <div className="flex items-center justify-between text-[#CBD5E1]">
                    <span className="text-[#94A3B8] flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" /> Izin Posting:
                    </span>
                    {group.postPermission === 'instant' ? (
                      <span className="font-semibold text-emerald-400 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Langsung Terbit
                      </span>
                    ) : (
                      <span className="font-semibold text-amber-400 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" /> Perlu Review Admin
                      </span>
                    )}
                  </div>

                  {group.lastPostedAt && (
                    <div className="flex items-center justify-between text-[#94A3B8] pt-1 border-t border-[#1E293B] text-[10px]">
                      <span>Terakhir Post:</span>
                      <span className="text-[#CBD5E1]">{group.lastPostedAt}</span>
                    </div>
                  )}
                </div>

                {group.description && (
                  <p className="mt-2 text-[11px] text-[#94A3B8] line-clamp-2 italic">
                    {group.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between gap-1.5">
                <button
                  onClick={() => onNavigateToPost([group.id])}
                  title="Jadwalkan post ke grup ini"
                  className="flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition flex items-center justify-center gap-1"
                >
                  <Send className="w-3 h-3" /> Auto Post
                </button>

                <button
                  onClick={() => onNavigateToCampaign([group.id])}
                  title="Buat campaign auto-comment di postingan grup ini"
                  className="flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg bg-[#141824] hover:bg-[#1C2336] text-[#CBD5E1] border border-[#232D42] transition flex items-center justify-center gap-1"
                >
                  <MessageSquare className="w-3 h-3 text-amber-400" /> Komen
                </button>

                <button
                  onClick={() => onOpenInBrowser(group.url)}
                  title="Buka grup di Built-In Browser"
                  className="p-1.5 rounded-lg bg-[#141824] hover:bg-[#1C2336] text-cyan-300 border border-[#232D42] transition"
                >
                  <Globe className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {filteredGroups.length === 0 && (
        <div className="text-center py-12 px-4 bg-[#11141B] rounded-2xl border border-[#1E293B] max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-white font-bold">Belum Ada Grup Tersimpan untuk Akun Ini</p>
            <p className="text-xs text-[#94A3B8] mt-1 max-w-md mx-auto">
              Akun <b>{activeAccount.name}</b> belum memiliki daftar grup Facebook di aplikasi CheapAds.
            </p>
          </div>

          <div className="bg-[#0D0F15] p-3.5 rounded-xl border border-[#1E293B] text-left text-xs space-y-1.5 text-[#CBD5E1]">
            <p className="font-semibold text-indigo-300">Cara Mengambil Daftar Grup Akun Asli Anda:</p>
            <p className="text-[11px] text-[#94A3B8]">1. Buka <b>Browser FB</b> di atas untuk memastikan akun Facebook sudah dalam posisi login.</p>
            <p className="text-[11px] text-[#94A3B8]">2. Di dalam browser FB, buka menu grup Anda (misal: <i>fb.com/groups/joins</i>).</p>
            <p className="text-[11px] text-[#94A3B8]">3. Klik tombol <b>📥 Ambil Semua Grup dari Layar</b> di bilah atas browser, atau klik <b>Sinkronkan Grup Akun</b> di atas.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Clock className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sedang Mensinkronkan...' : 'Sinkronkan Grup Sekarang'}</span>
            </button>
            <button
              onClick={() => onOpenInBrowser('https://www.facebook.com/groups/joins/')}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-xl bg-[#141824] hover:bg-[#1C2336] text-cyan-300 border border-[#232D42] transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Buka Daftar Grup di Browser FB</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
