import React, { useState, useEffect, useRef } from 'react';
import { FBAccount, FBGroup, GroupSearchResult } from '../types';
import { 
  Globe, 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Home, 
  Smartphone, 
  Monitor, 
  ShieldCheck, 
  Key, 
  Lock, 
  ExternalLink, 
  X, 
  Maximize2, 
  Minimize2,
  Bookmark,
  Layers,
  Search,
  ThumbsUp,
  MessageSquare,
  Share2,
  CheckCircle2,
  Sparkles,
  Send,
  Plus,
  Compass,
  AlertCircle,
  Download,
  ListPlus,
  Zap,
  Square,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { parseSpintax } from '../utils/spintax';

interface BuiltInBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  activeAccount: FBAccount | undefined;
  accounts: FBAccount[];
  onSelectAccount: (id: string) => void;
  initialUrl?: string;
  groups: FBGroup[];
  onAddCommentFromBrowser?: (postUrl: string, commentText: string) => void;
  onImportExtractedGroups?: (data: {
    joinedGroups: FBGroup[];
    unjoinedGroups: GroupSearchResult[];
  }) => void;
}

const QUICK_BOOKMARKS = [
  { name: 'fb.com/groups/joins', url: 'https://www.facebook.com/groups/joins/', label: 'Grup Saya (Desktop)' },
  { name: 'm.facebook.com/groups', url: 'https://m.facebook.com/groups/', label: 'Grup Saya (Mobile)' },
  { name: 'm.facebook.com', url: 'https://m.facebook.com', label: 'FB Mobile Feed' },
  { name: 'fb.com/groups', url: 'https://www.facebook.com/groups/feed', label: 'Feed Grup' },
  { name: 'fb.com/marketplace', url: 'https://www.facebook.com/marketplace', label: 'Marketplace' }
];

