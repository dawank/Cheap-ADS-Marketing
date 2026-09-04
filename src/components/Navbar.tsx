import React from 'react';
import { FBAccount } from '../types';
import { 
  Share2, 
  Users, 
  Globe, 
  Activity, 
  Plus, 
  Layers, 
  ShieldCheck, 
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface NavbarProps {
  accounts: FBAccount[];
  activeAccountId: string;
  onSelectAccount: (id: string) => void;
  onOpenAddAccount: () => void;
  onToggleBrowser: () => void;
  isBrowserOpen: boolean;
  activeCampaignsCount: number;
  scheduledPostsCount: number;
  onOpenLogs: () => void;
  unreadLogsCount: number;
  onOpenExportModal?: () => void;
  onOpenDedupModal?: () => void;
  dedupCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  accounts,
  activeAccountId,
  onSelectAccount,
  onOpenAddAccount,
  onToggleBrowser,
  isBrowserOpen,
  activeCampaignsCount,
  scheduledPostsCount,
  onOpenLogs,
  unreadLogsCount,
  onOpenExportModal,
  onOpenDedupModal,
  dedupCount = 0
}) => {
  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];

  const getStatusBadge = (status: FBAccount['status']) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Aktif</span>;
      case 'cooldown':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20"><Clock className="w-3 h-3" /> Cooldown</span>;
      case 'checkpoint':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20"><AlertTriangle className="w-3 h-3" /> Checkpoint</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">Unverified</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0D0F15]/90 backdrop-blur-xl border-b border-[#1E293B] shadow-2xl">
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-10">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 text-white shadow-lg shadow-indigo-500/20 ring-1 ring-white/15">
              <Share2 className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5 whitespace-nowrap">
                  CheapAds <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">PRO</span>
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8] leading-none whitespace-nowrap hidden sm:block">Facebook Marketing & Auto-Comment Automation</p>
            </div>
          </div>

          {/* Quick Metrics & Account Switcher & Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-4 overflow-x-auto scrollbar-none py-1">
            
            {/* Live Stats Pills */}
            <div className="hidden xl:flex items-center gap-2.5 bg-[#0A0B0E]/80 border border-[#1E293B] rounded-lg p-1 px-3 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-[#CBD5E1] whitespace-nowrap">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Campaign:</span>
                <span className="font-bold text-emerald-400">{activeCampaignsCount} Aktif</span>
              </div>
              <span className="text-[#334155]">|</span>
              <div className="flex items-center gap-1.5 text-xs text-[#CBD5E1] whitespace-nowrap">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Post:</span>
                <span className="font-bold text-indigo-400">{scheduledPostsCount} Terjadwal</span>
              </div>
            </div>

            {/* Account Switcher Dropdown with generous width */}
            {accounts.length > 0 && (
              <div className="flex items-center gap-2 bg-[#141824] hover:bg-[#1A2030] border border-[#232D42] rounded-xl p-1.5 pr-3 transition shrink-0 min-w-[200px] sm:min-w-[240px] max-w-[340px]">
                <img 
                  src={activeAccount?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                  alt={activeAccount?.name}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-[#334155] shrink-0 bg-[#0A0B0E]"
                  onError={(e) => {
                    // Fallback to placeholder if avatar url fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1">
                    <select
                      id="account-switcher"
                      value={activeAccountId}
                      onChange={(e) => onSelectAccount(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-[#E2E8F0] outline-none cursor-pointer truncate w-full pr-1"
                      title="Ganti Akun Facebook Aktif"
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id} className="bg-[#0D0F15] text-[#E2E8F0]">
                          {acc.name} ({acc.status})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {activeAccount && (
                  <div className="shrink-0">
                    {getStatusBadge(activeAccount.status)}
                  </div>
                )}
              </div>
            )}

            {/* Anti-Tabrakan Database Quick Access */}
            {onOpenDedupModal && (
              <button
                id="btn-nav-dedup"
                onClick={onOpenDedupModal}
                title="Buka Database Anti-Tabrakan (Global Deduplication)"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition shrink-0 whitespace-nowrap"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono text-[11px]">{dedupCount} Post Terproteksi</span>
              </button>
            )}

            {/* Desktop App Build Export Trigger */}
            {onOpenExportModal && (
              <button
                id="btn-nav-export-desktop"
                onClick={onOpenExportModal}
                title="Export Script & Build Desktop App (Electron)"
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/60 transition shadow-sm shrink-0 whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>Build Desktop</span>
              </button>
            )}

            {/* Add Account Quick Button */}
            <button
              id="btn-add-account-nav"
              onClick={onOpenAddAccount}
              title="Tambah Akun FB Baru"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#141824] hover:bg-[#1C2336] text-[#E2E8F0] border border-[#232D42] transition shrink-0 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tambah Akun</span>
            </button>

            {/* Built-in Browser Trigger Button */}
            <button
              id="btn-toggle-builtin-browser"
              onClick={onToggleBrowser}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition shadow-sm shrink-0 whitespace-nowrap ${
                isBrowserOpen 
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-indigo-400 shadow-indigo-500/25 ring-2 ring-indigo-500/30' 
                  : 'bg-[#121829] hover:bg-[#1A233A] text-indigo-300 border-indigo-800/60'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Built-in Browser</span>
              <span className="sm:hidden">Browser</span>
              {isBrowserOpen && <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping"></span>}
            </button>

            {/* System Logs Button */}
            <button
              id="btn-open-logs"
              onClick={onOpenLogs}
              title="Log Eksekusi & Otomatisasi"
              className="relative p-2 rounded-lg bg-[#141824] hover:bg-[#1C2336] text-[#94A3B8] hover:text-[#E2E8F0] border border-[#232D42] transition shrink-0"
            >
              <Layers className="w-4 h-4" />
              {unreadLogsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 text-[10px] font-bold text-white flex items-center justify-center shadow-sm">
                  {unreadLogsCount > 9 ? '9+' : unreadLogsCount}
                </span>
              )}
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
