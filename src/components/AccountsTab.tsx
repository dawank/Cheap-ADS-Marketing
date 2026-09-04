import React, { useState } from 'react';
import { FBAccount, FBGroup, GroupSearchResult } from '../types';
import { 
  UserPlus, 
  Trash2, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Globe, 
  CheckCircle2, 
  Layers, 
  MessageSquare, 
  Send, 
  UserCheck, 
  Key,
  Flame,
  Search,
  Check,
  Pencil,
  X,
  Users,
  Compass
} from 'lucide-react';
import { GroupsTab } from './GroupsTab';
import { GroupSearchTab } from './GroupSearchTab';

interface AccountsTabProps {
  accounts: FBAccount[];
  activeAccountId: string;
  onSelectAccount: (id: string) => void;
  onOpenAddModal: () => void;
  onDeleteAccount: (id: string) => void;
  onRefreshHealth: (id: string) => Promise<void> | void;
  onOpenInBrowser: (accountId: string) => void;
  onRenameAccount?: (id: string, newName: string) => void;
  // Integrated FB Group Management
  groups?: FBGroup[];
  onSyncGroups?: () => void;
  onLeaveGroup?: (groupId: string) => void;
  onNavigateToCampaign?: (groupIds: string[]) => void;
  onOpenUrlInBrowser?: (url: string) => void;
  searchDatabase?: GroupSearchResult[];
  onAutoJoinSelected?: (groupsToJoin: GroupSearchResult[], targetAccountId: string, delaySec: number) => void;
  isJoiningInProgress?: boolean;
  joiningProgress?: { current: number; total: number; currentGroupName: string };
  onCancelJoining?: () => void;
  onAddCustomGroup?: (newGroup: GroupSearchResult) => void;
  onExecuteRealGroupSearch?: (keyword: string) => Promise<GroupSearchResult[]>;
  onClearSearchResults?: () => void;
  onResetSearchResults?: () => void;
  onDeleteSearchResult?: (id: string) => void;
}

