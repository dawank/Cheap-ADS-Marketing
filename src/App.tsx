import React, { useState, useEffect, useRef } from 'react';
import { 
  FBAccount, 
  FBGroup, 
  GroupSearchResult, 
  Campaign, 
  ExecutionLog, 
  GlobalPostHistory,
  ProductBankItem,
  EngineSettings,
  HourlyActivityStat
} from './types';
import { 
  INITIAL_ACCOUNTS, 
  INITIAL_GROUPS, 
  MOCK_SEARCHABLE_GROUPS, 
  INITIAL_CAMPAIGNS, 
  INITIAL_GLOBAL_POST_HISTORY, 
  DEFAULT_ENGINE_SETTINGS, 
  INITIAL_PRODUCT_BANK, 
  INITIAL_LOGS,
  generateInitialHourlyStats 
} from './data/mockData';
import { SPINTAX_PRESETS, parseSpintax, generateRandom4LayerComment } from './utils/spintax';
import { generateCloakedLink } from './utils/linkCloaker';

// Components
import { Sidebar, MainNavMenu } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardTab } from './components/DashboardTab';
import { CampaignTab } from './components/CampaignTab';
import { LinkBankTab } from './components/LinkBankTab';
import { AccountsTab } from './components/AccountsTab';
import { SpintaxTab } from './components/SpintaxTab';
import { SettingsTab } from './components/SettingsTab';

// Modals & Drawers
import { AddAccountModal } from './components/AddAccountModal';
import { BuiltInBrowser } from './components/BuiltInBrowser';
import { LogsDrawer } from './components/LogsDrawer';
import { GlobalDedupModal } from './components/GlobalDedupModal';
import { SpintaxModal } from './components/SpintaxModal';
import { CloudflareWorkerModal } from './components/CloudflareWorkerModal';
import { ElectronExportModal } from './components/ElectronExportModal';

