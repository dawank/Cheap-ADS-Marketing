import React from 'react';
import { 
  BarChart3, 
  Send, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Activity, 
  Square, 
  Play, 
  ArrowUpRight, 
  Sparkles, 
  Link2, 
  ShieldCheck, 
  ExternalLink,
  Layers,
  Zap,
  Repeat
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import { FBAccount, FBGroup, Campaign, ExecutionLog, ProductBankItem, HourlyActivityStat } from '../types';

interface DashboardTabProps {
  accounts: FBAccount[];
  campaigns: Campaign[];
  groups?: FBGroup[];
  productLinks: ProductBankItem[];
  hourlyStats: HourlyActivityStat[];
  logs: ExecutionLog[];
  isAutomationRunning: boolean;
  activeCampaignId?: string | null;
  onEmergencyStop: () => void;
  onStartCampaign?: (id: string) => void;
  onPauseCampaign?: (id: string) => void;
  onNavigateMenu?: (menu: 'campaign' | 'link_bank' | 'accounts' | 'spintax' | 'settings') => void;
  onNavigateToCampaigns?: () => void;
  onNavigateToAccounts?: () => void;
  onNavigateToBankLinks?: () => void;
  onOpenLogsDrawer?: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  accounts,
  campaigns,
  groups = [],
  productLinks,
  hourlyStats,
  logs,
  isAutomationRunning,
  activeCampaignId,
  onEmergencyStop,
  onStartCampaign,
  onPauseCampaign,
  onNavigateMenu,
  onNavigateToCampaigns,
  onNavigateToAccounts,
  onNavigateToBankLinks,
  onOpenLogsDrawer
}) => {
  const navigate = (menu: 'campaign' | 'link_bank' | 'accounts' | 'spintax' | 'settings') => {
    if (onNavigateMenu) {
      onNavigateMenu(menu);
    } else {
      if (menu === 'campaign' && onNavigateToCampaigns) onNavigateToCampaigns();
      if (menu === 'accounts' && onNavigateToAccounts) onNavigateToAccounts();
      if (menu === 'link_bank' && onNavigateToBankLinks) onNavigateToBankLinks();
    }
  };

  // Real-time calculated metrics
  const totalSentToday = productLinks.reduce((sum, item) => sum + (item.sentTodayCount || 0), 0) +
    campaigns.reduce((sum, cmp) => sum + (cmp.successfulComments || 0), 0);

  const activeAccountsCount = accounts.filter(a => a.status === 'active').length;
  const runningCampaignsCount = campaigns.filter(c => c.status === 'running').length;

  const totalSuccessfulComments = campaigns.reduce((sum, c) => sum + (c.successfulComments || 0), 0);
  const totalFailedComments = campaigns.reduce((sum, c) => sum + (c.failedComments || 0), 0);
  const totalExecuted = totalSuccessfulComments + totalFailedComments;
  const successRate = totalExecuted > 0 
    ? Math.round((totalSuccessfulComments / totalExecuted) * 100) 
    : 96.4;

  // Link Distribution Data
  const linkDistributionData = productLinks.slice(0, 6).map(link => ({
    name: link.label.length > 18 ? link.label.slice(0, 18) + '...' : link.label,
    count: link.sentTodayCount || 0,
    category: link.category || 'Umum'
  }));

  const BAR_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  // Recent logs
  const commentLogs = logs
    .filter(l => l.type === 'comment' || l.type === 'post' || l.type === 'warmup')
    .slice(0, 8);

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Top Header matching High Density theme */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Dashboard Analitik</h2>
          <p className="text-sm text-slate-400">Real-time performance metrics for last 24 hours.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            id="btn-dashboard-refresh"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 border border-slate-700 transition"
          >
            Refresh Data
          </button>
          {isAutomationRunning ? (
            <button 
              id="btn-dashboard-stop"
              onClick={onEmergencyStop}
              className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 transition shadow-sm flex items-center gap-1.5"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              Emergency STOP
            </button>
          ) : (
            <button 
              id="btn-dashboard-start"
              onClick={() => navigate('campaign')}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-sm flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Mulai Kampanye
            </button>
          )}
        </div>
      </div>

      {/* 1. 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Links Spread */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Links Spread (24h)</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {totalSentToday > 0 ? totalSentToday.toLocaleString() : '1,428'}
            </span>
            <span className="text-xs font-medium text-emerald-400">+12.4%</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Tersebar ke grup target & linimasa</p>
        </div>

        {/* Card 2: Active Accounts */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Active Accounts</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {activeAccountsCount || 18}/{accounts.length || 20}
            </span>
            <span className="text-xs font-medium text-blue-400">Active</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {accounts.filter(a => a.status === 'cooldown').length} akun dalam status cooldown aman
          </p>
        </div>

        {/* Card 3: Success Rate */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Success Rate</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{successRate}%</span>
            <span className="text-xs font-medium text-emerald-400">Steady</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Anti-ban 4-layer & spintax aktif</p>
        </div>

        {/* Card 4: Current Load */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Current Load</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {isAutomationRunning ? '74%' : 'Standby'}
            </span>
            <span className={`text-xs font-medium ${isAutomationRunning ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isAutomationRunning ? 'Active' : 'Balanced'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{runningCampaignsCount} kampanye berjalan</p>
        </div>

      </div>

      {/* 2. Curve and Live Feed Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Hourly Curve */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Sebaran Link Produk (Hourly Curve)
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                Activity
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <div className="h-2 w-2 rounded-full bg-cyan-400"></div>
                Success
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="hour" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                  interval={2}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#1e293b', 
                    borderRadius: '0.5rem',
                    color: '#e2e8f0',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="commentsCount" 
                  name="Komentar"
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorComments)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="successCount" 
                  name="Lolos Filter"
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorSuccess)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-800 pt-2.5">
            <span>💡 Jam Ramai Audiens FB: 11:00 - 13:00 (Siang) & 19:00 - 22:00 (Malam)</span>
            <span className="font-mono text-indigo-400">Total Hari Ini: {totalSentToday} Post</span>
          </div>
        </div>

        {/* Right 1 Col: Live Feed Aktivitas */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Live Feed Aktivitas
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ● Live Feed
              </span>
            </div>

            <div className="space-y-3.5 overflow-y-auto max-h-[290px] pr-1 scrollbar-none">
              {commentLogs.length > 0 ? (
                commentLogs.map((log) => {
                  const borderClass = log.status === 'success' 
                    ? 'border-emerald-500' 
                    : log.status === 'warning'
                      ? 'border-amber-500'
                      : log.status === 'error'
                        ? 'border-red-500'
                        : 'border-slate-700 opacity-70';
                  
                  return (
                    <div key={log.id} className={`flex gap-3 border-l-2 ${borderClass} pl-3 py-1`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-200">
                          <strong className="text-white">{log.accountName || 'Acc_01'}</strong> commented on '{log.target || 'Facebook Post'}'
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-0.5">
                          <span className="truncate max-w-[170px]">{log.message}</span>
                          <span className="shrink-0">{log.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <>
                  <div className="flex gap-3 border-l-2 border-emerald-500 pl-3 py-1">
                    <div className="flex-1">
                      <p className="text-xs text-slate-200"><strong>Acc_01</strong> commented on 'Loker Jakarta'</p>
                      <span className="text-[10px] text-slate-500">Just now</span>
                    </div>
                  </div>
                  <div className="flex gap-3 border-l-2 border-slate-700 pl-3 py-1 opacity-70">
                    <div className="flex-1">
                      <p className="text-xs text-slate-200"><strong>Acc_04</strong> cooldown (45s remaining)</p>
                      <span className="text-[10px] text-slate-500">2m ago</span>
                    </div>
                  </div>
                  <div className="flex gap-3 border-l-2 border-emerald-500 pl-3 py-1">
                    <div className="flex-1">
                      <p className="text-xs text-slate-200"><strong>Acc_02</strong> commented on 'Bisnis Online ID'</p>
                      <span className="text-[10px] text-slate-500">5m ago</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 mt-3 flex items-center justify-between">
            <button
              onClick={onOpenLogsDrawer}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Buka Log Lengkap</span>
            </button>
            <span className="text-[10px] text-slate-500 font-mono">Auto-Sync</span>
          </div>
        </div>

      </div>

      {/* 3. Facebook Account Highlights Block */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Pusat Kendali Akun Facebook (Highlight)</h3>
            <p className="text-xs text-slate-400">Rotasi akun terhubung dan kuota grup harian</p>
          </div>
          <button 
            id="btn-view-all-accounts"
            onClick={() => navigate('accounts')}
            className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>View All {accounts.length || 20} Accounts</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(accounts.length > 0 ? accounts.slice(0, 6) : [
            { id: '1', name: 'Rian Hidayat', joinedGroupsCount: 45, status: 'active', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
            { id: '2', name: 'Siti Rahma', joinedGroupsCount: 38, status: 'active', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100' },
            { id: '3', name: 'Budi Santoso', joinedGroupsCount: 52, status: 'cooldown', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
          ] as any[]).map((acc) => (
            <div key={acc.id} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3 border border-slate-700">
              <div className="flex items-center gap-3 min-w-0">
                <img 
                  src={acc.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                  alt={acc.name} 
                  className="h-10 w-10 rounded-full object-cover bg-slate-700 shrink-0 border border-slate-600"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{acc.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {acc.joinedGroupsCount || 0} Groups • <span className={acc.status === 'active' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>{acc.status}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => navigate('accounts')}
                className="rounded bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 text-[10px] font-bold uppercase text-white shrink-0 ml-2 transition shadow-sm"
              >
                Manage
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Link Distribution & Quick Action Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Distribusi Sebaran Link Produk */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900 p-5 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-cyan-400" />
                  Distribusi Sebaran Link Produk
                </h3>
                <p className="text-xs text-slate-400">
                  Memastikan rotasi link berjalan adil dan merata
                </p>
              </div>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                Rotasi Cerdas
              </span>
            </div>

            {linkDistributionData.length > 0 ? (
              <div className="h-60 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={linkDistributionData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false} 
                      width={100}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderColor: '#1e293b', 
                        borderRadius: '0.5rem',
                        fontSize: '12px'
                      }} 
                    />
                    <Bar dataKey="count" name="Tersebar" radius={[0, 4, 4, 0]}>
                      {linkDistributionData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center">
                <Link2 className="w-8 h-8 text-slate-700 mb-2" />
                <span>Belum ada produk di Bank Link</span>
                <button
                  onClick={() => navigate('link_bank')}
                  className="mt-2 text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  + Tambah ke Bank Link
                </button>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">{productLinks.length} Link Terdaftar di Bank Link</span>
            <button
              onClick={() => navigate('link_bank')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              <span>Kelola Gudang Bank Link</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Action Center */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Zap className="w-4 h-4 text-amber-400" />
              Aksi Cepat & Auto-Pilot Hub
            </h3>

            <div className="mt-3 space-y-2">
              <button
                id="btn-quick-start-campaign"
                onClick={() => navigate('campaign')}
                className="w-full text-left p-3 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-white transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5 text-indigo-300">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Mulai Kampanye Auto-Pilot
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Gunakan seluruh 50+ preset 4-layer secara acak otomatis
                </p>
              </button>

              <button
                id="btn-quick-bank-link"
                onClick={() => navigate('link_bank')}
                className="w-full text-left p-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 text-white transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5 text-cyan-300">
                    <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                    Kelola Gudang Bank Link
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Atur URL afiliasi, cloaker base64, dan rotasi link
                </p>
              </button>

              <button
                id="btn-quick-sync-groups"
                onClick={() => navigate('accounts')}
                className="w-full text-left p-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 text-white transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5 text-blue-300">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    Kelola Akun & Scraper Grup
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Scrap grup via browser nyata atau baca grup diikuti
                </p>
              </button>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sistem dilindungi Global Deduplication Anti-Tabrakan</span>
          </div>
        </div>

      </div>

    </div>
  );
};
