import React, { useState } from 'react';
import { 
  Monitor, 
  X, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  Terminal, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  FileCode, 
  FolderArchive,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface ElectronExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullDataPayload: {
    accounts: any[];
    groups: any[];
    campaigns: any[];
    scheduledPosts: any[];
    searchDatabase: any[];
    globalPostHistory: any[];
  };
  onImportData: (imported: any) => void;
}

export const ElectronExportModal: React.FC<ElectronExportModalProps> = ({
  isOpen,
  onClose,
  fullDataPayload,
  onImportData
}) => {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'main' | 'preload' | 'package' | 'guide'>('guide');

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(id);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const handleExportWorkspace = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullDataPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `cheapads-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportWorkspace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        onImportData(parsed);
        alert('Data workspace CheapAds berhasil diimpor!');
        onClose();
      } catch (err) {
        alert('Gagal membaca file JSON backup. Pastikan format valid.');
      }
    };
    reader.readAsText(file);
  };

  const ELECTRON_MAIN_JS = `// electron/main.js
const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'CheapAds FB Automation Desktop',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true, // WAJIB TRUE: Mengaktifkan built-in browser FB
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load React frontend dist
  const startUrl = process.env.ELECTRON_START_URL || \`file://\${path.join(__dirname, '../dist/index.html')}\`;
  mainWindow.loadURL(startUrl);

  // Auto handle proxy per account partition
  ipcMain.handle('set-account-proxy', async (event, { partitionName, proxyRules }) => {
    const ses = session.fromPartition(partitionName);
    await ses.setProxy({ proxyRules });
    return true;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
`;

  const ELECTRON_PRELOAD_JS = `// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronFB', {
  isDesktop: true,
  platform: process.platform,
  setProxy: (partitionName, proxyRules) => ipcRenderer.invoke('set-account-proxy', { partitionName, proxyRules }),
  injectHumanScript: (webviewId, scriptCode) => {
    const webview = document.getElementById(webviewId);
    if (webview) {
      return webview.executeJavaScript(scriptCode);
    }
  }
});
`;

  const PACKAGE_SCRIPTS = `{
  "name": "cheapads-fb-desktop",
  "version": "1.0.0",
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "electron:dev": "concurrently \\"vite\\" \\"wait-on http://localhost:3000 && electron .\\"",
    "dist": "vite build && electron-builder --win --x64"
  },
  "devDependencies": {
    "electron": "^31.0.0",
    "electron-builder": "^24.13.3",
    "concurrently": "^8.2.2",
    "wait-on": "^7.2.0"
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#11141B] border border-[#1E293B] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E293B] flex items-center justify-between bg-[#0D0F15]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Desktop App Builder & Data Portability</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                  Electron Ready
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Konfigurasi aplikasi desktop `.exe` (Electron) dan fitur Backup/Restore 1-klik.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1E293B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick 1-Click Backup & Restore Banner */}
        <div className="p-4 bg-[#141824] border-b border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <FolderArchive className="w-4 h-4 text-indigo-400" />
              <span>Backup & Pindahkan Seluruh Data Workspace</span>
            </h4>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">
              Simpan semua akun FB, daftar ratusan grup, template spintax, dan riwayat anti-tabrakan ke 1 file.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportWorkspace}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Backup (JSON)</span>
            </button>

            <label className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#1E293B] hover:bg-[#2A374F] text-xs font-semibold text-white cursor-pointer transition-all border border-[#2E3C56]">
              <Upload className="w-3.5 h-3.5" />
              <span>Pulihkan (Import)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportWorkspace}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Code Tabs Header */}
        <div className="px-6 pt-3 bg-[#0D0F15] border-b border-[#1E293B] flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveCodeTab('guide')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeCodeTab === 'guide'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cara Build ke .EXE (3 Langkah)</span>
          </button>
          <button
            onClick={() => setActiveCodeTab('main')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeCodeTab === 'main'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>electron/main.js</span>
          </button>
          <button
            onClick={() => setActiveCodeTab('preload')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeCodeTab === 'preload'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>electron/preload.js</span>
          </button>
          <button
            onClick={() => setActiveCodeTab('package')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeCodeTab === 'package'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>package.json scripts</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0B0D13]">
          
          {activeCodeTab === 'guide' && (
            <div className="space-y-4">
              <div className="bg-[#11141B] p-4 rounded-xl border border-[#1E293B] space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">1</span>
                  <span>Install Dependensi Electron di Komputer Lokal</span>
                </h4>
                <p className="text-xs text-[#94A3B8]">
                  Buka terminal di folder project Anda, lalu jalankan perintah berikut:
                </p>
                <div className="relative bg-[#0D0F15] p-3 rounded-lg border border-[#1E293B] font-mono text-xs text-emerald-400 flex items-center justify-between">
                  <code>npm install --save-dev electron electron-builder concurrently wait-on</code>
                  <button
                    onClick={() => handleCopy('npm install --save-dev electron electron-builder concurrently wait-on', 'install')}
                    className="p-1 rounded bg-[#1E293B] text-white hover:bg-indigo-600 transition-colors"
                  >
                    {copiedTab === 'install' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="bg-[#11141B] p-4 rounded-xl border border-[#1E293B] space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">2</span>
                  <span>Uji Coba Langsung di Desktop (Dev Mode)</span>
                </h4>
                <p className="text-xs text-[#94A3B8]">
                  Jalankan perintah ini untuk membuka window aplikasi desktop secara langsung dan login dengan akun FB asli:
                </p>
                <div className="relative bg-[#0D0F15] p-3 rounded-lg border border-[#1E293B] font-mono text-xs text-emerald-400 flex items-center justify-between">
                  <code>npm run electron:dev</code>
                  <button
                    onClick={() => handleCopy('npm run electron:dev', 'devrun')}
                    className="p-1 rounded bg-[#1E293B] text-white hover:bg-indigo-600 transition-colors"
                  >
                    {copiedTab === 'devrun' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="bg-[#11141B] p-4 rounded-xl border border-[#1E293B] space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">3</span>
                  <span>Kompilasi Menjadi File Installer (.EXE)</span>
                </h4>
                <p className="text-xs text-[#94A3B8]">
                  Untuk membuat file installer `.exe` yang siap dipasang di laptop Windows mana pun:
                </p>
                <div className="relative bg-[#0D0F15] p-3 rounded-lg border border-[#1E293B] font-mono text-xs text-emerald-400 flex items-center justify-between">
                  <code>npm run dist</code>
                  <button
                    onClick={() => handleCopy('npm run dist', 'distrun')}
                    className="p-1 rounded bg-[#1E293B] text-white hover:bg-indigo-600 transition-colors"
                  >
                    {copiedTab === 'distrun' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 pt-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>File `.exe` akan otomatis tersimpan di folder <code>/dist/CheapAds-Setup-1.0.0.exe</code>.</span>
                </p>
              </div>
            </div>
          )}

          {activeCodeTab === 'main' && (
            <div className="relative">
              <button
                onClick={() => handleCopy(ELECTRON_MAIN_JS, 'mainjs')}
                className="absolute right-3 top-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-indigo-600 text-xs font-medium text-white transition-colors"
              >
                {copiedTab === 'mainjs' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Salin File</span>
              </button>
              <pre className="bg-[#0D0F15] p-4 rounded-xl border border-[#1E293B] text-xs font-mono text-[#94A3B8] overflow-x-auto">
                <code>{ELECTRON_MAIN_JS}</code>
              </pre>
            </div>
          )}

          {activeCodeTab === 'preload' && (
            <div className="relative">
              <button
                onClick={() => handleCopy(ELECTRON_PRELOAD_JS, 'preloadjs')}
                className="absolute right-3 top-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-indigo-600 text-xs font-medium text-white transition-colors"
              >
                {copiedTab === 'preloadjs' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Salin File</span>
              </button>
              <pre className="bg-[#0D0F15] p-4 rounded-xl border border-[#1E293B] text-xs font-mono text-[#94A3B8] overflow-x-auto">
                <code>{ELECTRON_PRELOAD_JS}</code>
              </pre>
            </div>
          )}

          {activeCodeTab === 'package' && (
            <div className="relative">
              <button
                onClick={() => handleCopy(PACKAGE_SCRIPTS, 'packagescripts')}
                className="absolute right-3 top-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-indigo-600 text-xs font-medium text-white transition-colors"
              >
                {copiedTab === 'packagescripts' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Salin Script</span>
              </button>
              <pre className="bg-[#0D0F15] p-4 rounded-xl border border-[#1E293B] text-xs font-mono text-[#94A3B8] overflow-x-auto">
                <code>{PACKAGE_SCRIPTS}</code>
              </pre>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E293B] bg-[#0D0F15] flex items-center justify-between text-xs text-[#94A3B8]">
          <span>CheapAds siap diekspor & dijalankan 100% lokal di desktop Anda.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