export default function App() {
  // Navigation State
  const [currentMenu, setCurrentMenu] = useState<MainNavMenu>('dashboard');

  // Core Data States with LocalStorage Persistence
  const [accounts, setAccounts] = useState<FBAccount[]>(() => {
    try {
      const saved = localStorage.getItem('cheapads_accounts');
      return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
    } catch {
      return INITIAL_ACCOUNTS;
    }
  });

  const [activeAccountId, setActiveAccountId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('cheapads_active_account_id');
      if (saved && accounts.some(a => a.id === saved)) return saved;
      return accounts[0]?.id || 'acc-1';
    } catch {
      return accounts[0]?.id || 'acc-1';
    }
  });

  const [groups, setGroups] = useState<FBGroup[]>(() => {
    try {
      const saved = localStorage.getItem('cheapads_groups');
      return saved ? JSON.parse(saved) : INITIAL_GROUPS;
    } catch {
      return INITIAL_GROUPS;
    }
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    try {
      const saved = localStorage.getItem('cheapads_campaigns');
      return saved ? JSON.parse(saved) : INITIAL_CAMPAIGNS;
    } catch {
      return INITIAL_CAMPAIGNS;
    }
  });

  const [productLinks, setProductLinks] = useState<ProductBankItem[]>(() => {
    try {
      const saved = localStorage.getItem('cheapads_product_bank');
      return saved ? JSON.parse(saved) : INITIAL_PRODUCT_BANK;
    } catch {
      return INITIAL_PRODUCT_BANK;
    }
  });

  const [engineSettings, setEngineSettings] = useState<EngineSettings>(() => {
    try {
      const saved = localStorage.getItem('cheapads_engine_settings');
      return saved ? JSON.parse(saved) : DEFAULT_ENGINE_SETTINGS;
    } catch {
      return DEFAULT_ENGINE_SETTINGS;
    }
  });

  const [searchDatabase, setSearchDatabase] = useState<GroupSearchResult[]>(() => {
    try {
      const saved = localStorage.getItem('cheapads_search_groups');
      return saved ? JSON.parse(saved) : MOCK_SEARCHABLE_GROUPS;
    } catch {
      return MOCK_SEARCHABLE_GROUPS;
    }
  });

  const [globalPostHistory, setGlobalPostHistory] = useState<GlobalPostHistory[]>(() => {
    try {
      const saved = localStorage.getItem('cheapads_global_post_history');
      return saved ? JSON.parse(saved) : INITIAL_GLOBAL_POST_HISTORY;
    } catch {
      return INITIAL_GLOBAL_POST_HISTORY;
    }
  });

  const [logs, setLogs] = useState<ExecutionLog[]>(() => {
    try {
      const saved = localStorage.getItem('cheapads_logs');
      return saved ? JSON.parse(saved) : INITIAL_LOGS;
    } catch {
      return INITIAL_LOGS;
    }
  });

  const [hourlyStats, setHourlyStats] = useState<HourlyActivityStat[]>(() => {
    return generateInitialHourlyStats();
  });

  // Automation Engine Running States
  const [isAutomationRunning, setIsAutomationRunning] = useState(false);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const automationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const automationCancelledRef = useRef<boolean>(false);

  // Group Joining Progress State
  const [isJoiningInProgress, setIsJoiningInProgress] = useState(false);
  const [joiningProgress, setJoiningProgress] = useState<{ current: number; total: number; currentGroupName: string }>({
    current: 0,
    total: 0,
    currentGroupName: ''
  });
  const joinCancelledRef = useRef<boolean>(false);

  // Modals Visibility
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [browserInitialUrl, setBrowserInitialUrl] = useState<string | undefined>(undefined);
  const [isLogsDrawerOpen, setIsLogsDrawerOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isDedupModalOpen, setIsDedupModalOpen] = useState(false);
  const [isSpintaxModalOpen, setIsSpintaxModalOpen] = useState(false);
  const [isCloudflareModalOpen, setIsCloudflareModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('cheapads_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('cheapads_active_account_id', activeAccountId);
  }, [activeAccountId]);

  useEffect(() => {
    localStorage.setItem('cheapads_groups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('cheapads_campaigns', JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem('cheapads_product_bank', JSON.stringify(productLinks));
  }, [productLinks]);

  useEffect(() => {
    localStorage.setItem('cheapads_engine_settings', JSON.stringify(engineSettings));
  }, [engineSettings]);

  useEffect(() => {
    localStorage.setItem('cheapads_search_groups', JSON.stringify(searchDatabase));
  }, [searchDatabase]);

  useEffect(() => {
    localStorage.setItem('cheapads_global_post_history', JSON.stringify(globalPostHistory));
  }, [globalPostHistory]);

  useEffect(() => {
    localStorage.setItem('cheapads_logs', JSON.stringify(logs.slice(0, 300)));
  }, [logs]);

  // Listen to IPC Logs from Electron
  useEffect(() => {
    if (window.electronFB?.onAutomationLog) {
      const unsubscribe = window.electronFB.onAutomationLog((newLog) => {
        addLog(newLog);
      });
      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    }
  }, []);

  // Helper: Append a new log item
  const addLog = (logItem: Omit<ExecutionLog, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) => {
    const fullLog: ExecutionLog = {
      id: logItem.id || `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: logItem.timestamp || new Date().toTimeString().slice(0, 8),
      type: logItem.type,
      status: logItem.status,
      accountName: logItem.accountName,
      target: logItem.target,
      message: logItem.message,
      details: logItem.details,
      linkUrl: logItem.linkUrl
    };

    setLogs(prev => [fullLog, ...prev.slice(0, 299)]);
  };

  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];

  // ==========================================
  // EMERGENCY STOP ENGINE
  // ==========================================
  const handleEmergencyStop = async () => {
    console.warn('[EMERGENCY STOP] Menghentikan seluruh proses otomasi...');
    automationCancelledRef.current = true;
    joinCancelledRef.current = true;
    setIsAutomationRunning(false);
    setIsJoiningInProgress(false);
    setActiveCampaignId(null);

    if (automationTimerRef.current) {
      clearTimeout(automationTimerRef.current);
      automationTimerRef.current = null;
    }

    // Call Electron Backend IPC stop
    if (window.electronFB?.stopAutomation) {
      try {
        await window.electronFB.stopAutomation();
      } catch (err) {
        console.error('[Emergency Stop IPC Error]:', err);
      }
    }

    // Update campaign statuses to paused
    setCampaigns(prev => prev.map(c => ({
      ...c,
      status: 'paused'
    })));

    addLog({
      type: 'system',
      status: 'warning',
      accountName: activeAccount?.name || 'Sistem',
      target: 'Emergency Stop Controller',
      message: '🛑 EMERGENSI: Seluruh proses loop otomasi dan browser berhasil dihentikan seketika tanpa sisa proses.'
    });
  };

  // ==========================================
  // CAMPAIGN AUTO-PILOT EXECUTION
  // ==========================================
  const handleStartCampaign = async (campaignId: string) => {
    const targetCampaign = campaigns.find(c => c.id === campaignId);
    if (!targetCampaign) return;

    const campAccount = accounts.find(a => a.id === targetCampaign.accountId) || activeAccount;
    if (!campAccount) {
      alert('Pilih atau tambahkan akun Facebook yang valid terlebih dahulu!');
      return;
    }

    if (campAccount.status === 'checkpoint') {
      alert(`Akun "${campAccount.name}" berstatus Checkpoint! Harap pulihkan akun sebelum menjalankan campaign.`);
      return;
    }

    // Set Running State
    automationCancelledRef.current = false;
    setIsAutomationRunning(true);
    setActiveCampaignId(campaignId);

    setCampaigns(prev => prev.map(c => 
      c.id === campaignId ? { ...c, status: 'active' } : c
    ));

    const campaignGroups = groups.filter(g => targetCampaign.groupIds.includes(g.id));
    const targetGroupsToProcess = campaignGroups.length > 0 
      ? campaignGroups 
      : [{ id: 'grp-demo', name: 'Grup Target Campaign', url: 'https://facebook.com/groups/target', memberCount: 15000, privacy: 'public', category: 'Umum', postPermission: 'instant' } as FBGroup];

    addLog({
      type: 'comment',
      status: 'info',
      accountName: campAccount.name,
      target: targetCampaign.name,
      message: `Memulai Auto-Pilot: "${targetCampaign.name}" (${targetGroupsToProcess.length} target grup, Mode Latar Belakang: ${targetCampaign.runInBackground ? 'Aktif' : 'Nonaktif'}).`
    });

    // Determine Link Pool (Bank Link vs Manual)
    let activePromoLinks: string[] = [];
    if (targetCampaign.linkSource === 'bank' && targetCampaign.selectedBankLinkIds && targetCampaign.selectedBankLinkIds.length > 0) {
      const selectedBankItems = productLinks.filter(p => targetCampaign.selectedBankLinkIds?.includes(p.id) && p.isActive);
      activePromoLinks = selectedBankItems.map(p => {
        return generateCloakedLink(p.originalUrl, 'app', p.cloakerMode);
      });
    }

    if (activePromoLinks.length === 0) {
      activePromoLinks = targetCampaign.productLinks.map(p => {
        return generateCloakedLink(p.originalUrl, 'app', targetCampaign.cloakerMode);
      });
    }

    if (activePromoLinks.length === 0) {
      activePromoLinks = ['https://shopee.co.id/promo-spesial-hari-ini'];
    }

    // If running in Desktop Electron environment
    if (window.electronFB?.runHumanGroupCommentCycle) {
      try {
        const result = await window.electronFB.runHumanGroupCommentCycle({
          partition: 'persist:' + (campAccount.uid || campAccount.id),
          cookieString: campAccount.cookie,
          targetGroups: targetGroupsToProcess.map(g => ({ url: g.url, name: g.name })),
          commentTemplates: targetCampaign.commentTemplates,
          shareLinks: activePromoLinks,
          useLinkRotator: true,
          enableSubId: targetCampaign.enableSubId,
          subIdPrefix: 'cheapads',
          accountName: campAccount.name,
          delayMinSeconds: targetCampaign.minDelaySeconds,
          delayMaxSeconds: targetCampaign.maxDelaySeconds,
          keystrokeEmulation: engineSettings.keystrokeEmulation,
          likeBeforeComment: targetCampaign.likeBeforeComment,
          stealthMode: targetCampaign.stealthMode,
          stealthEditDelaySeconds: targetCampaign.stealthEditDelaySeconds,
          smartCloakerEnabled: targetCampaign.smartCloakerEnabled,
          cloakerMode: targetCampaign.cloakerMode,
          showBrowser: !targetCampaign.runInBackground && engineSettings.showBrowserWindow,
          runInBackground: targetCampaign.runInBackground,
          maxGroupsToProcess: targetGroupsToProcess.length
        });

        if (result.cancelled) {
          addLog({
            type: 'system',
            status: 'warning',
            accountName: campAccount.name,
            target: targetCampaign.name,
            message: 'Campaign Auto-Pilot dihentikan sebelum selesai.'
          });
        } else {
          addLog({
            type: 'system',
            status: 'success',
            accountName: campAccount.name,
            target: targetCampaign.name,
            message: `Campaign selesai dijalankan. Berhasil kirim: ${result.successfulCount || 0} komentar.`
          });
        }
      } catch (err: any) {
        addLog({
          type: 'system',
          status: 'error',
          accountName: campAccount.name,
          target: targetCampaign.name,
          message: `Gagal menjalankan campaign: ${err?.message || err}`
        });
      } finally {
        setIsAutomationRunning(false);
        setActiveCampaignId(null);
        setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'paused' } : c));
      }
      return;
    }

    // Fallback / Web Simulator: Simulates realistic human actions step-by-step
    let groupIdx = 0;
    const runStep = () => {
      if (automationCancelledRef.current) {
        setIsAutomationRunning(false);
        setActiveCampaignId(null);
        return;
      }

      if (groupIdx >= targetGroupsToProcess.length) {
        addLog({
          type: 'system',
          status: 'success',
          accountName: campAccount.name,
          target: targetCampaign.name,
          message: `Siklus Auto-Pilot selesai untuk semua (${targetGroupsToProcess.length}) grup target.`
        });
        setIsAutomationRunning(false);
        setActiveCampaignId(null);
        setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'paused' } : c));
        return;
      }

      const currentGroup = targetGroupsToProcess[groupIdx];
      const randomLink = activePromoLinks[Math.floor(Math.random() * activePromoLinks.length)];
      
      let commentText = '';
      if (targetCampaign.usePresetTemplates) {
        commentText = generateRandom4LayerComment(randomLink);
      } else {
        const rawTemplate = targetCampaign.commentTemplates[Math.floor(Math.random() * targetCampaign.commentTemplates.length)] || 'Cek promo menarik: {LINK}';
        commentText = parseSpintax(rawTemplate.replace(/{LINK}/gi, randomLink));
      }

      // 1. Simulasikan baca postingan & beri reaksi Like
      addLog({
        type: 'comment',
        status: 'info',
        accountName: campAccount.name,
        target: currentGroup.name,
        message: `Menganalisa postingan segar di grup: ${currentGroup.name} (Memberikan like & emulasi ketik)...`
      });

      // 2. Kirim komentar
      setTimeout(() => {
        if (automationCancelledRef.current) return;

        // Dedup History Record
        const newHist: GlobalPostHistory = {
          id: `hist-${Date.now()}`,
          postUrl: `${currentGroup.url}/posts/${Math.floor(Math.random() * 899999 + 100000)}`,
          groupId: currentGroup.id,
          groupName: currentGroup.name,
          accountId: campAccount.id,
          accountName: campAccount.name,
          commentText: commentText,
          timestamp: new Date().toISOString()
        };
        setGlobalPostHistory(prev => [newHist, ...prev]);

        // Update Campaign Stats
        setCampaigns(prev => prev.map(c => {
          if (c.id === campaignId) {
            return {
              ...c,
              stats: {
                ...c.stats,
                totalCommentsSent: c.stats.totalCommentsSent + 1,
                successfulComments: c.stats.successfulComments + 1,
                estimatedClicks: c.stats.estimatedClicks + Math.floor(Math.random() * 3 + 1)
              }
            };
          }
          return c;
        }));

        // Update Account Counters
        setAccounts(prev => prev.map(a => {
          if (a.id === campAccount.id) {
            return {
              ...a,
              dailyCommentCount: a.dailyCommentCount + 1,
              lastActive: 'Baru saja'
            };
          }
          return a;
        }));

        // Update Hourly Stats
        const currentHour = `${new Date().getHours().toString().padStart(2, '0')}:00`;
        setHourlyStats(prev => prev.map(stat => {
          if (stat.hour === currentHour) {
            return {
              ...stat,
              commentsCount: stat.commentsCount + 1,
              successCount: stat.successCount + 1
            };
          }
          return stat;
        }));

        addLog({
          type: 'comment',
          status: 'success',
          accountName: campAccount.name,
          target: currentGroup.name,
          message: `Berhasil kirim komentar promosi ke ${currentGroup.name}: "${commentText.slice(0, 60)}..."`,
          linkUrl: randomLink
        });

        groupIdx++;
        const nextDelay = Math.floor(Math.random() * (targetCampaign.maxDelaySeconds - targetCampaign.minDelaySeconds + 1) + targetCampaign.minDelaySeconds) * 1000;
        automationTimerRef.current = setTimeout(runStep, Math.min(nextDelay, 6000));
      }, 2500);
    };

    runStep();
  };

  const handlePauseCampaign = (campaignId: string) => {
    if (activeCampaignId === campaignId) {
      handleEmergencyStop();
    } else {
      setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'paused' } : c));
    }
  };

  const handleToggleCampaignStatus = (id: string, newStatus: 'active' | 'paused') => {
    if (newStatus === 'active') {
      handleStartCampaign(id);
    } else {
      handlePauseCampaign(id);
    }
  };

  const handleCreateCampaign = (newCamp: Campaign) => {
    setCampaigns(prev => [newCamp, ...prev]);
    const grpCount = (newCamp.groupIds || newCamp.targetGroupIds || []).length;
    addLog({
      type: 'system',
      status: 'info',
      accountName: activeAccount?.name || 'Sistem',
      target: newCamp.name,
      message: `Campaign baru dibuat: "${newCamp.name}" dengan ${grpCount} target grup.`
    });
  };

  const handleDeleteCampaign = (id: string) => {
    if (activeCampaignId === id) {
      handleEmergencyStop();
    }
    setCampaigns(prev => prev.filter(c => c.id !== id));
    addLog({
      type: 'system',
      status: 'info',
      accountName: 'Sistem',
      target: 'Campaign Manager',
      message: `Campaign ID "${id}" telah dihapus.`
    });
  };

  // ==========================================
  // FB GROUP SYNC & AUTO JOIN
  // ==========================================
  const handleSyncGroups = async () => {
    if (!activeAccount) return;

    addLog({
      type: 'system',
      status: 'info',
      accountName: activeAccount.name,
      target: 'Group Synchronizer',
      message: `Melakukan sinkronisasi daftar grup untuk akun "${activeAccount.name}"...`
    });

    if (window.electronFB?.fetchMyJoinedGroups) {
      try {
        const res = await window.electronFB.fetchMyJoinedGroups({
          partition: 'persist:' + (activeAccount.uid || activeAccount.id),
          cookieString: activeAccount.cookie,
          accountId: activeAccount.id
        });

        if (res.success && res.groups.length > 0) {
          // Merge unique groups
          setGroups(prev => {
            const existingIds = new Set(prev.map(g => g.url));
            const newGroups = res.groups.filter(g => !existingIds.has(g.url));
            return [...newGroups, ...prev];
          });

          setAccounts(prev => prev.map(a => 
            a.id === activeAccount.id 
              ? { ...a, joinedGroupCount: res.groups.length, lastActive: 'Baru saja' } 
              : a
          ));

          addLog({
            type: 'system',
            status: 'success',
            accountName: activeAccount.name,
            target: 'Group Synchronizer',
            message: `Sinkronisasi selesai: Ditemukan ${res.groups.length} grup aktif terhubung.`
          });
          return;
        }
      } catch (err: any) {
        addLog({
          type: 'system',
          status: 'error',
          accountName: activeAccount.name,
          target: 'Group Synchronizer',
          message: `Gagal sinkronisasi grup: ${err?.message || err}`
        });
      }
    }

    // Web simulation sync
    setTimeout(() => {
      const currentAccGroups = groups.filter(g => g.accountId === activeAccount.id);
      addLog({
        type: 'system',
        status: 'success',
        accountName: activeAccount.name,
        target: 'Group Synchronizer',
        message: `Sinkronisasi berhasil. Total ${currentAccGroups.length} grup siap untuk promosi otomatis.`
      });
    }, 1000);
  };

  const handleAutoJoinSelected = async (groupsToJoin: GroupSearchResult[], targetAccountId: string, delaySec: number) => {
    const targetAcc = accounts.find(a => a.id === targetAccountId) || activeAccount;
    if (!targetAcc) return;

    joinCancelledRef.current = false;
    setIsJoiningInProgress(true);
    setJoiningProgress({ current: 0, total: groupsToJoin.length, currentGroupName: groupsToJoin[0]?.name || '' });

    addLog({
      type: 'join',
      status: 'info',
      accountName: targetAcc.name,
      target: 'Auto-Join Smart Delay',
      message: `Memulai proses Auto-Join massal (${groupsToJoin.length} grup) dengan jeda aman ${delaySec} detik...`
    });

    for (let i = 0; i < groupsToJoin.length; i++) {
      if (joinCancelledRef.current) {
        addLog({
          type: 'join',
          status: 'warning',
          accountName: targetAcc.name,
          target: 'Auto-Join Smart Delay',
          message: `Auto-Join dibatalkan oleh pengguna pada progres ${i}/${groupsToJoin.length}.`
        });
        break;
      }

      const grp = groupsToJoin[i];
      setJoiningProgress({ current: i + 1, total: groupsToJoin.length, currentGroupName: grp.name });

      // Join IPC call if Electron
      if (window.electronFB?.joinGroup) {
        try {
          await window.electronFB.joinGroup({
            partition: 'persist:' + (targetAcc.uid || targetAcc.id),
            cookieString: targetAcc.cookie,
            groupUrl: grp.url,
            groupId: grp.id
          });
        } catch (e) {
          console.error(e);
        }
      }

      // Add to joined groups list
      const newJoinedGroup: FBGroup = {
        id: `grp-joined-${Date.now()}-${i}`,
        accountId: targetAcc.id,
        name: grp.name,
        url: grp.url,
        memberCount: grp.memberCount,
        privacy: grp.privacy,
        category: grp.category,
        postPermission: 'instant',
        joinedDate: new Date().toISOString().slice(0, 10),
        description: grp.description
      };

      setGroups(prev => [newJoinedGroup, ...prev]);

      // Update Search Database Status
      setSearchDatabase(prev => prev.map(s => s.id === grp.id ? { ...s, joinStatus: 'joined' } : s));

      // Update Account join count
      setAccounts(prev => prev.map(a => a.id === targetAcc.id ? { ...a, dailyJoinCount: a.dailyJoinCount + 1 } : a));

      addLog({
        type: 'join',
        status: 'success',
        accountName: targetAcc.name,
        target: grp.name,
        message: `Berhasil mengajukan bergabung ke grup: "${grp.name}".`
      });

      // Human delay wait
      if (i < groupsToJoin.length - 1) {
        const jitter = Math.floor(Math.random() * 6 - 3);
        const actualWait = Math.max(5, delaySec + jitter);
        await new Promise(res => setTimeout(res, Math.min(actualWait * 1000, 3000)));
      }
    }

    setIsJoiningInProgress(false);
    setJoiningProgress({ current: 0, total: 0, currentGroupName: '' });
  };

  // ==========================================
  // ACCOUNT HEALTH REFRESH & PROFILE SYNC
  // ==========================================
  const handleRefreshAccountHealth = async (id: string) => {
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;

    addLog({
      type: 'account',
      status: 'info',
      accountName: acc.name,
      target: 'Sesi FB',
      message: `Memeriksa kesehatan sesi dan foto profil untuk "${acc.name}"...`
    });

    if (window.electronFB?.refreshProfile) {
      try {
        const result = await window.electronFB.refreshProfile({
          partition: 'persist:' + (acc.uid || acc.id),
          cookieString: acc.cookie,
          uid: acc.uid
        });

        if (result.success) {
          setAccounts(prev => prev.map(a => {
            if (a.id === id) {
              return {
                ...a,
                status: 'active',
                name: result.name || a.name,
                avatar: result.avatar || a.avatar,
                lastActive: 'Baru saja'
              };
            }
            return a;
          }));

          addLog({
            type: 'account',
            status: 'success',
            accountName: acc.name,
            target: 'Sesi FB',
            message: `Akun "${acc.name}" aktif dan siap kerja.`
          });
          return;
        } else {
          setAccounts(prev => prev.map(a => a.id === id ? { ...a, status: 'checkpoint' } : a));
          addLog({
            type: 'account',
            status: 'error',
            accountName: acc.name,
            target: 'Sesi FB',
            message: `Sesi akun "${acc.name}" kedaluwarsa atau terkena Checkpoint.`
          });
          return;
        }
      } catch (err: any) {
        console.error(err);
      }
    }

    // Web simulation
    setTimeout(() => {
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, status: 'active', lastActive: 'Baru saja' } : a));
      addLog({
        type: 'account',
        status: 'success',
        accountName: acc.name,
        target: 'Sesi FB',
        message: `Sesi akun "${acc.name}" berhasil diverifikasi dan aktif.`
      });
    }, 800);
  };

  const handleOpenInBrowser = (accountId: string, targetUrl?: string) => {
    setActiveAccountId(accountId);
    setBrowserInitialUrl(targetUrl || 'https://www.facebook.com');
    setIsBrowserOpen(true);
  };

  // Product Bank management
  const handleAddProductBank = (item: ProductBankItem) => {
    setProductLinks(prev => [item, ...prev]);
    addLog({
      type: 'system',
      status: 'info',
      accountName: 'Sistem',
      target: 'Bank Link',
      message: `Produk baru ditambahkan ke Bank Link: "${item.label}".`
    });
  };

  const handleUpdateProductBank = (updatedItem: ProductBankItem) => {
    setProductLinks(prev => prev.map(p => p.id === updatedItem.id ? updatedItem : p));
  };

  const handleDeleteProductBank = (id: string) => {
    setProductLinks(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden select-none font-sans">
      
      {/* 1. Sidebar Navigasi Kiri Modern (6 Menu Utama) */}
      <Sidebar
        currentMenu={currentMenu}
        onSelectMenu={(menu) => setCurrentMenu(menu)}
        accounts={accounts}
        activeAccountId={activeAccountId}
        onSelectAccount={(id) => setActiveAccountId(id)}
        campaigns={campaigns}
        isAutomationRunning={isAutomationRunning}
        onEmergencyStop={handleEmergencyStop}
        onToggleBrowser={() => setIsBrowserOpen(!isBrowserOpen)}
        isBrowserOpen={isBrowserOpen}
        onOpenLogs={() => setIsLogsDrawerOpen(true)}
        unreadLogsCount={logs.filter(l => l.status === 'error').length}
        productLinksCount={productLinks.length}
        dedupCount={globalPostHistory.length}
        onOpenDedupModal={() => setIsDedupModalOpen(true)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-slate-950">
        
        {/* Global Modern Top Header */}
        <Header
          currentMenu={currentMenu}
          accounts={accounts}
          activeAccountId={activeAccountId}
          onSelectAccount={(id) => setActiveAccountId(id)}
          onOpenAddAccount={() => setIsAddAccountOpen(true)}
          isAutomationRunning={isAutomationRunning}
          onEmergencyStop={handleEmergencyStop}
          onToggleBrowser={() => setIsBrowserOpen(!isBrowserOpen)}
          isBrowserOpen={isBrowserOpen}
          onOpenLogs={() => setIsLogsDrawerOpen(true)}
          unreadLogsCount={logs.filter(l => l.status === 'error').length}
          onOpenDedupModal={() => setIsDedupModalOpen(true)}
          dedupCount={globalPostHistory.length}
        />

        {/* Dynamic View by Selected Menu */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-slate-950">
          
          {/* Menu 1: Dashboard Analitik */}
          {currentMenu === 'dashboard' && (
            <DashboardTab
              accounts={accounts}
              campaigns={campaigns}
              groups={groups}
              logs={logs}
              hourlyStats={hourlyStats}
              productLinks={productLinks}
              isAutomationRunning={isAutomationRunning}
              activeCampaignId={activeCampaignId}
              onEmergencyStop={handleEmergencyStop}
              onStartCampaign={handleStartCampaign}
              onPauseCampaign={handlePauseCampaign}
              onNavigateMenu={(menu) => setCurrentMenu(menu)}
              onNavigateToCampaigns={() => setCurrentMenu('campaign')}
              onNavigateToAccounts={() => setCurrentMenu('accounts')}
              onNavigateToBankLinks={() => setCurrentMenu('link_bank')}
              onOpenLogsDrawer={() => setIsLogsDrawerOpen(true)}
            />
          )}

          {/* Menu 2: Campaign Auto-Pilot */}
          {currentMenu === 'campaign' && (
            <CampaignTab
              campaigns={campaigns}
              accounts={accounts}
              groups={groups}
              activeAccount={activeAccount}
              productLinks={productLinks}
              isAutomationRunning={isAutomationRunning}
              onEmergencyStop={handleEmergencyStop}
              onCreateCampaign={handleCreateCampaign}
              onToggleCampaignStatus={handleToggleCampaignStatus}
              onDeleteCampaign={handleDeleteCampaign}
              onOpenSpintaxHelper={() => setIsSpintaxModalOpen(true)}
              onOpenWorkerModal={() => setIsCloudflareModalOpen(true)}
            />
          )}

          {/* Menu 3: Bank Link & Cloaker */}
          {currentMenu === 'link_bank' && (
            <LinkBankTab
              productLinks={productLinks}
              onAddProduct={handleAddProductBank}
              onUpdateProduct={handleUpdateProductBank}
              onDeleteProduct={handleDeleteProductBank}
              onOpenWorkerModal={() => setIsCloudflareModalOpen(true)}
            />
          )}

          {/* Menu 4: Akun Facebook & FB Group Management */}
          {currentMenu === 'accounts' && (
            <AccountsTab
              accounts={accounts}
              activeAccountId={activeAccountId}
              onSelectAccount={(id) => setActiveAccountId(id)}
              onOpenAddModal={() => setIsAddAccountOpen(true)}
              onDeleteAccount={(id) => setAccounts(prev => prev.filter(a => a.id !== id))}
              onRefreshHealth={handleRefreshAccountHealth}
              onOpenInBrowser={(accId) => handleOpenInBrowser(accId)}
              onRenameAccount={(id, newName) => {
                setAccounts(prev => prev.map(a => a.id === id ? { ...a, name: newName } : a));
              }}
              // Group Management
              groups={groups}
              onSyncGroups={handleSyncGroups}
              onLeaveGroup={(groupId) => setGroups(prev => prev.filter(g => g.id !== groupId))}
              onNavigateToCampaign={(groupIds) => {
                setCurrentMenu('campaign');
              }}
              onOpenUrlInBrowser={(url) => {
                setBrowserInitialUrl(url);
                setIsBrowserOpen(true);
              }}
              searchDatabase={searchDatabase}
              onAutoJoinSelected={handleAutoJoinSelected}
              isJoiningInProgress={isJoiningInProgress}
              joiningProgress={joiningProgress}
              onCancelJoining={() => { joinCancelledRef.current = true; }}
              onAddCustomGroup={(newGrp) => setSearchDatabase(prev => [newGrp, ...prev])}
              onDeleteSearchResult={(id) => setSearchDatabase(prev => prev.filter(s => s.id !== id))}
            />
          )}

          {/* Menu 5: Pustaka Spintax 4-Layer */}
          {currentMenu === 'spintax' && (
            <SpintaxTab
              onUseTemplateInCampaign={(template) => {
                setCurrentMenu('campaign');
              }}
            />
          )}

          {/* Menu 6: Pengaturan Mesin */}
          {currentMenu === 'settings' && (
            <SettingsTab
              settings={engineSettings}
              onSaveSettings={(newSettings) => {
                setEngineSettings(newSettings);
                addLog({
                  type: 'system',
                  status: 'success',
                  accountName: 'Sistem',
                  target: 'Engine Config',
                  message: 'Konfigurasi mesin, delay, dan proteksi anti-ban berhasil diperbarui.'
                });
              }}
              onResetSettings={() => {
                setEngineSettings(DEFAULT_ENGINE_SETTINGS);
              }}
              onOpenDedupModal={() => setIsDedupModalOpen(true)}
              onOpenWorkerModal={() => setIsCloudflareModalOpen(true)}
              onOpenExportModal={() => setIsExportModalOpen(true)}
            />
          )}

        </main>
      </div>

      {/* Built-In Browser Overlay */}
      {isBrowserOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="w-full h-full max-w-7xl bg-[#0D0F15] border border-[#232D42] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <BuiltInBrowser
              isOpen={isBrowserOpen}
              onClose={() => setIsBrowserOpen(false)}
              activeAccount={activeAccount}
              accounts={accounts}
              onSelectAccount={(id) => setActiveAccountId(id)}
              initialUrl={browserInitialUrl}
              groups={groups}
              onAddCommentFromBrowser={(postUrl, text) => {
                addLog({
                  type: 'comment',
                  status: 'success',
                  accountName: activeAccount?.name || 'Browser',
                  target: postUrl,
                  message: `Komentar manual via Browser: "${text.slice(0, 50)}..."`
                });
              }}
            />
          </div>
        </div>
      )}

      {/* Live Logs Drawer */}
      <LogsDrawer
        isOpen={isLogsDrawerOpen}
        onClose={() => setIsLogsDrawerOpen(false)}
        logs={logs}
        onClearLogs={() => setLogs([])}
      />

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onAddAccount={(newAcc) => {
          setAccounts(prev => [newAcc, ...prev]);
          setActiveAccountId(newAcc.id);
          addLog({
            type: 'account',
            status: 'success',
            accountName: newAcc.name,
            target: 'Account Manager',
            message: `Akun baru "${newAcc.name}" (UID: ${newAcc.uid}) berhasil ditambahkan.`
          });
        }}
        onImportBulk={(rawText) => {
          const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
          const newAccounts: FBAccount[] = lines.map((line, idx) => {
            const parts = line.split('|');
            return {
              id: `acc-bulk-${Date.now()}-${idx}`,
              name: parts[0]?.trim() || `Akun Bulk ${idx + 1}`,
              uid: parts[1]?.trim() || `${Date.now()}${idx}`,
              cookie: parts[2]?.trim() || '',
              proxy: parts[3]?.trim() || '',
              status: 'active',
              dailyCommentCount: 0,
              maxDailyComments: 50,
              dailyPostCount: 0,
              maxDailyPosts: 10,
              dailyJoinCount: 0,
              maxDailyJoins: 8,
              joinedGroupCount: 0,
              notes: 'Import Massal'
            };
          });
          setAccounts(prev => [...newAccounts, ...prev]);
          addLog({
            type: 'account',
            status: 'success',
            accountName: 'Sistem',
            target: 'Bulk Importer',
            message: `Berhasil mengimpor ${newAccounts.length} akun FB sekaligus.`
          });
        }}
      />

      {/* Global Dedup Modal */}
      <GlobalDedupModal
        isOpen={isDedupModalOpen}
        onClose={() => setIsDedupModalOpen(false)}
        history={globalPostHistory}
        onClearHistory={() => setGlobalPostHistory([])}
        onRemoveItem={(id) => setGlobalPostHistory(prev => prev.filter(h => h.id !== id))}
        accounts={accounts}
      />

      {/* Spintax Helper Modal */}
      <SpintaxModal
        isOpen={isSpintaxModalOpen}
        onClose={() => setIsSpintaxModalOpen(false)}
        onUseTemplate={(template) => {
          setIsSpintaxModalOpen(false);
          setCurrentMenu('campaign');
        }}
      />

      {/* Cloudflare Worker Modal */}
      <CloudflareWorkerModal
        isOpen={isCloudflareModalOpen}
        onClose={() => setIsCloudflareModalOpen(false)}
        onSaveWorkerUrl={(url) => {
          setIsCloudflareModalOpen(false);
          addLog({
            type: 'system',
            status: 'success',
            accountName: 'Sistem',
            target: 'Cloudflare Worker',
            message: `URL Worker Cloaker tersimpan: ${url}`
          });
        }}
      />

      {/* Electron Export Modal */}
      <ElectronExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        fullDataPayload={{
          accounts,
          groups,
          campaigns,
          scheduledPosts: [],
          searchDatabase,
          globalPostHistory
        }}
        onImportData={(data) => {
          if (data.accounts) setAccounts(data.accounts);
          if (data.groups) setGroups(data.groups);
          if (data.campaigns) setCampaigns(data.campaigns);
          if (data.searchDatabase) setSearchDatabase(data.searchDatabase);
          if (data.globalPostHistory) setGlobalPostHistory(data.globalPostHistory);
          setIsExportModalOpen(false);
        }}
      />

    </div>
  );
}