export const AccountsTab: React.FC<AccountsTabProps> = ({
  accounts,
  activeAccountId,
  onSelectAccount,
  onOpenAddModal,
  onDeleteAccount,
  onRefreshHealth,
  onOpenInBrowser,
  onRenameAccount,
  groups = [],
  onSyncGroups = () => {},
  onLeaveGroup = () => {},
  onNavigateToCampaign = () => {},
  onOpenUrlInBrowser = () => {},
  searchDatabase = [],
  onAutoJoinSelected = () => {},
  isJoiningInProgress = false,
  joiningProgress = { current: 0, total: 0, currentGroupName: '' },
  onCancelJoining = () => {},
  onAddCustomGroup,
  onExecuteRealGroupSearch,
  onClearSearchResults,
  onResetSearchResults,
  onDeleteSearchResult
}) => {
  const [subTab, setSubTab] = useState<'accounts' | 'my_groups' | 'search_join'>('accounts');
  const [searchFilter, setSearchFilter] = useState('');
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];
  const activeAccountGroups = groups.filter(g => g.accountId === activeAccountId);

  const filteredAccounts = accounts.filter(acc => 
    acc.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    acc.uid.includes(searchFilter) ||
    acc.notes.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleRefresh = async (id: string) => {
    setRefreshingId(id);
    try {
      await onRefreshHealth(id);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshingId(null);
    }
  };

  const getStatusBadge = (status: FBAccount['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Siap Kerja (Active)
          </span>
        );
      case 'cooldown':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            Cooldown (Istirahat)
          </span>
        );
      case 'checkpoint':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Checkpoint FB
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Unverified
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Navigation: Akun Facebook vs Grup Diikuti vs Scrape & Auto-Join */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
        <button
          onClick={() => setSubTab('accounts')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
            subTab === 'accounts'
              ? 'bg-indigo-600/15 text-indigo-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Daftar Akun FB</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            subTab === 'accounts' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'
          }`}>
            {accounts.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('my_groups')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
            subTab === 'my_groups'
              ? 'bg-indigo-600/15 text-indigo-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Grup yang Diikuti Akun</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            subTab === 'my_groups' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'
          }`}>
            {activeAccountGroups.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('search_join')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
            subTab === 'search_join'
              ? 'bg-indigo-600/15 text-indigo-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Scrape & Auto-Join Grup</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            subTab === 'search_join' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'
          }`}>
            {searchDatabase.length}
          </span>
        </button>
      </div>

      {/* SubTab Content 1: Groups Tab */}
      {subTab === 'my_groups' && (
        <GroupsTab
          groups={groups}
          activeAccount={activeAccount}
          onNavigateToPost={() => {}}
          onNavigateToCampaign={onNavigateToCampaign}
          onOpenInBrowser={onOpenUrlInBrowser}
          onLeaveGroup={onLeaveGroup}
          onSyncGroups={onSyncGroups}
        />
      )}

      {/* SubTab Content 2: Search & Auto-Join Tab */}
      {subTab === 'search_join' && (
        <GroupSearchTab
          searchDatabase={searchDatabase}
          accounts={accounts}
          activeAccount={activeAccount}
          onAutoJoinSelected={onAutoJoinSelected}
          isJoiningInProgress={isJoiningInProgress}
          joiningProgress={joiningProgress}
          onCancelJoining={onCancelJoining}
          onOpenInBrowser={onOpenUrlInBrowser}
          onAddCustomGroup={onAddCustomGroup}
          onExecuteRealGroupSearch={onExecuteRealGroupSearch}
          onClearSearchResults={onClearSearchResults}
          onResetSearchResults={onResetSearchResults}
          onDeleteSearchResult={onDeleteSearchResult}
        />
      )}

      {/* SubTab Content 3: Accounts Management Tab */}
      {subTab === 'accounts' && (
        <>
          {/* Header Banner & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Manajemen Akun Facebook</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                  {accounts.length} Akun Terdaftar
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola multi-akun FB untuk auto post, pencarian & auto join grup, dan campaign komen link otomatis.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari akun / UID..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none w-44 sm:w-56"
                />
              </div>

              <button
                id="btn-add-account-tab"
                onClick={onOpenAddModal}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah Akun Baru</span>
              </button>
            </div>
          </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAccounts.map((account) => {
          const isSelected = account.id === activeAccountId;
          const commentPercent = Math.min(100, Math.round((account.dailyCommentCount / account.maxDailyComments) * 100));
          const postPercent = Math.min(100, Math.round((account.dailyPostCount / account.maxDailyPosts) * 100));
          const joinPercent = Math.min(100, Math.round((account.dailyJoinCount / account.maxDailyJoins) * 100));

          return (
            <div
              key={account.id}
              className={`relative flex flex-col justify-between p-5 rounded-xl border transition bg-slate-900 shadow-sm ${
                isSelected 
                  ? 'border-indigo-500/80 ring-1 ring-indigo-500/30' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Active Selection Pin */}
              {isSelected && (
                <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-sm flex items-center gap-1">
                  <Check className="w-3 h-3" /> Akun Aktif Terpilih
                </div>
              )}

              <div>
                {/* Account Top Info */}
                <div className="flex items-start gap-3">
                  <img
                    src={account.avatar || (account.uid ? `https://graph.facebook.com/${account.uid}/picture?type=large` : `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name)}&background=1e1b4b&color=818cf8&bold=true&size=128`)}
                    alt={account.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.onerror = null;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(account.name)}&background=1e1b4b&color=818cf8&bold=true&size=128`;
                    }}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-[#232D42] shadow-md shrink-0 bg-[#141824]"
                  />
                  <div className="flex-1 min-w-0">
                    {editingAccountId === account.id ? (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (editingName.trim()) {
                                onRenameAccount?.(account.id, editingName.trim());
                                setEditingAccountId(null);
                              }
                            } else if (e.key === 'Escape') {
                              setEditingAccountId(null);
                            }
                          }}
                          autoFocus
                          className="px-2 py-0.5 text-xs font-semibold bg-[#0D0F15] border border-indigo-500 rounded text-white focus:outline-none w-full"
                          placeholder="Nama Akun..."
                        />
                        <button
                          onClick={() => {
                            if (editingName.trim()) {
                              onRenameAccount?.(account.id, editingName.trim());
                              setEditingAccountId(null);
                            }
                          }}
                          className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white shrink-0"
                          title="Simpan"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setEditingAccountId(null)}
                          className="p-1 rounded bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] shrink-0"
                          title="Batal"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 group/name">
                        <h3 className="text-sm font-bold text-white truncate hover:text-indigo-400 transition cursor-pointer" onClick={() => onSelectAccount(account.id)}>
                          {account.name}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAccountId(account.id);
                            setEditingName(account.name);
                          }}
                          className="opacity-0 group-hover/name:opacity-100 text-[#94A3B8] hover:text-white p-0.5 rounded hover:bg-[#1E293B] transition shrink-0"
                          title="Ubah Nama Profil / Label"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <p className="text-[11px] font-mono text-[#94A3B8] flex items-center gap-1">
                      <span>UID:</span>
                      <span className="text-[#CBD5E1] font-semibold">{account.uid}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenInBrowser(`https://m.facebook.com/${account.uid}`);
                        }}
                        className="text-indigo-400 hover:text-indigo-300 ml-1"
                        title="Buka Profil Facebook Asli"
                      >
                        <ExternalLink className="w-3 h-3 inline" />
                      </button>
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      {getStatusBadge(account.status)}
                    </div>
                  </div>
                </div>

                {/* Proxy & Info Badges */}
                <div className="mt-3.5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#0D0F15] border border-[#1E293B] text-[#CBD5E1]">
                    <span className="flex items-center gap-1 text-[11px] text-[#94A3B8]">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      Proxy:
                    </span>
                    <span className="font-mono text-[11px] text-cyan-300 truncate max-w-[170px]" title={account.proxy}>
                      {account.proxy || 'Direct IP'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="p-2 rounded-lg bg-[#0D0F15]/70 border border-[#1E293B]/80 text-[#CBD5E1] flex items-center justify-between">
                      <span className="text-[#94A3B8]">Grup Diikuti:</span>
                      <span className="font-bold text-white">{account.joinedGroupsCount} Grup</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#0D0F15]/70 border border-[#1E293B]/80 text-[#CBD5E1] flex items-center justify-between">
                      <span className="text-[#94A3B8]">Halaman Fans:</span>
                      <span className="font-bold text-white">{account.pages?.length || 0} Halaman</span>
                    </div>
                  </div>
                </div>

                {/* Daily Usage Meters */}
                <div className="mt-4 p-3 bg-[#0D0F15] rounded-xl border border-[#1E293B] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#CBD5E1]">
                    <span className="flex items-center gap-1 text-[#94A3B8]">
                      <MessageSquare className="w-3 h-3 text-indigo-400" /> Komen Hari Ini:
                    </span>
                    <span className="font-mono text-[#E2E8F0]">
                      {account.dailyCommentCount} <span className="text-[#64748B]">/ {account.maxDailyComments}</span>
                    </span>
                  </div>
                  <div className="w-full bg-[#1E293B] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${commentPercent > 80 ? 'bg-amber-500' : 'bg-indigo-500'}`} 
                      style={{ width: `${commentPercent}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#CBD5E1] pt-1">
                    <span className="flex items-center gap-1 text-[#94A3B8]">
                      <Send className="w-3 h-3 text-cyan-400" /> Auto Post:
                    </span>
                    <span className="font-mono text-[#E2E8F0]">
                      {account.dailyPostCount} <span className="text-[#64748B]">/ {account.maxDailyPosts}</span>
                    </span>
                  </div>
                  <div className="w-full bg-[#1E293B] h-1.5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-cyan-500" style={{ width: `${postPercent}%` }}></div>
                  </div>
                </div>

                {/* Notes Snippet */}
                {account.notes && (
                  <p className="mt-2.5 text-[11px] text-[#94A3B8] italic line-clamp-1 bg-[#0D0F15] px-2 py-1 rounded border border-[#1E293B]/60">
                    "{account.notes}"
                  </p>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between gap-2">
                {!isSelected ? (
                  <button
                    onClick={() => onSelectAccount(account.id)}
                    className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg bg-[#141824] hover:bg-[#1C2336] text-[#E2E8F0] border border-[#232D42] transition flex items-center justify-center gap-1"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                    Pilih Akun Ini
                  </button>
                ) : (
                  <div className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-center">
                    Sedang Digunakan
                  </div>
                )}

                {/* Open in Built-In Browser Button */}
                <button
                  onClick={() => onOpenInBrowser(account.id)}
                  title="Buka sesi akun ini di Built-In Browser"
                  className="p-1.5 rounded-lg bg-[#141824] hover:bg-[#1C2336] text-cyan-300 border border-[#232D42] transition"
                >
                  <Globe className="w-4 h-4" />
                </button>

                {/* Refresh Health & Profile */}
                <button
                  onClick={() => handleRefresh(account.id)}
                  title="Sinkronkan Nama Asli & Foto Profil Facebook (Cek Sesi)"
                  className="p-1.5 rounded-lg bg-[#141824] hover:bg-[#1C2336] text-[#CBD5E1] hover:text-indigo-400 border border-[#232D42] transition"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshingId === account.id ? 'animate-spin text-indigo-400' : ''}`} />
                </button>

                {/* Delete */}
                <button
                  onClick={() => onDeleteAccount(account.id)}
                  title="Hapus Akun"
                  className="p-1.5 rounded-lg bg-[#141824] hover:bg-rose-950/80 text-[#94A3B8] hover:text-rose-400 border border-[#232D42] hover:border-rose-800 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {filteredAccounts.length === 0 && (
        <div className="text-center py-12 bg-[#11141B] rounded-2xl border border-[#1E293B]">
          <p className="text-sm text-[#94A3B8]">Tidak ada akun Facebook yang cocok dengan pencarian.</p>
          <button
            onClick={onOpenAddModal}
            className="mt-3 px-4 py-2 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition"
          >
            + Tambah Akun Baru
          </button>
        </div>
      )}
        </>
      )}

    </div>
  );
};
