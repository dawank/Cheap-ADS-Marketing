import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Copy, 
  Check, 
  Search, 
  Filter, 
  Play, 
  Shuffle, 
  Layers, 
  ShieldCheck, 
  ArrowRight,
  Send,
  Zap,
  Tag
} from 'lucide-react';
import { 
  SPINTAX_PRESETS, 
  SpintaxPreset, 
  LAYER_1_HOOKS, 
  LAYER_2_APPRECIATIONS, 
  LAYER_3_LINKS, 
  LAYER_4_CLOSINGS,
  build4LayerSpintaxTemplate,
  formatCommentWithLink,
  applyEmojiAndPunctuationJitter,
  parseSpintax
} from '../utils/spintax';

interface SpintaxTabProps {
  onUseTemplateInCampaign?: (template: string) => void;
}

export const SpintaxTab: React.FC<SpintaxTabProps> = ({
  onUseTemplateInCampaign
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // 4-Layer Generator State
  const [selectedL1, setSelectedL1] = useState(0);
  const [selectedL2, setSelectedL2] = useState(0);
  const [selectedL3, setSelectedL3] = useState(0);
  const [selectedL4, setSelectedL4] = useState(0);
  const [testLinkUrl, setTestLinkUrl] = useState('https://shopee.co.id/promo-spesial-hari-ini');
  const [useJitter, setUseJitter] = useState(true);

  // Live Test Output
  const [generatedPreview, setGeneratedPreview] = useState<string>('');
  const [isCopiedPreview, setIsCopiedPreview] = useState(false);

  // Kategori unik dari 50+ preset
  const allCategories = ['all', ...Array.from(new Set(SPINTAX_PRESETS.map(p => p.category)))];

  const handleCopyPreset = (template: string, idx: number) => {
    navigator.clipboard.writeText(template);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleShuffle4Layer = () => {
    const l1 = Math.floor(Math.random() * LAYER_1_HOOKS.length);
    const l2 = Math.floor(Math.random() * LAYER_2_APPRECIATIONS.length);
    const l3 = Math.floor(Math.random() * LAYER_3_LINKS.length);
    const l4 = Math.floor(Math.random() * LAYER_4_CLOSINGS.length);
    setSelectedL1(l1);
    setSelectedL2(l2);
    setSelectedL3(l3);
    setSelectedL4(l4);

    // Langsung generate preview
    const template = build4LayerSpintaxTemplate(
      LAYER_1_HOOKS[l1],
      LAYER_2_APPRECIATIONS[l2],
      LAYER_3_LINKS[l3],
      LAYER_4_CLOSINGS[l4]
    );
    const res = formatCommentWithLink(template, testLinkUrl, useJitter);
    setGeneratedPreview(res);
  };

  const handleGenerateTestPreview = () => {
    const template = build4LayerSpintaxTemplate(
      LAYER_1_HOOKS[selectedL1],
      LAYER_2_APPRECIATIONS[selectedL2],
      LAYER_3_LINKS[selectedL3],
      LAYER_4_CLOSINGS[selectedL4]
    );
    const res = formatCommentWithLink(template, testLinkUrl, useJitter);
    setGeneratedPreview(res);
  };

  const filteredPresets = SPINTAX_PRESETS.filter(p => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.template.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-8 pb-16">
      
      {/* 1. Header Banner */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Koleksi 52+ Preset Siap Pakai & Jutaan Variasi 4-Layer</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Pustaka Preset Spintax & Generator Anti-Ban
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Algoritma Facebook sangat ketat memblokir teks yang sama secara berulang. 
            Gunakan preset kaya berlapis Spintax dan fitur Jitter kami agar setiap komentar memiliki 
            rangkaian karakter 100% unik di mata filter AI Facebook.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShuffle4Layer}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition shrink-0"
          >
            <Shuffle className="w-4 h-4" />
            <span>Kocok 4-Layer Acak</span>
          </button>
        </div>
      </div>

      {/* 2. Generator Interaktif 4-Layer */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1B2333]">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Generator Spintax 4-Layer (Sapaan → Apresiasi → Link Promosi → Penutup)
            </h3>
            <p className="text-xs text-[#94A3B8]">
              Rancang atau kocok 4 lapis pembentuk komentar alami untuk variasi jutaan kata tanpa batas
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-2 text-[#CBD5E1] cursor-pointer">
              <input
                type="checkbox"
                checked={useJitter}
                onChange={(e) => setUseJitter(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-[#141A29] border-[#334155]"
              />
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Anti-Ban Jitter
              </span>
            </label>
          </div>
        </div>

        {/* 4 Layer Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Layer 1 */}
          <div className="p-3.5 rounded-xl bg-[#141A29] border border-[#222B3D]">
            <div className="flex items-center justify-between text-xs font-bold text-indigo-300 mb-2">
              <span>Layer 1: Sapaan & Hook</span>
              <span className="text-[10px] text-[#64748B]">#{selectedL1 + 1}</span>
            </div>
            <select
              value={selectedL1}
              onChange={(e) => setSelectedL1(Number(e.target.value))}
              className="w-full bg-[#0E121E] border border-[#222B3D] text-xs text-white p-2 rounded-lg outline-none cursor-pointer"
            >
              {LAYER_1_HOOKS.map((h, i) => (
                <option key={i} value={i}>
                  Pola {i + 1}: {h.slice(0, 30)}...
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#94A3B8] mt-2 font-mono line-clamp-2">
              {LAYER_1_HOOKS[selectedL1]}
            </p>
          </div>

          {/* Layer 2 */}
          <div className="p-3.5 rounded-xl bg-[#141A29] border border-[#222B3D]">
            <div className="flex items-center justify-between text-xs font-bold text-cyan-300 mb-2">
              <span>Layer 2: Apresiasi & Relevansi</span>
              <span className="text-[10px] text-[#64748B]">#{selectedL2 + 1}</span>
            </div>
            <select
              value={selectedL2}
              onChange={(e) => setSelectedL2(Number(e.target.value))}
              className="w-full bg-[#0E121E] border border-[#222B3D] text-xs text-white p-2 rounded-lg outline-none cursor-pointer"
            >
              {LAYER_2_APPRECIATIONS.map((h, i) => (
                <option key={i} value={i}>
                  Pola {i + 1}: {h.slice(0, 30)}...
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#94A3B8] mt-2 font-mono line-clamp-2">
              {LAYER_2_APPRECIATIONS[selectedL2]}
            </p>
          </div>

          {/* Layer 3 */}
          <div className="p-3.5 rounded-xl bg-[#141A29] border border-[#222B3D]">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-300 mb-2">
              <span>Layer 3: Rekomendasi Link</span>
              <span className="text-[10px] text-[#64748B]">#{selectedL3 + 1}</span>
            </div>
            <select
              value={selectedL3}
              onChange={(e) => setSelectedL3(Number(e.target.value))}
              className="w-full bg-[#0E121E] border border-[#222B3D] text-xs text-white p-2 rounded-lg outline-none cursor-pointer"
            >
              {LAYER_3_LINKS.map((h, i) => (
                <option key={i} value={i}>
                  Pola {i + 1}: {h.slice(0, 30)}...
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#94A3B8] mt-2 font-mono line-clamp-2">
              {LAYER_3_LINKS[selectedL3]}
            </p>
          </div>

          {/* Layer 4 */}
          <div className="p-3.5 rounded-xl bg-[#141A29] border border-[#222B3D]">
            <div className="flex items-center justify-between text-xs font-bold text-amber-300 mb-2">
              <span>Layer 4: Penutup & Doa Sopan</span>
              <span className="text-[10px] text-[#64748B]">#{selectedL4 + 1}</span>
            </div>
            <select
              value={selectedL4}
              onChange={(e) => setSelectedL4(Number(e.target.value))}
              className="w-full bg-[#0E121E] border border-[#222B3D] text-xs text-white p-2 rounded-lg outline-none cursor-pointer"
            >
              {LAYER_4_CLOSINGS.map((h, i) => (
                <option key={i} value={i}>
                  Pola {i + 1}: {h.slice(0, 30)}...
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#94A3B8] mt-2 font-mono line-clamp-2">
              {LAYER_4_CLOSINGS[selectedL4]}
            </p>
          </div>

        </div>

        {/* Live Simulator Test Box */}
        <div className="p-4 rounded-xl bg-[#0A0D14] border border-[#1E2738] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1">
                Link Uji Coba ({`{LINK}`})
              </label>
              <input
                type="text"
                value={testLinkUrl}
                onChange={(e) => setTestLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-1.5 rounded-lg bg-[#141A29] border border-[#222B3D] text-xs text-cyan-300 font-mono outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0 pt-4 sm:pt-0">
              <button
                onClick={handleGenerateTestPreview}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Hasilkan Teks Uji Coba</span>
              </button>
            </div>
          </div>

          {/* Generated Result Output */}
          {generatedPreview && (
            <div className="mt-3 p-3.5 rounded-xl bg-[#141A29] border border-indigo-500/30 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Komentar Siap Kirim (Terurai Spintax & Jitter Unik)
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPreview);
                    setIsCopiedPreview(true);
                    setTimeout(() => setIsCopiedPreview(false), 2000);
                  }}
                  className="text-xs text-indigo-300 hover:text-white flex items-center gap-1 font-semibold"
                >
                  {isCopiedPreview ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopiedPreview ? 'Tersalin!' : 'Salin Hasil'}</span>
                </button>
              </div>
              <p className="text-xs text-[#E2E8F0] leading-relaxed whitespace-pre-wrap bg-[#0E121E] p-3 rounded-lg border border-[#222B3D]">
                {generatedPreview}
              </p>
            </div>
          )}
        </div>

      </div>

      {/* 3. Daftar 50+ Preset Spintax */}
      <div className="space-y-4">
        
        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Cari preset berdasarkan nama, kategori, kata kunci..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0E121E] border border-[#1E2738] text-xs text-white placeholder-[#64748B] focus:border-indigo-500 outline-none transition"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none py-1">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#0E121E] border border-[#1E2738] text-xs font-semibold text-[#CBD5E1] outline-none cursor-pointer shrink-0"
            >
              {allCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? `Semua Kategori (${SPINTAX_PRESETS.length})` : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Preset Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPresets.map((preset, index) => {
            const isCopied = copiedIndex === index;
            return (
              <div 
                key={index} 
                className="p-5 rounded-2xl bg-[#0E121E] border border-[#1E2738] hover:border-indigo-500/40 transition flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 pb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#141A29] text-indigo-300 border border-[#222B3D]">
                      {preset.category}
                    </span>
                    <button
                      onClick={() => handleCopyPreset(preset.template, index)}
                      className="text-xs text-[#94A3B8] hover:text-white p-1 transition flex items-center gap-1"
                      title="Salin Template Mentah"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="text-[10px]">{isCopied ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-white mt-1">
                    {preset.name}
                  </h4>
                  <p className="text-[11px] text-[#94A3B8] mt-1 line-clamp-2">
                    {preset.description}
                  </p>

                  <div className="mt-3 p-3 rounded-xl bg-[#141A29] border border-[#222B3D] text-[11px] font-mono text-[#CBD5E1] leading-relaxed line-clamp-4">
                    {preset.template}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1B2333] flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      const sample = formatCommentWithLink(preset.template, testLinkUrl, true);
                      setGeneratedPreview(sample);
                      window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Uji Acak</span>
                  </button>

                  {onUseTemplateInCampaign && (
                    <button
                      onClick={() => onUseTemplateInCampaign(preset.template)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <span>Pakai di Kampanye</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
