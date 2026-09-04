import React from 'react';
import { 
  BarChart3, 
  Rocket, 
  Link2, 
  Users, 
  BookOpen, 
  Settings, 
  Globe, 
  Layers, 
  ShieldCheck, 
  Plus, 
  Square,
  Sparkles,
  ExternalLink,
  Zap,
  Activity,
  AlertCircle
} from 'lucide-react';
import { FBAccount } from '../types';
import { MainNavMenu } from './Sidebar';

interface HeaderProps {
  currentMenu: MainNavMenu;
  accounts: FBAccount[];
  activeAccountId: string;
  onSelectAccount: (id: string) => void;
  onOpenAddAccount: () => void;
  isAutomationRunning: boolean;
  onEmergencyStop: () => void;
  onToggleBrowser: () => void;
  isBrowserOpen: boolean;
  onOpenLogs: () => void;
  unreadLogsCount: number;
  onOpenDedupModal?: () => void;
  dedupCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentMenu,
  accounts,
  activeAccountId,
  onSelectAccount,
  onOpenAddAccount,
  isAutomationRunning,
  onEmergencyStop,
  onToggleBrowser,
  isBrowserOpen,
  onOpenLogs,
  unreadLogsCount,
  onOpenDedupModal,
  dedupCount = 0
}) => {
  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];

  const getMenuInfo = () => {
    switch (currentMenu) {
      case 'dashboard':
        return {
          title: 'Dashboard Analitik & Performa 24 Jam',
          subtitle: 'Pemantauan sebaran link, grafik aktivitas jam-ke-jam, dan status live feed',
          icon: BarChart3
        };
      case 'campaign':
        return {
          title: 'Manajer Kampanye (Campaign Hub)',
          subtitle: 'Auto-pilot 50+ preset, rotasi bank link, dan pengontrol eksekusi instan',
          icon: Rocket
        };
      case 'link_bank':
        return {
          title: 'Bank Link & Gudang Produk',
          subtitle: 'Pusat penyimpanan URL afiliasi/produk, sub-ID dinamis, dan smart cloaker',
          icon: Link2
        };
      case 'accounts':
        return {
          title: 'Manajemen Akun & Grup Facebook Terintegrasi',
          subtitle: 'Profil akun, penampil grup diikuti, scraper browser asli, dan smart join',
          icon: Users
        };
      case 'spintax':
        return {
          title: 'Pustaka 50+ Preset Spintax & Generator 4-Layer',
          subtitle: 'Koleksi kalimat anti-ban siap pakai dengan jutaan variasi dan emoji jitter',
          icon: BookOpen
        };
      case 'settings':
        return {
          title: 'Pengaturan Mesin Otomasi & Keamanan',
          subtitle: 'Jeda manusiawi, batas kecepatan aman, dan mode latar belakang 24 jam',
          icon: Settings
        };
    }
  };

  const info = getMenuInfo();
  const Icon = info.icon;

  return (
    <header className="sticky top-0 z-20 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Current Menu Title & Description */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-indigo-400 shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-white tracking-tight truncate">
              {info.title}
            </h1>
            <p className="text-xs text-slate-400 truncate hidden sm:block">
              {info.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Actions, Status & Switcher */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Emergency Stop Instant Button (Always visible if running) */}
          {isAutomationRunning && (
            <button
              id="btn-header-stop-emergency"
              onClick={onEmergencyStop}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 transition shadow-sm"
              title="Hentikan otomasi seketika dan tutup browser worker"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Emergency STOP</span>
              <span className="sm:hidden">STOP</span>
            </button>
          )}

          {/* Deduplication Counter */}
          {onOpenDedupModal && (
            <button
              id="btn-header-dedup"
              onClick={onOpenDedupModal}
              title="Database Anti-Tabrakan (Global Deduplication)"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="font-mono">{dedupCount} Proteksi</span>
            </button>
          )}

          {/* Account Selector */}
          {accounts.length > 0 && (
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
              <img
                src={activeAccount?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={activeAccount?.name}
                className="w-5 h-5 rounded-md object-cover bg-slate-900"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
              <select
                value={activeAccountId}
                onChange={(e) => onSelectAccount(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer max-w-[150px] truncate"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id} className="bg-slate-900 text-white">
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Add Account Button */}
          <button
            id="btn-header-add-account"
            onClick={onOpenAddAccount}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Tambah Akun</span>
          </button>

          {/* Browser Toggle */}
          <button
            id="btn-header-browser"
            onClick={onToggleBrowser}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isBrowserOpen 
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Browser</span>
          </button>

          {/* Logs Drawer Trigger */}
          <button
            id="btn-header-logs"
            onClick={onOpenLogs}
            className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Buka Log Aktivitas Real-time"
          >
            <Layers className="w-4 h-4" />
            {unreadLogsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-indigo-500 text-[9px] font-bold text-white flex items-center justify-center">
                {unreadLogsCount > 9 ? '9+' : unreadLogsCount}
              </span>
            )}
          </button>

        </div>

      </div>
    </header>
  );
};
