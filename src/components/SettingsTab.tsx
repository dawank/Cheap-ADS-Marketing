import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Clock, 
  Monitor, 
  Cpu, 
  Eye, 
  EyeOff, 
  Zap, 
  ThumbsUp, 
  Keyboard, 
  Save, 
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { EngineSettings } from '../types';
import { DEFAULT_ENGINE_SETTINGS } from '../data/mockData';

interface SettingsTabProps {
  settings: EngineSettings;
  onSaveSettings: (settings: EngineSettings) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onSaveSettings
}) => {
  const [formData, setFormData] = useState<EngineSettings>({ ...settings });
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleReset = () => {
    setFormData({ ...DEFAULT_ENGINE_SETTINGS });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-16 max-w-4xl">
      
      {/* Top Banner */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            Pengaturan Mesin Otomasi & Anti-Ban Facebook
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Konfigurasikan ritme gerak manusiawi, mode latar belakang tanpa menutupi layar, 
            dan batas keamanan agar akun Facebook Anda awet terhindar dari checkpoint.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaved ? 'Tersimpan!' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </div>

      {isSaved && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>Pengaturan mesin otomasi berhasil disimpan dan akan diterapkan pada sesi berikutnya!</span>
        </div>
      )}

      {/* 1. Mode Kerja Mesin (Latar Belakang vs Tampilan Layar) */}
      <div className="p-6 rounded-2xl bg-[#0E121E] border border-[#1E2738] shadow-lg space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#1B2333]">
          <Monitor className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">
            Mode Tampilan & Eksekusi Mesin (Desktop Experience)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          {/* Toggle 1: Jalankan di Latar Belakang (Background Mode) */}
          <div className="p-4 rounded-xl bg-[#141A29] border border-[#222B3D] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <EyeOff className="w-4 h-4 text-indigo-400" />
                Jalankan di Latar Belakang (Background Mode)
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.runInBackground}
                  onChange={(e) => setFormData({ ...formData, runInBackground: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#0E121E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Jika diaktifkan, browser otomasi berjalan tersembunyi tanpa menutupi layar kerja Anda, 
              sehingga komputer tetap nyaman dipakai bekerja atau mengetik saat otomasi aktif.
            </p>
          </div>

          {/* Toggle 2: Tampilkan Jendela Browser (Headful / Visible) */}
          <div className="p-4 rounded-xl bg-[#141A29] border border-[#222B3D] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-cyan-400" />
                Tampilkan Jendela Browser Visual
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showBrowserWindow}
                  onChange={(e) => setFormData({ ...formData, showBrowserWindow: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#0E121E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Membuka jendela browser nyata di layar untuk melihat proses pengetikan dan interaksi 
              Facebook secara langsung (sangat bermanfaat saat memantau di awal).
            </p>
          </div>

        </div>
      </div>

      {/* 2. Pengaturan Jeda Manusiawi (Human-like Delays) */}
      <div className="p-6 rounded-2xl bg-[#0E121E] border border-[#1E2738] shadow-lg space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#1B2333]">
          <Clock className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">
            Pengaturan Jeda Manusiawi (Human Delays & Interaction)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          {/* Min & Max Delay */}
          <div className="p-4 rounded-xl bg-[#141A29] border border-[#222B3D] space-y-2">
            <label className="block font-bold text-white">
              Jeda Acak Antar Komentar (Detik)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-[#64748B]">Minimal (Detik):</span>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={formData.humanDelayMin}
                  onChange={(e) => setFormData({ ...formData, humanDelayMin: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0E121E] border border-[#222B3D] text-white font-mono"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#64748B]">Maksimal (Detik):</span>
                <input
                  type="number"
                  min={10}
                  max={300}
                  value={formData.humanDelayMax}
                  onChange={(e) => setFormData({ ...formData, humanDelayMax: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0E121E] border border-[#222B3D] text-white font-mono"
                />
              </div>
            </div>
            <p className="text-[11px] text-[#94A3B8]">
              Jeda acak bervariasi mencegah pola mekanik bot yang mudah dibaca AI FB.
            </p>
          </div>

          {/* Reading Delay */}
          <div className="p-4 rounded-xl bg-[#141A29] border border-[#222B3D] space-y-2">
            <label className="block font-bold text-white">
              Durasi Membaca / Scroll Sebelum Aksi
            </label>
            <div>
              <span className="text-[10px] text-[#64748B]">Durasi Baca (Detik):</span>
              <input
                type="number"
                min={2}
                max={60}
                value={formData.readingDelaySec}
                onChange={(e) => setFormData({ ...formData, readingDelaySec: Number(e.target.value) })}
                className="w-full px-3 py-1.5 rounded-lg bg-[#0E121E] border border-[#222B3D] text-white font-mono"
              />
            </div>
            <p className="text-[11px] text-[#94A3B8]">
              Browser men-scroll halaman dan diam membaca seperti pengguna manusia normal.
            </p>
          </div>

          {/* Keystroke Emulation */}
          <div className="p-4 rounded-xl bg-[#141A29] border border-[#222B3D] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Keyboard className="w-4 h-4 text-indigo-400" />
                Ketik Karakter Demi Karakter (Keystroke Emulation)
              </span>
              <input
                type="checkbox"
                checked={formData.keystrokeEmulation}
                onChange={(e) => setFormData({ ...formData, keystrokeEmulation: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-[#0E121E] border-[#334155]"
              />
            </div>
            <p className="text-[11px] text-[#94A3B8]">
              Tidak melakukan copy-paste instan, melainkan menekan tombol keyboard dengan kecepatan alami.
            </p>
          </div>

          {/* Like Before Comment */}
          <div className="p-4 rounded-xl bg-[#141A29] border border-[#222B3D] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <ThumbsUp className="w-4 h-4 text-cyan-400" />
                Beri Like / Jempol Sebelum Komentar
              </span>
              <input
                type="checkbox"
                checked={formData.likeBeforeComment}
                onChange={(e) => setFormData({ ...formData, likeBeforeComment: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-[#0E121E] border-[#334155]"
              />
            </div>
            <p className="text-[11px] text-[#94A3B8]">
              Meningkatkan interaksi positif akun dengan menyukai postingan sebelum meninggalkan link.
            </p>
          </div>

        </div>
      </div>

      {/* 3. Batas Keamanan & Anti-Ban Facebook */}
      <div className="p-6 rounded-2xl bg-[#0E121E] border border-[#1E2738] shadow-lg space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#1B2333]">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">
            Batas Keamanan & Anti-Ban Guard
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          {/* Istirahat Batch */}
          <div className="p-4 rounded-xl bg-[#141A29] border border-[#222B3D] space-y-2">
            <label className="block font-bold text-white">
              Istirahat Berkala (Batch Rest)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-[#64748B]">Setiap Berapa Komentar:</span>
                <input
                  type="number"
                  min={3}
                  max={50}
                  value={formData.batchRestCount}
                  onChange={(e) => setFormData({ ...formData, batchRestCount: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0E121E] border border-[#222B3D] text-white font-mono"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#64748B]">Lama Istirahat (Menit):</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={formData.batchRestMinutes}
                  onChange={(e) => setFormData({ ...formData, batchRestMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0E121E] border border-[#222B3D] text-white font-mono"
                />
              </div>
            </div>
            <p className="text-[11px] text-[#94A3B8]">
              Memberi jeda tidur pada mesin otomasi agar akun tidak dicurigai beraktivitas non-stop.
            </p>
          </div>

          {/* Batas Maksimum Harian */}
          <div className="p-4 rounded-xl bg-[#141A29] border border-[#222B3D] space-y-2">
            <label className="block font-bold text-white">
              Batas Maksimum Komentar Harian per Akun
            </label>
            <div>
              <span className="text-[10px] text-[#64748B]">Maksimal Postingan / Hari:</span>
              <input
                type="number"
                min={5}
                max={150}
                value={formData.maxDailyCommentsPerAccount}
                onChange={(e) => setFormData({ ...formData, maxDailyCommentsPerAccount: Number(e.target.value) })}
                className="w-full px-3 py-1.5 rounded-lg bg-[#0E121E] border border-[#222B3D] text-white font-mono"
              />
            </div>
            <p className="text-[11px] text-[#94A3B8]">
              Batas aman rekomendasi untuk akun berumur lama adalah 30-60 komentar/hari.
            </p>
          </div>

          {/* Mode Siluman (Stealth Mode) */}
          <div className="p-4 rounded-xl bg-[#141A29] border border-[#222B3D] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                Mode Siluman (Stealth Edit Mode)
              </span>
              <input
                type="checkbox"
                checked={formData.stealthMode}
                onChange={(e) => setFormData({ ...formData, stealthMode: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-[#0E121E] border-[#334155]"
              />
            </div>
            <p className="text-[11px] text-[#94A3B8]">
              Kirim teks komentar alami dahulu tanpa link, lalu diedit menyisipkan link promosi setelah jeda waktu.
            </p>
            {formData.stealthMode && (
              <div className="pt-2 flex items-center gap-2">
                <span className="text-[#64748B]">Jeda Edit:</span>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={formData.stealthEditDelaySec}
                  onChange={(e) => setFormData({ ...formData, stealthEditDelaySec: Number(e.target.value) })}
                  className="w-24 px-2 py-1 rounded-lg bg-[#0E121E] border border-[#222B3D] text-white font-mono text-xs"
                />
                <span className="text-[#64748B]">Detik</span>
              </div>
            )}
          </div>

          {/* Emoji & Punctuation Jitter */}
          <div className="p-4 rounded-xl bg-[#141A29] border border-[#222B3D] space-y-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Cryptographic Jitter & Zero-Width Hasher
            </span>
            <div className="space-y-1.5 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.punctuationJitter}
                  onChange={(e) => setFormData({ ...formData, punctuationJitter: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-[#0E121E] border-[#334155]"
                />
                <span className="text-white">Punctuation Jitter & Sisipan Zero-Width Space (\u200B)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.emojiJitter}
                  onChange={(e) => setFormData({ ...formData, emojiJitter: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-[#0E121E] border-[#334155]"
                />
                <span className="text-white">Variasi Emoji Acak di Akhir Kalimat</span>
              </label>
            </div>
            <p className="text-[11px] text-[#94A3B8]">
              Merusak hash deteksi bot Facebook agar tidak ada 2 komentar dengan string identik.
            </p>
          </div>

        </div>
      </div>

    </form>
  );
};
