import React from 'react';
import { 
  BarChart3, 
  Rocket, 
  Link2, 
  Users, 
  BookOpen, 
  Settings, 
  Share2, 
  Globe, 
  Layers, 
  Square,
  Activity,
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { FBAccount, Campaign } from '../types';

export type MainNavMenu = 'dashboard' | 'campaign' | 'link_bank' | 'accounts' | 'spintax' | 'settings';

interface SidebarProps {
  currentMenu: MainNavMenu;
  onSelectMenu: (menu: MainNavMenu) => void;
  accounts: FBAccount[];
  activeAccountId: string;
  onSelectAccount: (id: string) => void;
  campaigns: Campaign[];
  isAutomationRunning: boolean;
  onEmergencyStop: () => void;
  onToggleBrowser: () => void;
  isBrowserOpen: boolean;
  onOpenLogs: () => void;
  unreadLogsCount: number;
  productLinksCount: number;
  dedupCount: number;
  onOpenDedupModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMenu,
  onSelectMenu,
  accounts,
  activeAccountId,
  onSelectAccount,
  campaigns,
  isAutomationRunning,
  onEmergencyStop,
  onToggleBrowser,
  isBrowserOpen,
  onOpenLogs,
  unreadLogsCount,
  productLinksCount,
  dedupCount,
  onOpenDedupModal
}) => {
  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];
  const activeCampaignsCount = campaigns.filter(c => c.status === 'running').length;

  const navItems = [
    {
      id: 'dashboard' as MainNavMenu,
      label: 'Dashboard Analitik',
      subtitle: 'Metrik 24 jam & grafik visual',
      icon: BarChart3,
      badge: isAutomationRunning ? 'LIVE' : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'campaign' as MainNavMenu,
      label: 'Manajer Kampanye',
      subtitle: 'Auto-pilot & kontrol instan',
      icon: Rocket,
      badge: activeCampaignsCount > 0 ? `${activeCampaignsCount} Aktif` : undefined,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
    },
    {
      id: 'link_bank' as MainNavMenu,
      label: 'Bank Link & Produk',
      subtitle: 'Gudang URL & smart cloaker',
      icon: Link2,
      badge: productLinksCount > 0 ? `${productLinksCount} Link` : undefined,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
    },
    {
      id: 'accounts' as MainNavMenu,
      label: 'Akun & Grup FB',
      subtitle: 'Profil, scraper & smart join',
      icon: Users,
      badge: accounts.length > 0 ? `${accounts.length} Akun` : undefined,
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    },
    {
      id: 'spintax' as MainNavMenu,
      label: 'Pustaka 50+ Spintax',
      subtitle: 'Preset 4-layer & anti-ban',
      icon: BookOpen,
      badge: '50+ Preset',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    {
      id: 'settings' as MainNavMenu,
      label: 'Pengaturan Mesin',
      subtitle: 'Jeda manusia & background mode',
      icon: Settings,
      badge: undefined,
      badgeColor: ''
    }
  ];

  return (
    <aside className="w-64 shrink-0 bg-slate-900/50 border-r border-slate-800 flex flex-col h-screen select-none z-30">
      
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm shrink-0">
            C
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              Cheap ADS
              <span className="text-xs font-normal text-slate-500 underline">v2.0</span>
            </h1>
          </div>
        </div>
      </div>

      {/* Account Quick Selector Card */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/30">
        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 px-1 mb-1.5 flex items-center justify-between">
          <span>Akun Aktif</span>
          {activeAccount && (
            <span className="text-[10px] text-emerald-400 font-mono">
              ● Sesi Siap
            </span>
          )}
        </div>
        
        {accounts.length > 0 ? (
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-800/50 border border-slate-700/80 hover:border-slate-600 transition">
            <img 
              src={activeAccount?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
              alt={activeAccount?.name || 'Account'} 
              className="w-7 h-7 rounded-md object-cover ring-1 ring-slate-700 bg-slate-900 shrink-0"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <div className="flex-1 min-w-0">
              <select
                id="sidebar-account-select"
                value={activeAccountId}
                onChange={(e) => onSelectAccount(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-white outline-none cursor-pointer truncate"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id} className="bg-slate-900 text-white">
                    {acc.name} ({acc.status})
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 truncate mt-0.5">
                <span>UID: {activeAccount?.uid || '-'}</span>
                <span>•</span>
                <span>{activeAccount?.joinedGroupsCount || 0} Grup</span>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onSelectMenu('accounts')}
            className="w-full text-left p-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-indigo-500 text-xs text-indigo-300 flex items-center justify-between"
          >
            <span>+ Hubungkan Akun FB</span>
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
          </button>
        )}
      </div>

      {/* Main 6 Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-none">
        <div className="px-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Menu Utama
        </div>

        {navItems.map((item) => {
          const isActive = currentMenu === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onSelectMenu(item.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between transition group relative ${
                isActive 
                  ? 'bg-indigo-600/10 text-indigo-400' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0">
                  {isActive ? (
                    <div className="h-4 w-4 bg-indigo-400 rounded-sm opacity-90 flex items-center justify-center">
                      <Icon className="w-3 h-3 text-slate-950" />
                    </div>
                  ) : (
                    <div className="h-4 w-4 border border-slate-600 rounded-sm flex items-center justify-center group-hover:border-slate-400">
                      <Icon className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-200" />
                    </div>
                  )}
                </div>
                <span className={`text-sm truncate ${isActive ? 'font-medium text-indigo-400' : 'text-slate-300 font-medium'}`}>
                  {item.label}
                </span>
              </div>

              {item.badge && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${
                  isActive 
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Engine Status & Emergency Stop Banner */}
      <div className="border-t border-slate-800 p-4 space-y-3 bg-slate-900/40">
        {/* Engine Status Card */}
        <div className={`flex items-center justify-between rounded-md p-3 border transition ${
          isAutomationRunning 
            ? 'bg-emerald-500/10 border-emerald-500/20' 
            : 'bg-slate-800/40 border-slate-700/60'
        }`}>
          <div className="flex flex-col">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              isAutomationRunning ? 'text-emerald-500' : 'text-slate-500'
            }`}>
              Engine Status
            </span>
            <span className={`text-sm font-semibold ${
              isAutomationRunning ? 'text-emerald-400' : 'text-slate-300'
            }`}>
              {isAutomationRunning ? 'Auto-Pilot Active' : 'Standby / Ready'}
            </span>
          </div>
          <div className={`h-2 w-2 rounded-full ${
            isAutomationRunning ? 'animate-pulse bg-emerald-500' : 'bg-slate-500'
          }`}></div>
        </div>

        {/* Emergency Stop Button (Highlighted when running) */}
        {isAutomationRunning && (
          <button
            id="btn-emergency-stop-sidebar"
            onClick={onEmergencyStop}
            className="w-full rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 transition shadow-sm flex items-center justify-center gap-2"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Emergency STOP</span>
          </button>
        )}

        {/* Quick Utility Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            id="btn-sidebar-browser"
            onClick={onToggleBrowser}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium border transition ${
              isBrowserOpen 
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Browser FB</span>
          </button>

          <button
            id="btn-sidebar-logs"
            onClick={onOpenLogs}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition relative"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Log Sistem</span>
            {unreadLogsCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            )}
          </button>
        </div>
      </div>

    </aside>
  );
};
