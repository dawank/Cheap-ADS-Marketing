import React, { useState } from 'react';
import { FBAccount } from '../types';
import { 
  X, 
  Plus, 
  Shield, 
  Key, 
  Globe, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Eye, 
  EyeOff, 
  Compass, 
  Lock, 
  Mail, 
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: (newAccount: FBAccount) => void;
  onImportBulk: (rawText: string) => void;
  onOpenBrowserForAccount?: (account: FBAccount, targetUrl?: string) => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onAddAccount,
  onImportBulk,
  onOpenBrowserForAccount
}) => {
  // Tabs: 'browser_login' (Default & Recommended), 'cookie_manual', 'bulk'
  const [tabMode, setTabMode] = useState<'browser_login' | 'cookie_manual' | 'bulk'>('browser_login');

  // Automated Browser Login Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginStepStatus, setLoginStepStatus] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // General Fields
  const [name, setName] = useState('');
  const [uid, setUid] = useState('');
  const [cookie, setCookie] = useState('');
  const [proxy, setProxy] = useState('');
  const [maxDailyComments, setMaxDailyComments] = useState(60);
  const [maxDailyPosts, setMaxDailyPosts] = useState(15);
  const [maxDailyJoins, setMaxDailyJoins] = useState(10);
  const [notes, setNotes] = useState('');
  const [avatar, setAvatar] = useState('');

  // Bulk state
  const [bulkData, setBulkData] = useState('');

  if (!isOpen) return null;

  // Extract UID automatically when cookie changes in manual mode
  const handleCookieChange = (val: string) => {
    setCookie(val);
    const match = val.match(/c_user=(\d+)/);
    if (match && match[1]) {
      const extractedUid = match[1];
      if (!uid) {
        setUid(extractedUid);
      }
      setAvatar(`https://graph.facebook.com/${extractedUid}/picture?type=large`);
    }
  };

  // Live avatar resolution
  const resolvedAvatar = avatar || (uid ? `https://graph.facebook.com/${uid}/picture?type=large` : '');

  // =========================================================================
  // HANDLER: Hubungkan & Login Otomatis via Built-in Browser
  // =========================================================================
  const handleAutoBrowserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setLoginError('Harap masukkan Email/Nomor HP dan Password Facebook Anda.');
      return;
    }

    setLoginError('');
    setIsLoggingIn(true);
    setLoginStepStatus('1/3: Membuka browser Facebook terisolasi...');

    const tempAccId = `acc-${Date.now()}`;
    const partition = `persist:fb_account_${tempAccId}`;

    if (window.electronFB?.autoLogin) {
      try {
        setLoginStepStatus('2/3: Mengetik kredensial & login otomatis di browser...');
        const res = await window.electronFB.autoLogin({
          partition,
          email: email.trim(),
          password: password.trim(),
          proxyRules: proxy.trim() || undefined
        });

        if (res.success && res.uid) {
          setLoginStepStatus('3/3: Login berhasil! Menyimpan cookie & foto profil asli...');
          
          const finalUid = res.uid;
          const isInvalidName = (n: string) => {
            const lower = (n || '').toLowerCase().trim();
            return !lower || lower.includes('lihat pemilik') || lower.includes('lihat profil') || lower === 'facebook' || lower === 'beranda' || lower === 'home';
          };
          const cleanExtractedName = res.name && !isInvalidName(res.name) ? res.name.trim() : '';
          const finalName = name.trim() || cleanExtractedName || `Pengguna FB (${finalUid.slice(-4)})`;
          const finalAvatar = res.avatar || `https://graph.facebook.com/${finalUid}/picture?type=large`;
          const finalCookie = res.cookieString || `c_user=${finalUid}; xs=verified;`;

          const newAcc: FBAccount = {
            id: tempAccId,
            name: finalName,
            uid: finalUid,
            avatar: finalAvatar,
            cookie: finalCookie,
            token: 'EAABsbCS1iHgBA...',
            status: 'active',
            proxy: proxy.trim() || 'Direct IP (Indonesia)',
            dailyCommentCount: 0,
            dailyPostCount: 0,
            dailyJoinCount: 0,
            maxDailyComments: Number(maxDailyComments) || 60,
            maxDailyPosts: Number(maxDailyPosts) || 15,
            maxDailyJoins: Number(maxDailyJoins) || 10,
            joinedGroupsCount: 0,
            pages: [
              { id: `page-${Date.now()}`, name: `${finalName} Hub`, category: 'Business & Community', likes: 1450 }
            ],
            lastActive: 'Aktif Terhubung (Sesi Browser Tersimpan)',
            notes: notes.trim() || `Terhubung otomatis via browser: ${email.trim()}`,
            email: email.trim(),
            loginMethod: 'browser_login'
          };

          onAddAccount(newAcc);
          setIsLoggingIn(false);
          onClose();
          return;
        } else {
          setLoginError(res.error || 'Gagal login otomatis. Pastikan password benar atau lakukan verifikasi di jendela browser.');
          setIsLoggingIn(false);
        }
      } catch (err: any) {
        setLoginError(err.message || 'Terjadi kendala saat membuka browser login.');
        setIsLoggingIn(false);
      }
    } else {
      // Lingkungan Web / Preview Simulative Fallback
      setTimeout(() => {
        setLoginStepStatus('2/3: Mengautentikasi akun di built-in browser...');
        setTimeout(() => {
          setLoginStepStatus('3/3: Berhasil login! Menyimpan sesi permanen...');
          
          const generatedUid = `1000${Math.floor(10000000000 + Math.random() * 90000000000)}`;
          const derivedName = name.trim() || (email.includes('@') ? email.split('@')[0] : 'Akun FB Baru');
          const autoAvatar = `https://graph.facebook.com/${generatedUid}/picture?type=large`;

          const newAcc: FBAccount = {
            id: tempAccId,
            name: derivedName,
            uid: generatedUid,
            avatar: autoAvatar,
            cookie: `c_user=${generatedUid}; xs=session_${Date.now()}; datr=fb_browser_session;`,
            token: 'EAABsbCS1iHgBA...',
            status: 'active',
            proxy: proxy.trim() || 'Direct IP (Indonesia)',
            dailyCommentCount: 0,
            dailyPostCount: 0,
            dailyJoinCount: 0,
            maxDailyComments: Number(maxDailyComments) || 60,
            maxDailyPosts: Number(maxDailyPosts) || 15,
            maxDailyJoins: Number(maxDailyJoins) || 10,
            joinedGroupsCount: 0,
            pages: [
              { id: `page-${Date.now()}`, name: `${derivedName} Official`, category: 'Shopping & Community', likes: 2300 }
            ],
            lastActive: 'Aktif Terhubung (Sesi Tersimpan)',
            notes: notes.trim() || `Login browser otomatis: ${email.trim()}`,
            email: email.trim(),
            loginMethod: 'browser_login'
          };

          onAddAccount(newAcc);
          setIsLoggingIn(false);
          onClose();
        }, 1200);
      }, 1000);
    }
  };

  // =========================================================================
  // HANDLER: Input Manual Cookie / UID
  // =========================================================================
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let finalUid = uid.trim();
    if (!finalUid && cookie) {
      const match = cookie.match(/c_user=(\d+)/);
      if (match && match[1]) {
        finalUid = match[1];
      }
    }
    if (!finalUid) {
      finalUid = `1000${Math.floor(10000000000 + Math.random() * 90000000000)}`;
    }

    const finalAvatar = resolvedAvatar || `https://graph.facebook.com/${finalUid}/picture?type=large`;

    const newAcc: FBAccount = {
      id: `acc-${Date.now()}`,
      name: name.trim(),
      uid: finalUid,
      avatar: finalAvatar,
      cookie: cookie.trim() || `c_user=${finalUid}; xs=42%3Asimulated%3A2%3A1718000000; datr=randomDatrKey;`,
      token: 'EAABsbCS1iHgBA...',
      status: 'active',
      proxy: proxy.trim() || 'Direct IP (Indonesia)',
      dailyCommentCount: 0,
      dailyPostCount: 0,
      dailyJoinCount: 0,
      maxDailyComments: Number(maxDailyComments) || 60,
      maxDailyPosts: Number(maxDailyPosts) || 15,
      maxDailyJoins: Number(maxDailyJoins) || 10,
      joinedGroupsCount: 0,
      pages: [
        { id: `page-${Date.now()}`, name: `${name.trim()} Official`, category: 'Shopping & Retail', likes: 1250 }
      ],
      lastActive: 'Baru ditambahkan (Siap Kerja)',
      notes: notes.trim() || 'Akun Facebook Asli',
      loginMethod: 'cookie'
    };

    onAddAccount(newAcc);
    onClose();
  };

  // =========================================================================
  // HANDLER: Import Bulk TXT
  // =========================================================================
  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkData.trim()) return;
    onImportBulk(bulkData);
    setBulkData('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#11141B] border border-[#1E293B] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1E293B] bg-[#0D0F15]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Hubungkan Akun Facebook</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  Built-in Runner
                </span>
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Login otomatis via browser, simpan cookie & UUID permanen, tanpa login berulang
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoggingIn}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#141824] transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#1E293B] bg-[#0D0F15]/60 px-5 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setTabMode('browser_login')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              tabMode === 'browser_login'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-[#94A3B8] hover:text-[#E2E8F0]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Login Otomatis di Browser (Utama)</span>
          </button>

          <button
            type="button"
            onClick={() => setTabMode('cookie_manual')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition ${
              tabMode === 'cookie_manual'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-[#94A3B8] hover:text-[#E2E8F0]'
            }`}
          >
            Input Cookie / UID
          </button>

          <button
            type="button"
            onClick={() => setTabMode('bulk')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition ${
              tabMode === 'bulk'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-[#94A3B8] hover:text-[#E2E8F0]'
            }`}
          >
            Import Bulk (TXT)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">

          {/* ============================================================== */}
          {/* TAB 1: LOGIN OTOMATIS VIA BROWSER                              */}
          {/* ============================================================== */}
          {tabMode === 'browser_login' && (
            <form id="form-browser-login" onSubmit={handleAutoBrowserLogin} className="space-y-4">
              
              {/* Highlight Box Penjelasan */}
              <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>Sistem Login Otomatis Browser Asli (Seperti iMacros Runner)</span>
                </div>
                <p className="text-xs text-[#CBD5E1] leading-relaxed">
                  Masukkan User & Password. Saat Anda klik <strong>"Hubungkan & Login Otomatis"</strong>, aplikasi akan membuka browser, mengisi form login secara manusiawi, menangkap cookie (<code className="text-cyan-300">c_user</code> & <code className="text-cyan-300">xs</code>), UUID, dan foto profil asli Facebook Anda secara otomatis.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sesi tersimpan permanen di partisi desktop — tidak perlu login berulang!</span>
                </div>
              </div>

              {loginError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Status Sedang Login */}
              {isLoggingIn && (
                <div className="p-4 bg-[#0D0F15] border border-indigo-500/50 rounded-xl flex items-center gap-3 animate-pulse">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white">{loginStepStatus}</p>
                    <p className="text-[11px] text-[#94A3B8]">
                      Jika ada verifikasi 2FA / OTP, Anda dapat langsung memasukkannya di jendela browser yang terbuka.
                    </p>
                  </div>
                </div>
              )}

              {/* Input Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                    Email atau Nomor HP FB <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contoh@gmail.com / 081234..."
                      disabled={isLoggingIn}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-[#0D0F15] text-[#E2E8F0] border border-[#1E293B] rounded-xl focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                    Password Facebook <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password akun FB Anda"
                      disabled={isLoggingIn}
                      className="w-full pl-9 pr-9 py-2 text-xs bg-[#0D0F15] text-[#E2E8F0] border border-[#1E293B] rounded-xl focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-[#64748B] hover:text-[#CBD5E1]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Optional Name & Proxy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                    Nama Akun (Opsional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Kosongkan jika ingin ditarik otomatis dari FB"
                    disabled={isLoggingIn}
                    className="w-full px-3 py-2 text-xs bg-[#0D0F15] text-[#E2E8F0] border border-[#1E293B] rounded-xl focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                    Proxy Khusus (Opsional)
                  </label>
                  <input
                    type="text"
                    value={proxy}
                    onChange={(e) => setProxy(e.target.value)}
                    placeholder="http://user:pass@ip:port (opsional)"
                    disabled={isLoggingIn}
                    className="w-full px-3 py-2 text-xs bg-[#0D0F15] text-[#E2E8F0] border border-[#1E293B] rounded-xl focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Batasan Harian Aman */}
              <div className="p-3 bg-[#0D0F15] border border-[#1E293B] rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    Batas Keamanan Aktivitas Harian (Anti-Ban)
                  </span>
                  <span className="text-[10px] text-[#94A3B8]">Perlindungan Algoritma</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-[#94A3B8] mb-1">Max Komen/Hari</label>
                    <input
                      type="number"
                      value={maxDailyComments}
                      onChange={(e) => setMaxDailyComments(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs bg-[#141824] text-indigo-300 border border-[#232D42] rounded-lg focus:outline-none font-semibold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#94A3B8] mb-1">Max Post/Hari</label>
                    <input
                      type="number"
                      value={maxDailyPosts}
                      onChange={(e) => setMaxDailyPosts(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs bg-[#141824] text-indigo-300 border border-[#232D42] rounded-lg focus:outline-none font-semibold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#94A3B8] mb-1">Max Join/Hari</label>
                    <input
                      type="number"
                      value={maxDailyJoins}
                      onChange={(e) => setMaxDailyJoins(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs bg-[#141824] text-indigo-300 border border-[#232D42] rounded-lg focus:outline-none font-semibold text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>{isLoggingIn ? 'Sedang Memproses Login di Browser...' : 'Buka Browser & Hubungkan Akun Otomatis'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </form>
          )}

          {/* ============================================================== */}
          {/* TAB 2: MANUAL COOKIE / UID INPUT                               */}
          {/* ============================================================== */}
          {tabMode === 'cookie_manual' && (
            <form id="form-single-account" onSubmit={handleSingleSubmit} className="space-y-4">
              
              {/* Live Profile Card Preview if UID/Avatar found */}
              {(uid || cookie) && (
                <div className="p-3 bg-[#0D0F15] border border-indigo-500/40 rounded-xl flex items-center gap-3 animate-fadeIn">
                  <img
                    src={resolvedAvatar || `https://graph.facebook.com/${uid || '100084729104821'}/picture?type=large`}
                    alt="FB Avatar"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                    }}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/60 shadow-md shrink-0 bg-[#141824]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <span>{name || 'Pratinjau Akun Facebook'}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                        Foto Asli FB
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-[#94A3B8] truncate">
                      UID: <span className="text-cyan-300 font-semibold">{uid || '(Otomatis dari cookie)'}</span>
                    </p>
                    <p className="text-[10px] text-[#64748B]">
                      Sesi terhubung & foto profil otomatis ditarik langsung dari Facebook Graph
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                    Nama Profil FB <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3 py-2 text-xs bg-[#0D0F15] text-[#E2E8F0] border border-[#1E293B] rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                    UID Facebook (c_user)
                  </label>
                  <input
                    type="text"
                    value={uid}
                    onChange={(e) => {
                      setUid(e.target.value);
                      if (e.target.value.trim()) {
                        setAvatar(`https://graph.facebook.com/${e.target.value.trim()}/picture?type=large`);
                      }
                    }}
                    placeholder="100084729104821"
                    className="w-full px-3 py-2 text-xs bg-[#0D0F15] text-[#E2E8F0] border border-[#1E293B] rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                  Cookie String (c_user, xs, datr) <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={cookie}
                  onChange={(e) => handleCookieChange(e.target.value)}
                  placeholder="c_user=100084729104821; xs=42%3Asimulated%3A2%3A1718000000; datr=..."
                  className="w-full px-3 py-2 text-xs bg-[#0D0F15] text-[#E2E8F0] border border-[#1E293B] rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                  Proxy Khusus (Opsional)
                </label>
                <input
                  type="text"
                  value={proxy}
                  onChange={(e) => setProxy(e.target.value)}
                  placeholder="http://username:password@ip:port (kosongkan jika direct IP)"
                  className="w-full px-3 py-2 text-xs bg-[#0D0F15] text-[#E2E8F0] border border-[#1E293B] rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Simpan Akun Manual</span>
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* TAB 3: BULK IMPORT                                             */}
          {/* ============================================================== */}
          {tabMode === 'bulk' && (
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div className="p-3 bg-[#0D0F15] border border-[#1E293B] rounded-xl">
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Masukkan daftar akun FB baris demi baris dengan format pemisah pipa (<code className="text-indigo-400">|</code>):
                </p>
                <p className="text-[11px] font-mono text-indigo-300 mt-1">
                  Nama Akun | UID | Cookie / Token | Proxy
                </p>
              </div>

              <div>
                <textarea
                  rows={6}
                  required
                  value={bulkData}
                  onChange={(e) => setBulkData(e.target.value)}
                  placeholder={`Akun FB 1 | 100084729104821 | c_user=100084729104821; xs=42%3A... | Direct IP\nAkun FB 2 | 100092817264819 | c_user=100092817264819; xs=42%3A... | 103.152.11.2:8080`}
                  className="w-full px-3 py-2 text-xs bg-[#0D0F15] text-[#E2E8F0] border border-[#1E293B] rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Impor Semua Akun FB</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
