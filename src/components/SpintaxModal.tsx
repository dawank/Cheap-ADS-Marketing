import React, { useState } from 'react';
import { X, Sparkles, Copy, Check, Wand2, Search, Tag } from 'lucide-react';
import { parseSpintax, generateSpintaxVariations, SPINTAX_PRESETS, SpintaxPreset } from '../utils/spintax';

interface SpintaxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate?: (template: string) => void;
}

export const SpintaxModal: React.FC<SpintaxModalProps> = ({
  isOpen,
  onClose,
  onUseTemplate
}) => {
  const [testText, setTestText] = useState('{{Halo|Hai|Permisi} {kak|gan|om}!|Salam kenal,} {Lagi cari|Butuh info} {promo spesial|diskon menarik}? Cek di {LINK}. {Semoga bermanfaat|Sukses selalu}! {🔥|🚀|👍}');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedPresetIdx, setCopiedPresetIdx] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [presetSearch, setPresetSearch] = useState<string>('');

  if (!isOpen) return null;

  const categories = ['Semua', ...Array.from(new Set(SPINTAX_PRESETS.map(p => p.category)))];

  const filteredPresets = SPINTAX_PRESETS.filter(preset => {
    const matchesCat = selectedCategory === 'Semua' || preset.category === selectedCategory;
    const matchesQuery = presetSearch.trim() === '' || 
      preset.name.toLowerCase().includes(presetSearch.toLowerCase()) ||
      preset.description.toLowerCase().includes(presetSearch.toLowerCase()) ||
      preset.template.toLowerCase().includes(presetSearch.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const variations = generateSpintaxVariations(testText, 6);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleCopyPreset = (template: string, idx: number) => {
    navigator.clipboard.writeText(template);
    setCopiedPresetIdx(idx);
    setTimeout(() => setCopiedPresetIdx(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#11141B] border border-[#1E293B] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1E293B] bg-[#0D0F15]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Katalog Preset & Generator Spintax Anti-Ban FB</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  {SPINTAX_PRESETS.length} Preset Tersedia
                </span>
              </h3>
              <p className="text-xs text-[#94A3B8]">Pilih template siap pakai untuk aneka kebutuhan promosi agar bebas checkpoint & deteksi spam</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#E2E8F0]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          
          {/* How to use */}
          <div className="p-3.5 bg-indigo-950/40 border border-indigo-900/60 rounded-xl text-xs text-indigo-200 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-cyan-300">
              <Wand2 className="w-3.5 h-3.5" /> Cara Kerja Spintax:
            </p>
            <code className="block font-mono bg-[#0D0F15] border border-[#1E293B] p-2 rounded text-emerald-400 text-[11px]">
              {'{Pilihan 1|Pilihan 2|Pilihan 3}'} atau bertingkat {'{{Halo|Hai} {kak|gan}|Permisi {bos|om}}'}
            </code>
            <p className="text-[11px] text-[#94A3B8]">Sistem CheapAds akan mengocok dan memilih salah satu kombinasi kata secara dinamis di setiap akun & setiap grup yang diposting.</p>
          </div>

          {/* Presets Filtering & Search */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                Pilih Preset Siap Pakai:
              </span>
              
              {/* Search Preset */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari preset spintax..."
                  value={presetSearch}
                  onChange={(e) => setPresetSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#0D0F15] border border-[#1E293B] rounded-xl text-[#E2E8F0] placeholder-[#64748B] focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                    selectedCategory === cat
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-indigo-400 font-semibold shadow-sm'
                      : 'bg-[#0D0F15] hover:bg-[#141824] text-[#CBD5E1] border-[#1E293B]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Presets List */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {filteredPresets.map((preset, idx) => (
                <div 
                  key={idx} 
                  className="p-3.5 rounded-xl bg-[#0D0F15] border border-[#1E293B] hover:border-[#334155] transition space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">{preset.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#141824] border border-[#232D42] text-indigo-300 font-medium">
                          {preset.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">{preset.description}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyPreset(preset.template, idx)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-[#141824] hover:bg-[#1C2336] text-[#CBD5E1] border border-[#232D42] rounded-lg transition flex items-center gap-1"
                        title="Salin template spintax"
                      >
                        {copiedPresetIdx === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-[#94A3B8]" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTestText(preset.template);
                          if (onUseTemplate) onUseTemplate(preset.template);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-lg shadow-sm transition"
                      >
                        Gunakan
                      </button>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-[#07080B] border border-[#1A2234] text-[11px] font-mono text-[#CBD5E1] leading-relaxed break-words max-h-24 overflow-y-auto">
                    {preset.template}
                  </div>
                </div>
              ))}

              {filteredPresets.length === 0 && (
                <div className="p-6 text-center text-xs text-[#64748B] bg-[#0D0F15] rounded-xl border border-[#1E293B]">
                  Tidak ada preset yang cocok dengan pencarian "{presetSearch}".
                </div>
              )}
            </div>
          </div>

          {/* Interactive Tester */}
          <div className="pt-3 border-t border-[#1E293B] space-y-2">
            <label className="text-xs font-semibold text-[#CBD5E1] flex items-center justify-between">
              <span>Uji Coba Teks Spintax (Interactive Tester):</span>
              <span className="text-[11px] text-[#94A3B8] font-normal">Edit teks untuk melihat preview acak di bawah</span>
            </label>
            <textarea
              rows={3}
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-[#0D0F15] border border-[#1E293B] rounded-xl text-[#E2E8F0] placeholder-[#64748B] focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Generated Variations */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-[#CBD5E1] flex items-center justify-between">
              <span>Hasil Acak Realtime (6 Variasi Berbeda):</span>
              <span className="text-[10px] text-[#64748B]">Otomatis Ter-generate</span>
            </span>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {variations.map((v, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-[#0D0F15] border border-[#1E293B] flex items-center justify-between gap-2 text-xs">
                  <span className="text-[#CBD5E1] italic font-sans truncate">"{v}"</span>
                  <button
                    onClick={() => handleCopy(v, i)}
                    className="p-1 rounded text-[#94A3B8] hover:text-white shrink-0"
                    title="Salin hasil"
                  >
                    {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E293B] bg-[#0D0F15] flex items-center justify-between">
          <span className="text-[11px] text-[#94A3B8]">
            Tips: Gunakan kombinasi sapaan dan penutup berbeda untuk setiap kampanye Facebook.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400 transition"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
};