export const BuiltInBrowser: React.FC<BuiltInBrowserProps> = ({
  isOpen,
  onClose,
  activeAccount,
  accounts,
  onSelectAccount,
  initialUrl = 'https://m.facebook.com',
  groups,
  onAddCommentFromBrowser,
  onImportExtractedGroups
}) => {
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtractingGroups, setIsExtractingGroups] = useState(false);
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'desktop'>('desktop');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showSessionInspector, setShowSessionInspector] = useState(false);
  const [cookieInjectStatus, setCookieInjectStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [isAutoJoiningInBrowser, setIsAutoJoiningInBrowser] = useState(false);
  const [autoJoinProgress, setAutoJoinProgress] = useState<{ current: number; total: number; groupName: string } | null>(null);
  const stopAutoJoinRef = useRef(false);

  // Electron Desktop detection
  const isDesktop = typeof window !== 'undefined' && (!!window.electronFB?.isDesktop || navigator.userAgent.toLowerCase().includes('electron'));
  const webviewRef = useRef<any>(null);

  // In-Browser Interactive Feed State (for Web Preview Mode)
  const [feedFilter, setFeedFilter] = useState<'timeline' | 'groups'>('timeline');
  const [simulatedComments, setSimulatedComments] = useState<Record<string, string[]>>({
    'post-1': ['Wah infonya sangat menarik kak!', 'Izin nyimak dan follow infonya gan 🙏'],
    'post-2': ['Berapa harganya ini gan?', 'Bisa COD bayar di tempat?'],
    'post-3': ['Setuju banget sama tipsnya!']
  });
  const [inputCommentText, setInputCommentText] = useState<Record<string, string>>({});
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  const partitionName = `persist:fb_account_${activeAccount?.id || 'default'}`;

  // Auto-inject cookies when desktop environment is active
  useEffect(() => {
    if (isOpen && activeAccount && window.electronFB?.injectCookies) {
      if (activeAccount.cookie) {
        window.electronFB.injectCookies(partitionName, activeAccount.cookie)
          .then(res => {
            if (res?.success) {
              setCookieInjectStatus('success');
            } else {
              setCookieInjectStatus('failed');
            }
          })
          .catch(() => setCookieInjectStatus('failed'));
      }
    }
  }, [isOpen, activeAccount?.id, activeAccount?.cookie, partitionName]);

  // Sync initialUrl
  useEffect(() => {
    if (initialUrl) {
      setUrlInput(initialUrl);
      setCurrentUrl(initialUrl);
    }
  }, [initialUrl]);

  if (!isOpen) return null;

  const handleNavigate = (targetUrl: string) => {
    setIsLoading(true);
    let formatted = targetUrl;
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `https://${formatted}`;
    }
    setUrlInput(formatted);
    setCurrentUrl(formatted);

    if (webviewRef.current && isDesktop) {
      try {
        webviewRef.current.loadURL(formatted);
      } catch (err) {
        // fallback
      }
    }

    setTimeout(() => {
      setIsLoading(false);
    }, 400);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleNavigate(urlInput);
  };

  const handleOpenInRealExternalBrowser = () => {
    if (window.electronFB?.openExternal) {
      window.electronFB.openExternal(currentUrl);
    } else {
      window.open(currentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleExtractGroupsFromWebview = async () => {
    if (!webviewRef.current || !activeAccount) {
      alert('Browser belum siap atau akun Facebook belum aktif.');
      return;
    }
    setIsExtractingGroups(true);
    try {
      console.log('[BuiltInBrowser] Mengekstrak grup dari halaman aktif:', currentUrl);
      const extracted = await webviewRef.current.executeJavaScript(`
        (() => {
          const results = [];
          const seenSlugs = new Set();
          const nonGroupSlugs = new Set([
            'feed', 'create', 'discover', 'notifications', 'search', 
            'categories', 'membership', 'joins', 'settings', 'your_posts', 'direct_invite'
          ]);

          const allLinks = Array.from(document.querySelectorAll('a[href*="/groups/"]'));

          for (const a of allLinks) {
            const href = a.href || a.getAttribute('href') || '';
            const match = href.match(/facebook\\.com\\/groups\\/([^/?#]+)/i) || href.match(/\\/groups\\/([^/?#]+)/i);
            if (!match) continue;

            const slug = match[1];
            if (!slug || nonGroupSlugs.has(slug.toLowerCase())) continue;
            if (seenSlugs.has(slug.toLowerCase())) continue;

            // Cari container khusus kartu ini (jangan sampai keluar ke div[role="feed"])
            let container = a;
            let curr = a.parentElement;
            while (curr && curr !== document.body) {
              const role = curr.getAttribute('role');
              if (role === 'feed' || role === 'main' || curr.tagName === 'BODY' || curr.tagName === 'MAIN') {
                break;
              }
              const linksInside = curr.querySelectorAll('a[href*="/groups/"]');
              const innerSlugs = new Set();
              for (const l of linksInside) {
                const m = (l.href || '').match(/\\/groups\\/([^/?#]+)/i);
                if (m && !nonGroupSlugs.has(m[1].toLowerCase())) {
                  innerSlugs.add(m[1].toLowerCase());
                }
              }
              if (innerSlugs.size > 1) {
                break;
              }
              container = curr;
              const txt = curr.innerText || '';
              if (txt.includes('anggota') || txt.includes('member') || txt.includes('Terakhir kali') || txt.includes('Lihat Grup') || txt.includes('Gabung') || txt.includes('Lihat')) {
                if (curr.querySelector('img') && (curr.querySelector('[role="button"]') || curr.querySelector('button') || curr.querySelector('a'))) {
                  container = curr;
                }
              }
              curr = curr.parentElement;
            }

            // Ekstrak nama grup asli tanpa prefix 'Belum dibaca' atau 'Selamat datang'
            let rawName = '';
            const titleCandidates = [
              a.querySelector('span[dir="auto"]'),
              a.querySelector('strong, h2, h3, h4'),
              a,
              container.querySelector('h2, h3, h4'),
              container.querySelector('span[dir="auto"]')
            ];

            for (const cand of titleCandidates) {
              if (!cand) continue;
              let t = cand.innerText ? cand.innerText.trim() : '';
              if (!t) continue;
              t = t.replace(/^(Belum dibaca|Unread)\\s*/i, '');
              t = t.replace(/^Selamat datang di\\s+/i, '');
              const firstLine = t.split('\\n')[0].trim();
              if (firstLine.length >= 2 && !['gabung', 'join', 'lihat', 'lihat grup', 'view', 'kirim', 'batal'].includes(firstLine.toLowerCase())) {
                rawName = firstLine;
                break;
              }
            }

            if (!rawName || rawName.length < 2) continue;
            if (/^(gabung|join|lihat|lihat grup|view|kirim|batal|keluar)$/i.test(rawName)) continue;
            if (rawName.toLowerCase().includes('sekarang anda bisa memposting')) continue;

            // Cek status keanggotaan
            const containerText = container ? container.innerText : a.innerText;
            const buttons = Array.from(container ? container.querySelectorAll('div[role="button"], button, a') : []);
            let hasJoinButton = false;
            let hasViewButton = false;

            for (const btn of buttons) {
              const btnText = (btn.innerText || btn.getAttribute('aria-label') || '').trim().toLowerCase();
              if (btnText === 'gabung' || btnText === 'join' || btnText === '+ gabung' || btnText === '+ join') {
                hasJoinButton = true;
              }
              if (btnText === 'lihat' || btnText === 'lihat grup' || btnText === 'view' || btnText === 'view group') {
                hasViewButton = true;
              }
            }

            const isAlreadyJoined = hasViewButton || 
              containerText.toLowerCase().includes('baru bergabung') || 
              containerText.toLowerCase().includes('sudah bergabung') || 
              containerText.toLowerCase().includes('terakhir kali anda berkunjung') ||
              containerText.toLowerCase().includes('lihat grup') ||
              (!hasJoinButton && containerText.toLowerCase().includes('lihat'));

            // Ekstrak jumlah anggota dari teks lokal kartu ini saja
            let memberCount = 10000;
            const memberMatch = containerText.match(/([0-9.,]+)\\s*(rb|k|jt|m|ribu|juta)?\\s*(?:anggota|member|members)/i) ||
                                containerText.match(/([0-9.,]+)\\s*(rb|k|jt|m|ribu|juta)/i);
            if (memberMatch) {
              let numStr = memberMatch[1];
              let unit = (memberMatch[2] || '').toLowerCase();
              if (unit === 'rb' || unit === 'k' || unit === 'ribu') {
                let n = parseFloat(numStr.replace(',', '.'));
                memberCount = Math.round(n * 1000);
              } else if (unit === 'jt' || unit === 'm' || unit === 'juta') {
                let n = parseFloat(numStr.replace(',', '.'));
                memberCount = Math.round(n * 1000000);
              } else {
                let cleanNum = numStr.replace(/\\./g, '').replace(/,/g, '');
                let n = parseInt(cleanNum, 10);
                if (!isNaN(n) && n > 0 && n < 100000000) {
                  memberCount = n;
                }
              }
            }

            const isPrivate = /privat|private/i.test(containerText);

            // Cover image
            let coverImage = '';
            const imgEl = container ? container.querySelector('img[src*="fbcdn"], img[src*="facebook"], img') : a.querySelector('img');
            if (imgEl && imgEl.src && !imgEl.src.includes('data:image/svg') && !imgEl.src.includes('static.xx.fbcdn.net/rsrc.php/v3/y')) {
              coverImage = imgEl.src;
            } else {
              coverImage = 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&auto=format&fit=crop&q=80';
            }

            let desc = containerText
              .replace(rawName, '')
              .replace(/lihat grup/gi, '')
              .replace(/gabung/gi, '')
              .replace(/lihat/gi, '')
              .replace(/\\n+/g, ' • ')
              .trim();
            if (desc.startsWith('•')) desc = desc.substring(1).trim();
            if (desc.length > 120) desc = desc.substring(0, 120) + '...';

            seenSlugs.add(slug.toLowerCase());

            results.push({
              fbGroupId: slug,
              name: rawName,
              url: 'https://www.facebook.com/groups/' + slug + '/',
              memberCount: memberCount,
              privacy: isPrivate ? 'private' : 'public',
              isJoined: isAlreadyJoined,
              coverImage: coverImage,
              description: desc || (isPrivate ? 'Grup Privat Facebook' : 'Grup Publik Facebook')
            });
          }

          return results;
        })()
      `);

      console.log('[BuiltInBrowser] Grup yang berhasil diekstrak:', extracted);

      if (extracted && extracted.length > 0) {
        const joinedList: FBGroup[] = [];
        const unjoinedList: GroupSearchResult[] = [];

        for (const item of extracted) {
          if (item.isJoined) {
            joinedList.push({
              id: 'grp-live-' + item.fbGroupId,
              name: item.name,
              fbGroupId: item.fbGroupId,
              coverImage: item.coverImage,
              memberCount: item.memberCount,
              privacy: item.privacy,
              joinStatus: 'joined',
              postPermission: 'instant',
              category: 'Grup Tergabung (Live FB)',
              accountId: activeAccount.id,
              url: item.url,
              description: item.description
            });
          } else {
            unjoinedList.push({
              id: 'search-live-' + item.fbGroupId,
              name: item.name,
              fbGroupId: item.fbGroupId,
              coverImage: item.coverImage,
              memberCount: item.memberCount,
              privacy: item.privacy,
              joinStatus: 'not_joined',
              category: 'Pencarian Grup Live',
              url: item.url,
              description: item.description,
              selected: true
            });
          }
        }

        if (onImportExtractedGroups) {
          onImportExtractedGroups({ joinedGroups: joinedList, unjoinedGroups: unjoinedList });
        }

        alert(
          `Selesai memproses ${extracted.length} grup Facebook asli dari layar:\n\n` +
          `• ${joinedList.length} grup SUDAH TERGABUNG -> dimasukkan ke tab "Grup Saya"\n` +
          `• ${unjoinedList.length} grup BELUM TERGABUNG -> dimasukkan ke tab "Pencarian Grup (Auto Join)"`
        );
      } else {
        alert('Tidak ada grup yang terdeteksi di layar ini.\nTips: Buka menu "Grup Saya (Desktop)" atau lakukan pencarian grup Facebook di browser, lalu klik tombol ini lagi.');
      }
    } catch (err: any) {
      console.error('[BuiltInBrowser] Error saat extract groups:', err);
      alert('Gagal mengekstrak grup dari browser: ' + err.message);
    } finally {
      setIsExtractingGroups(false);
    }
  };

  const handleAutoJoinOnWebviewPage = async () => {
    if (!webviewRef.current || !activeAccount) {
      alert('Browser belum siap atau akun Facebook belum aktif.');
      return;
    }

    try {
      // Deteksi tombol Gabung yang ada di webview
      const buttonsFound = await webviewRef.current.executeJavaScript(`
        (() => {
          const candidates = Array.from(document.querySelectorAll('div[role="button"], button, a'));
          const list = [];
          for (let i = 0; i < candidates.length; i++) {
            const el = candidates[i];
            const t = (el.innerText || el.getAttribute('aria-label') || '').trim().toLowerCase();
            if (t === 'gabung' || t === 'join' || t === '+ gabung' || t === '+ join') {
              let name = 'Grup Facebook';
              let p = el.parentElement;
              for (let step = 0; step < 5; step++) {
                if (p) {
                  const link = p.querySelector('a[href*="/groups/"]');
                  if (link && link.innerText) {
                    name = link.innerText.trim().split('\\n')[0];
                    break;
                  }
                  p = p.parentElement;
                }
              }
              list.push({ index: i, name });
            }
          }
          return list;
        })()
      `);

      if (!buttonsFound || buttonsFound.length === 0) {
        alert('Tidak ditemukan tombol "Gabung" di layar ini.\nTips: Pastikan Anda membuka halaman hasil pencarian grup Facebook (misal: cari kata kunci "Jual Beli") di mana tombol Gabung terlihat.');
        return;
      }

      const confirmed = window.confirm(
        `Ditemukan ${buttonsFound.length} tombol Gabung di layar ini.\n\nMulai Auto Join langsung di browser sekarang?\n(Sistem akan mengklik secara bertahap dengan jeda aman 15 detik untuk keamanan akun)`
      );
      if (!confirmed) return;

      setIsAutoJoiningInBrowser(true);
      stopAutoJoinRef.current = false;

      for (let i = 0; i < buttonsFound.length; i++) {
        if (stopAutoJoinRef.current) break;

        const item = buttonsFound[i];
        setAutoJoinProgress({
          current: i + 1,
          total: buttonsFound.length,
          groupName: item.name
        });

        // Eksekusi klik pada tombol ke-i
        await webviewRef.current.executeJavaScript(`
          (() => {
            const candidates = Array.from(document.querySelectorAll('div[role="button"], button, a'));
            const btn = candidates[${item.index}];
            if (btn) {
              btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
              btn.style.outline = '3px solid #10B981';
              btn.click();
              return true;
            }
            return false;
          })()
        `);

        // Jeda anti-ban 15 detik
        if (i < buttonsFound.length - 1) {
          for (let s = 0; s < 15; s++) {
            if (stopAutoJoinRef.current) break;
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }

      alert('Proses Auto Join di Browser selesai!');
    } catch (err: any) {
      console.error('[BuiltInBrowser] Error saat auto join di webview:', err);
      alert('Error saat menjalankan Auto Join: ' + err.message);
    } finally {
      setIsAutoJoiningInBrowser(false);
      setAutoJoinProgress(null);
    }
  };

  const handleToggleLike = (postId: string) => {
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleSendComment = (postId: string) => {
    const text = inputCommentText[postId];
    if (!text || !text.trim()) return;

    const parsedText = parseSpintax(text.trim());
    setSimulatedComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), parsedText]
    }));

    setInputCommentText(prev => ({
      ...prev,
      [postId]: ''
    }));

    if (onAddCommentFromBrowser) {
      onAddCommentFromBrowser(`${currentUrl}#${postId}`, parsedText);
    }
  };

  const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
  const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn ${isFullScreen ? 'p-0' : ''}`}>
      <div className={`bg-[#11141B] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all ${
        isFullScreen ? 'w-full h-full rounded-none border-none' : 'w-full max-w-6xl h-[92vh]'
      }`}>
        
        {/* Top Browser Header Bar */}
        <div className="bg-[#0D0F15] px-3.5 py-2.5 border-b border-[#1E293B] flex items-center justify-between gap-3">
          
          {/* Controls & Nav */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 mr-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 cursor-pointer hover:opacity-100" onClick={onClose} title="Tutup"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 cursor-pointer" onClick={() => setIsFullScreen(!isFullScreen)} title="Toggle Fullscreen"></span>
            </div>

            <button
              onClick={() => {
                if (webviewRef.current?.canGoBack?.()) webviewRef.current.goBack();
              }}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#141824] transition"
              title="Kembali"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                if (webviewRef.current?.canGoForward?.()) webviewRef.current.goForward();
              }}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#141824] transition"
              title="Maju"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handleNavigate(currentUrl)}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#141824] transition"
              title="Muat Ulang"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            <button
              onClick={() => handleNavigate('https://m.facebook.com')}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#141824] transition"
              title="Home FB"
            >
              <Home className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Address URL Bar */}
          <form onSubmit={handleFormSubmit} className="flex-1 max-w-xl">
            <div className="relative flex items-center">
              <div className="absolute left-2.5 flex items-center gap-1 text-emerald-400 text-xs">
                <Lock className="w-3 h-3" />
              </div>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full pl-7 pr-16 py-1.5 text-xs font-mono bg-[#141824] border border-[#232D42] rounded-xl text-[#E2E8F0] focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-1 px-2.5 py-0.5 text-[10px] font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-lg transition"
              >
                Go
              </button>
            </div>
          </form>

          {/* Viewport, Session & Window Controls */}
          <div className="flex items-center gap-2">
            
            {/* Viewport Mode Switcher */}
            <div className="hidden sm:flex items-center bg-[#141824] p-1 rounded-xl border border-[#232D42]">
              <button
                type="button"
                onClick={() => setDeviceMode('mobile')}
                className={`p-1 rounded-lg text-xs transition ${
                  deviceMode === 'mobile' ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm ring-1 ring-indigo-400' : 'text-[#94A3B8] hover:text-white'
                }`}
                title="Tampilan FB Mobile"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode('desktop')}
                className={`p-1 rounded-lg text-xs transition ${
                  deviceMode === 'desktop' ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm ring-1 ring-indigo-400' : 'text-[#94A3B8] hover:text-white'
                }`}
                title="Tampilan FB Desktop"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Account Session Pill */}
            <div className="hidden md:flex items-center gap-1.5 bg-[#141824] px-2.5 py-1 rounded-xl border border-[#232D42] text-xs">
              <img
                src={activeAccount?.uid ? `https://graph.facebook.com/${activeAccount.uid}/picture?type=large` : (activeAccount?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50')}
                alt="Account"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = activeAccount?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                }}
                className="w-4 h-4 rounded-full object-cover"
              />
              <span className="font-semibold text-[#E2E8F0] truncate max-w-[100px]">
                {activeAccount?.name || 'FB Session'}
              </span>
              <button
                onClick={() => setShowSessionInspector(!showSessionInspector)}
                className="text-[10px] text-indigo-400 hover:underline font-mono ml-1"
                title="Lihat Cookie & Proxy Sesi"
              >
                [Cookie]
              </button>
            </div>

            {/* Open In Real OS Browser Button */}
            <button
              onClick={handleOpenInRealExternalBrowser}
              className="p-1.5 rounded-lg text-cyan-300 hover:text-white bg-[#141824] hover:bg-[#1C2336] border border-[#232D42] transition"
              title="Buka Halaman Ini di Browser Luar (Chrome/Edge)"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#141824] transition"
              title={isFullScreen ? 'Keluar Fullscreen' : 'Fullscreen'}
            >
              {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#141824] transition"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Quick Bookmarks Bar */}
        <div className="bg-[#0D0F15]/80 px-4 py-1.5 border-b border-[#1E293B] flex items-center justify-between gap-2 overflow-x-auto text-[11px]">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[#64748B] flex items-center gap-1 text-[10px] shrink-0">
              <Bookmark className="w-3 h-3 text-indigo-400" /> Bookmark FB:
            </span>
            {QUICK_BOOKMARKS.map((b) => (
              <button
                key={b.url}
                onClick={() => handleNavigate(b.url)}
                className={`px-2.5 py-0.5 rounded-lg border shrink-0 transition ${
                  currentUrl.includes(b.name)
                    ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 font-semibold'
                    : 'bg-[#141824] text-[#94A3B8] border-[#232D42] hover:text-[#E2E8F0]'
                }`}
              >
                {b.label}
              </button>
            ))}

            {/* Tombol Ekstrak Grup Langsung dari Browser */}
            <button
              type="button"
              onClick={handleExtractGroupsFromWebview}
              disabled={isExtractingGroups || isAutoJoiningInBrowser}
              className="ml-2 px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs border border-emerald-400/40 shadow-sm flex items-center gap-1.5 shrink-0 transition cursor-pointer"
              title="Ambil grup Facebook di layar ini: yang sudah join masuk ke Grup Saya, yang belum masuk ke Auto Join"
            >
              <Download className={`w-3.5 h-3.5 ${isExtractingGroups ? 'animate-bounce' : ''}`} />
              <span>{isExtractingGroups ? 'Mengekstrak Grup...' : '📥 Ambil Grup di Layar'}</span>
            </button>

            {/* Tombol Auto Join Langsung di Browser */}
            <button
              type="button"
              onClick={handleAutoJoinOnWebviewPage}
              disabled={isExtractingGroups || isAutoJoiningInBrowser}
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs border border-indigo-400/40 shadow-sm flex items-center gap-1.5 shrink-0 transition cursor-pointer"
              title="Otomatis klik tombol 'Gabung' yang ada di layar browser ini satu per satu dengan jeda aman anti-ban"
            >
              <Zap className={`w-3.5 h-3.5 ${isAutoJoiningInBrowser ? 'animate-pulse text-amber-300' : ''}`} />
              <span>{isAutoJoiningInBrowser ? 'Auto Join Aktif...' : '⚡ Auto Join di Browser'}</span>
            </button>
          </div>

          {/* Desktop Status Badge */}
          <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono text-[#94A3B8] shrink-0">
            {isDesktop ? (
              <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Native Electron Session ({partitionName})
              </span>
            ) : (
              <span className="text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 flex items-center gap-1">
                <Compass className="w-3 h-3" /> Preview Web Mode (Build desktop untuk native browser)
              </span>
            )}
          </div>
        </div>

        {/* Auto Join Progress Notification Bar */}
        {isAutoJoiningInBrowser && autoJoinProgress && (
          <div className="bg-gradient-to-r from-indigo-950 via-blue-950 to-[#0A0D14] border-b border-indigo-500/40 px-4 py-2 flex items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3 text-xs text-white">
              <div className="p-1.5 bg-indigo-500/20 rounded-lg border border-indigo-500/40 animate-pulse">
                <Zap className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <div className="font-semibold flex items-center gap-2">
                  <span>Sedang Auto Join: Grup {autoJoinProgress.current} dari {autoJoinProgress.total}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                    Jeda Anti-Ban 15s
                  </span>
                </div>
                <div className="text-[11px] text-indigo-200/80 truncate max-w-md">
                  Target: {autoJoinProgress.groupName}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                stopAutoJoinRef.current = true;
                setIsAutoJoiningInBrowser(false);
              }}
              className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Hentikan</span>
            </button>
          </div>
        )}

        {/* Session Inspector Drawer if open */}
        {showSessionInspector && (
          <div className="bg-[#0D0F15] p-4 border-b border-[#1E293B] text-xs text-[#CBD5E1] animate-fadeIn space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-400 flex items-center gap-1">
                <Key className="w-3.5 h-3.5" /> Sesi Facebook & Token Terinjeksi:
              </span>
              <button
                onClick={() => setShowSessionInspector(false)}
                className="text-[10px] text-[#64748B] hover:text-[#CBD5E1]"
              >
                Tutup
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2 bg-[#141824] rounded-xl border border-[#232D42]">
                <span className="text-[#64748B] block">UID Sesi:</span>
                <span className="text-emerald-400">{activeAccount?.uid || '100084729104821'}</span>
              </div>
              <div className="p-2 bg-[#141824] rounded-xl border border-[#232D42]">
                <span className="text-[#64748B] block">Proxy IP Sesi:</span>
                <span className="text-cyan-400">{activeAccount?.proxy || 'Direct IP'}</span>
              </div>
            </div>
            <p className="font-mono text-[10px] text-[#94A3B8] truncate bg-[#141824] p-2 rounded-xl border border-[#232D42]">
              Cookie: {activeAccount?.cookie || 'c_user=100084729104821; xs=42%3Asimulated...'}
            </p>
          </div>
        )}

        {/* Browser Content Area */}
        <div className="flex-1 overflow-hidden bg-[#0A0B0E] relative flex flex-col">
          
          {isDesktop ? (
            /* Native Electron Webview */
            <div className="w-full h-full flex flex-col">
              {React.createElement('webview', {
                ref: webviewRef,
                id: 'fb-webview',
                src: currentUrl,
                partition: partitionName,
                useragent: deviceMode === 'mobile' ? mobileUA : desktopUA,
                style: { width: '100%', height: '100%', border: 'none', backgroundColor: '#0A0B0E' },
                allowpopups: 'true'
              })}
            </div>
          ) : (
            /* Web Mode Interactive Workspace */
            <div className="flex-1 overflow-y-auto p-4 flex justify-center items-start">
              
              <div className={`w-full transition-all ${deviceMode === 'mobile' ? 'max-w-md' : 'max-w-4xl'}`}>
                
                {/* Notice Bar for Desktop Build */}
                <div className="mb-4 p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-indigo-300">
                    <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Mode Web Preview aktif. Bangun file desktop (<code className="font-mono text-cyan-300">npm run dist</code>) untuk membuka browser Facebook native 100%.</span>
                  </div>
                  <button
                    onClick={handleOpenInRealExternalBrowser}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shrink-0 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" /> Buka di Facebook Langsung
                  </button>
                </div>

                {/* Interactive Simulated Facebook Header */}
                <div className="bg-[#11141B] rounded-2xl border border-[#1E293B] shadow-2xl overflow-hidden">
                  
                  {/* FB App Bar */}
                  <div className="bg-[#1877F2] p-3.5 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-extrabold tracking-tighter">facebook</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 font-mono">
                        {deviceMode === 'mobile' ? 'Mobile Web' : 'Desktop'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-xs bg-white/15 px-2.5 py-1 rounded-full">
                        <img
                          src={activeAccount?.uid ? `https://graph.facebook.com/${activeAccount.uid}/picture?type=large` : (activeAccount?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50')}
                          alt="User"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = activeAccount?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                          }}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span className="font-semibold text-[11px] truncate max-w-[100px]">{activeAccount?.name || 'Pengguna'}</span>
                      </div>
                    </div>
                  </div>

                  {/* FB Feed Tabs Switcher */}
                  <div className="flex border-b border-[#1E293B] bg-[#0D0F15]">
                    <button
                      type="button"
                      onClick={() => setFeedFilter('timeline')}
                      className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition ${
                        feedFilter === 'timeline' ? 'border-[#1877F2] text-[#1877F2]' : 'border-transparent text-[#94A3B8] hover:text-[#E2E8F0]'
                      }`}
                    >
                      Beranda / Timeline
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedFilter('groups')}
                      className={`flex-1 py-2.5 text-xs font-semibold text-center border-b-2 transition ${
                        feedFilter === 'groups' ? 'border-[#1877F2] text-[#1877F2]' : 'border-transparent text-[#94A3B8] hover:text-[#E2E8F0]'
                      }`}
                    >
                      Feed Postingan Grup ({groups.length})
                    </button>
                  </div>

                  {/* Feed Post Items */}
                  <div className="p-4 space-y-4 divide-y divide-[#1E293B]">
                    
                    {/* Post Item 1 */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
                            alt="Author"
                            className="w-9 h-9 rounded-full object-cover"
                          />
                          <div>
                            <h4 className="text-xs font-bold text-white">
                              {feedFilter === 'groups' ? 'Komunitas Jual Beli & Affiliate ID' : 'Budi Santoso (Influencer Marketing)'}
                            </h4>
                            <p className="text-[10px] text-[#94A3B8]">18 menit lalu • Publik 🌐</p>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-[#CBD5E1] leading-relaxed">
                        {feedFilter === 'groups' 
                          ? 'Halo semuanya, ada rekomendasi toko gadget online terpercaya dengan harga promo flash sale gak ya? Butuh yang bisa kirim cepat dan garansi aman.' 
                          : 'Strategi promosi online di Facebook tahun 2026 kuncinya adalah konsistensi dan share link yang relevan dengan kebutuhan audiens. Ada yang punya rekomendasi link promo menarik hari ini?'}
                      </p>

                      <div className="rounded-xl overflow-hidden border border-[#1E293B] aspect-video bg-[#0D0F15]">
                        <img
                          src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80"
                          alt="Post visual"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Likes & Comments Count */}
                      <div className="flex items-center justify-between text-[11px] text-[#94A3B8] pt-1">
                        <span>👍 42 Suka</span>
                        <span>{(simulatedComments['post-1']?.length || 0)} Komentar • 5 Bagikan</span>
                      </div>

                      {/* Actions Bar */}
                      <div className="grid grid-cols-3 border-y border-[#1E293B] py-1 text-xs">
                        <button
                          onClick={() => handleToggleLike('post-1')}
                          className={`py-1.5 flex items-center justify-center gap-1 font-semibold rounded-lg hover:bg-[#141824] transition ${
                            likedPosts['post-1'] ? 'text-indigo-400' : 'text-[#94A3B8]'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{likedPosts['post-1'] ? 'Disukai' : 'Suka'}</span>
                        </button>

                        <button className="py-1.5 flex items-center justify-center gap-1 font-semibold text-[#94A3B8] rounded-lg hover:bg-[#141824] transition">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Komentar</span>
                        </button>

                        <button className="py-1.5 flex items-center justify-center gap-1 font-semibold text-[#94A3B8] rounded-lg hover:bg-[#141824] transition">
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Bagikan</span>
                        </button>
                      </div>

                      {/* Comments Section */}
                      <div className="space-y-2 pt-1">
                        {(simulatedComments['post-1'] || []).map((c, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <img
                              src={activeAccount?.uid ? `https://graph.facebook.com/${activeAccount.uid}/picture?type=large` : (activeAccount?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50')}
                              alt="User"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = activeAccount?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                              }}
                              className="w-6 h-6 rounded-full object-cover mt-0.5"
                            />
                            <div className="p-2 bg-[#0D0F15] rounded-xl border border-[#1E293B] flex-1">
                              <span className="font-bold text-white text-[11px] block">{activeAccount?.name || 'CheapAds Bot'}</span>
                              <p className="text-[#CBD5E1] text-[11px] leading-relaxed mt-0.5">{c}</p>
                            </div>
                          </div>
                        ))}

                        {/* Quick In-Browser Comment Composer */}
                        <div className="flex items-center gap-2 pt-2">
                          <img
                            src={activeAccount?.uid ? `https://graph.facebook.com/${activeAccount.uid}/picture?type=large` : (activeAccount?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50')}
                            alt="User"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = activeAccount?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                            }}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <div className="flex-1 flex items-center gap-1 bg-[#0D0F15] border border-[#1E293B] rounded-xl px-2.5 py-1">
                            <input
                              type="text"
                              placeholder="Tulis komentar promosi link (spintax didukung)..."
                              value={inputCommentText['post-1'] || ''}
                              onChange={(e) => setInputCommentText(prev => ({ ...prev, 'post-1': e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && handleSendComment('post-1')}
                              className="flex-1 bg-transparent text-xs text-[#E2E8F0] placeholder-[#64748B] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleSendComment('post-1')}
                              className="p-1 rounded bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white"
                            >
                              <Send className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
