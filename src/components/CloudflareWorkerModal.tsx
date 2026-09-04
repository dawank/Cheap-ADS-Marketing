import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  Code, 
  Sparkles, 
  Globe, 
  CheckCircle2,
  HelpCircle,
  Play,
  Layers,
  Laptop
} from 'lucide-react';
import { CLOUDFLARE_WORKER_SCRIPT, generateCloakedLink, getAppRedirectOrigin } from '../utils/linkCloaker';

interface CloudflareWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWorkerUrl?: string;
  onSaveWorkerUrl: (url: string) => void;
}

export const CloudflareWorkerModal: React.FC<CloudflareWorkerModalProps> = ({
  isOpen,
  onClose,
  initialWorkerUrl = '',
  onSaveWorkerUrl
}) => {
  const [activeTab, setActiveTab] = useState<'app' | 'cloudflare'>('app');
  const [copiedScript, setCopiedScript] = useState(false);
  const [workerUrl, setWorkerUrl] = useState(initialWorkerUrl);
  const [testOriginalUrl, setTestOriginalUrl] = useState('https://s.shopee.co.id/3qMoGxoqNB');
  const [copiedLink, setCopiedLink] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const currentAppOrigin = getAppRedirectOrigin();
  const effectiveBase = activeTab === 'app' ? currentAppOrigin : workerUrl;
  const generatedPreview = generateCloakedLink(testOriginalUrl, effectiveBase, 'base64');

  const handleCopyScript = () => {
    navigator.clipboard.writeText(CLOUDFLARE_WORKER_SCRIPT);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleCopyGeneratedLink = () => {
    navigator.clipboard.writeText(generatedPreview);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveDefault = () => {
    onSaveWorkerUrl(workerUrl.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#11141B] border border-[#1E293B] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1E293B] bg-[#0D0F15]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Generator Link Mantulan Anti-Blokir FB</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                  100% Gratis (Rp 0)
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Bungkus link affiliate Shopee / Tokopedia agar lolos sensor spam Facebook dan mental instan saat diklik.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#1E293B] bg-[#0A0C10] px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('app')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'app' 
                ? 'border-emerald-500 text-emerald-400' 
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Pemantul Bawaan Aplikasi (Tanpa Cloudflare)</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">Siap Pakai</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cloudflare')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'cloudflare' 
                ? 'border-indigo-500 text-indigo-400' 
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Cloudflare Worker (Opsional)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-[#CBD5E1]">
          
          {activeTab === 'app' ? (
            /* Tab 1: Pemantul Bawaan Aplikasi Ini Langsung */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/30 via-indigo-950/20 to-transparent border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white">Pemantul Bawaan Aplikasi Sudah Aktif & Siap Digunakan!</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  Aplikasi ini sudah dilengkapi sistem pemantul instan langsung dari domain aplikasi Anda. Anda tidak perlu repot membuat akun Cloudflare. Setiap link Shopee yang dibungkus akan langsung memantul ke aplikasi Shopee dalam hitungan 0.01 detik saat diklik di FB.
                </p>
                <div className="p-2 bg-[#0D0F15] rounded-lg border border-[#1E293B] font-mono text-[11px] text-emerald-300 flex items-center justify-between">
                  <span className="truncate">Domain Aktif: {currentAppOrigin}</span>
                  <span className="text-[10px] text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 font-sans font-bold">ONLINE</span>
                </div>
              </div>

              {/* Box Tester Langsung */}
              <div className="p-4 bg-[#0D0F15] border border-[#1E293B] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Uji Coba & Bungkus Link Sekarang:</span>
                  </label>
                  <span className="text-[10px] text-[#94A3B8]">Coba tempel link affiliate Anda di bawah</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-[#64748B] block mb-1">Link Affiliate Asli Anda:</span>
                    <input
                      type="text"
                      value={testOriginalUrl}
                      onChange={(e) => setTestOriginalUrl(e.target.value)}
                      placeholder="https://s.shopee.co.id/..."
                      className="w-full px-3 py-2 text-xs bg-[#141824] border border-[#232D42] rounded-lg text-white font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-[#64748B] block mb-1">Link Mantulan Hasil Buatan Aplikasi (Aman untuk Komentar FB):</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={generatedPreview}
                        className="w-full px-3 py-2 text-xs bg-[#141824] border border-emerald-500/40 rounded-lg text-emerald-300 font-mono select-all truncate font-semibold"
                      />
                      <button
                        type="button"
                        onClick={handleCopyGeneratedLink}
                        title="Salin Link Mantulan"
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition flex items-center gap-1 shrink-0"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                      <a
                        href={generatedPreview}
                        target="_blank"
                        rel="noreferrer"
                        title="Tes Buka di Tab Baru"
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition flex items-center gap-1 shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Tes Klik</span>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-[#94A3B8] border-t border-[#1E293B]">
                  💡 <b>Cara tes di FB:</b> Salin link hasil di atas, lalu posting komentar manual di salah satu grup atau postingan Facebook. Link tersebut tidak menggunakan kata <code>shopee</code> atau <code>affiliate</code> di teksnya, sehingga aman dari bot pembersih link!
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Panduan Cloudflare Worker Pribadi */
            <div className="space-y-4">
              {/* Keunggulan Ringkas */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/30 via-indigo-950/20 to-transparent border border-emerald-500/30 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center">
                <div className="p-2 bg-[#0D0F15]/80 rounded-lg border border-[#1E293B]">
                  <div className="font-bold text-emerald-400">1x Klik Langsung</div>
                  <div className="text-[11px] text-[#94A3B8]">Tanpa landing page perantara, 0.05 detik mental ke Shopee</div>
                </div>
                <div className="p-2 bg-[#0D0F15]/80 rounded-lg border border-[#1E293B]">
                  <div className="font-bold text-indigo-400">Kebal Sensor FB</div>
                  <div className="text-[11px] text-[#94A3B8]">Menggunakan domain terpercaya resmi <code>.workers.dev</code></div>
                </div>
                <div className="p-2 bg-[#0D0F15]/80 rounded-lg border border-[#1E293B]">
                  <div className="font-bold text-amber-400">Bebas Kuota</div>
                  <div className="text-[11px] text-[#94A3B8]">100.000 klik gratis/hari dari Cloudflare tanpa bayar</div>
                </div>
              </div>

              {/* 4 Langkah Praktis */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>4 Langkah Mudah (Selesai Dalam 2 Menit):</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-[#0D0F15] border border-[#1E293B] space-y-1">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-[10px]">1</span>
                      <span>Buka Cloudflare</span>
                    </div>
                    <p className="text-[#94A3B8] text-[11px]">
                      Buka website gratis di{' '}
                      <a 
                        href="https://dash.cloudflare.com" 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-indigo-400 hover:underline inline-flex items-center gap-0.5"
                      >
                        dash.cloudflare.com <ExternalLink className="w-2.5 h-2.5" />
                      </a>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0D0F15] border border-[#1E293B] space-y-1">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-[10px]">2</span>
                      <span>Buat Worker</span>
                    </div>
                    <p className="text-[#94A3B8] text-[11px]">
                      Pilih <b>Workers & Pages</b> ➔ <b>Create Application</b> ➔ <b>Create Worker</b>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0D0F15] border border-[#1E293B] space-y-1">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-[10px]">3</span>
                      <span>Tempel Kode Script</span>
                    </div>
                    <p className="text-[#94A3B8] text-[11px]">
                      Klik <b>Edit Code</b>, hapus isi bawaan, lalu salin script di bawah dan klik <b>Deploy</b>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0D0F15] border border-[#1E293B] space-y-1">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center text-[10px]">4</span>
                      <span>Salin URL Worker</span>
                    </div>
                    <p className="text-[#94A3B8] text-[11px]">
                      Tempel URL Worker Anda (contoh: <code>https://pemantul.namamu.workers.dev</code>) di kotak bawah.
                    </p>
                  </div>
                </div>
              </div>

              {/* Script Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Script Universal Cloudflare Worker (Copy-Paste Langsung):</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow transition flex items-center gap-1.5"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Kode Script</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <pre className="p-3.5 bg-[#0D0F15] border border-[#1E293B] rounded-xl font-mono text-[11px] text-emerald-300/90 overflow-x-auto max-h-36 leading-relaxed select-all">
                    {CLOUDFLARE_WORKER_SCRIPT}
                  </pre>
                </div>
              </div>

              {/* Konfigurasi URL Worker */}
              <div className="p-4 bg-[#0D0F15] border border-[#1E293B] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    <span>URL Worker Anda (Hasil Langkah 4)</span>
                  </label>
                  {saveSuccess && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Berhasil disimpan!
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={workerUrl}
                    onChange={(e) => setWorkerUrl(e.target.value)}
                    placeholder="https://pemantul-promo.namakamu.workers.dev"
                    className="flex-1 px-3.5 py-2 text-xs bg-[#141824] border border-[#232D42] rounded-xl text-white placeholder-[#64748B] focus:border-indigo-500 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSaveDefault}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition flex items-center gap-1 shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#1E293B] bg-[#0D0F15]">
          <div className="text-[11px] text-[#94A3B8] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Link mantulan ini 100% aman digunakan di grup & komentar Facebook.</span>
          </div>
          <button
            onClick={() => {
              if (workerUrl.trim()) onSaveWorkerUrl(workerUrl.trim());
              onClose();
            }}
            className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl shadow-md transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
