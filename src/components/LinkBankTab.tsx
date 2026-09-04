import React, { useState } from 'react';
import { 
  Link2, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  RefreshCw, 
  Search, 
  Filter, 
  Sliders, 
  Globe, 
  Sparkles,
  Zap,
  Tag,
  AlertCircle
} from 'lucide-react';
import { ProductBankItem } from '../types';
import { generateCloakedLink } from '../utils/linkCloaker';

interface LinkBankTabProps {
  productLinks: ProductBankItem[];
  onAddLink: (item: Omit<ProductBankItem, 'id' | 'createdAt' | 'sentTodayCount' | 'totalSentCount'>) => void;
  onUpdateLink: (id: string, updates: Partial<ProductBankItem>) => void;
  onDeleteLink: (id: string) => void;
}

export const LinkBankTab: React.FC<LinkBankTabProps> = ({
  productLinks,
  onAddLink,
  onUpdateLink,
  onDeleteLink
}) => {
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [label, setLabel] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');
  const [category, setCategory] = useState('Fashion');
  const [cloakerMode, setCloakerMode] = useState<'direct' | 'base64' | 'worker'>('base64');
  const [workerUrl, setWorkerUrl] = useState('');
  const [enableSubId, setEnableSubId] = useState(true);
  const [subIdPrefix, setSubIdPrefix] = useState('fb_aff');
  const [notes, setNotes] = useState('');

  const categories = [
    'Fashion', 
    'Gadget', 
    'Kecantikan', 
    'Kuliner', 
    'E-Commerce', 
    'Jual Beli', 
    'Kontak', 
    'Bisnis', 
    'Loker', 
    'Properti', 
    'Otomotif', 
    'Lainnya'
  ];

  const handleCopyLink = (item: ProductBankItem) => {
    let finalUrl = item.originalUrl;
    if (item.cloakerMode === 'base64') {
      finalUrl = generateCloakedLink(item.originalUrl, undefined, 'base64');
    } else if (item.cloakerMode === 'worker' && item.workerUrl) {
      finalUrl = generateCloakedLink(item.originalUrl, item.workerUrl, 'base64');
    }
    
    if (item.enableSubId) {
      const sep = finalUrl.includes('?') ? '&' : '?';
      finalUrl = `${finalUrl}${sep}sub_id=${item.subIdPrefix}_${Math.random().toString(36).substring(2, 7)}`;
    }

    navigator.clipboard.writeText(finalUrl);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !originalUrl.trim()) return;

    onAddLink({
      label: label.trim(),
      originalUrl: originalUrl.trim(),
      category,
      cloakerMode,
      workerUrl: workerUrl.trim() || undefined,
      enableSubId,
      subIdPrefix: subIdPrefix.trim() || 'fb_aff',
      isActive: true,
      notes: notes.trim() || undefined
    });

    // Reset
    setLabel('');
    setOriginalUrl('');
    setNotes('');
    setIsAddModalOpen(false);
  };

  const filteredLinks = productLinks.filter(item => {
    const matchesSearch = item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.originalUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner & Action */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-cyan-400" />
            Bank Link & Gudang Produk Terpusat
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Simpan seluruh tautan jualan Shopee, Tokopedia, TikTok Shop, WhatsApp, atau landing page Anda di sini. 
            Sistem auto-pilot kampanye akan mengambil dan merotasi link aktif secara otomatis dan adil.
          </p>
        </div>

        <button
          id="btn-add-product-link"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Link Baru</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Cari nama produk, link tujuan, atau kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-none py-1">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 outline-none cursor-pointer shrink-0"
          >
            <option value="all">Semua Kategori ({productLinks.length})</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Kartu Link Produk */}
      {filteredLinks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((item) => {
            const isCopied = copiedId === item.id;
            return (
              <div 
                key={item.id} 
                className={`p-4 rounded-xl bg-slate-900 border transition flex flex-col justify-between shadow-sm relative ${
                  item.isActive ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/60 opacity-60'
                }`}
              >
                <div>
                  {/* Category & Status Toggle */}
                  <div className="flex items-center justify-between gap-2 pb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      {item.category || 'Umum'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdateLink(item.id, { isActive: !item.isActive })}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition ${
                          item.isActive 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                        }`}
                      >
                        {item.isActive ? '● Aktif Dirotasi' : '○ Non-Aktif'}
                      </button>
                      <button
                        onClick={() => onDeleteLink(item.id)}
                        className="text-[#64748B] hover:text-rose-400 p-1 transition"
                        title="Hapus Link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Notes */}
                  <h3 className="text-sm font-bold text-white mt-1 line-clamp-2">
                    {item.label}
                  </h3>
                  {item.notes && (
                    <p className="text-[11px] text-[#94A3B8] mt-1 line-clamp-1">
                      {item.notes}
                    </p>
                  )}

                  {/* Original URL Preview */}
                  <div className="mt-3 p-2.5 rounded-xl bg-[#141A29] border border-[#222B3D] text-[11px] font-mono text-[#94A3B8] truncate">
                    <div className="text-[9px] uppercase font-bold text-[#64748B] tracking-wider mb-0.5">
                      URL Tujuan:
                    </div>
                    <span className="text-indigo-300 truncate block">
                      {item.originalUrl}
                    </span>
                  </div>

                  {/* Settings Badges */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-[#121724] text-[#CBD5E1] border border-[#1E2738]">
                      Pantulan: <strong className="text-cyan-400 font-mono">{item.cloakerMode.toUpperCase()}</strong>
                    </span>
                    {item.enableSubId && (
                      <span className="px-2 py-0.5 rounded bg-[#121724] text-emerald-400 border border-emerald-500/20 font-mono">
                        +{item.subIdPrefix}_[rand]
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Metrics & Actions */}
                <div className="mt-4 pt-3 border-t border-[#1B2333] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-[11px] text-[#64748B]">
                    <span>Hari Ini: <strong className="text-white font-mono">{item.sentTodayCount || 0}x</strong></span>
                    <span>•</span>
                    <span>Total: <strong className="text-white font-mono">{item.totalSentCount || 0}x</strong></span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyLink(item)}
                      className="p-1.5 rounded-lg bg-[#141A29] hover:bg-[#1C2438] text-[#94A3B8] hover:text-white border border-[#222B3D] transition"
                      title="Salin Link Siap Pakai"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={item.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-[#141A29] hover:bg-[#1C2438] text-cyan-400 hover:text-cyan-300 border border-[#222B3D] transition"
                      title="Uji Buka URL di Tab Baru"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-[#0E121E] border border-[#1E2738] text-center">
          <Link2 className="w-10 h-10 text-[#334155] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">Tidak ada link ditemukan</h3>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-sm mx-auto">
            {searchQuery 
              ? 'Tidak ada link yang sesuai dengan pencarian Anda. Coba kata kunci lain.' 
              : 'Gudang Bank Link Anda masih kosong. Tambahkan link produk jualan pertama Anda!'}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            + Tambah Link Produk
          </button>
        </div>
      )}

      {/* Modal Tambah Link Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-[#0E121E] border border-[#222B3D] shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#1B2333]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-cyan-400" />
                  Tambah Link Produk ke Bank Link
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Simpan link untuk digunakan otomatis di seluruh kampanye Facebook
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#64748B] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              
              {/* Label Produk */}
              <div>
                <label className="block font-semibold text-[#CBD5E1] mb-1">
                  Nama / Label Produk <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sepatu Sneaker Pria Shopee Diskon 50%"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141A29] border border-[#222B3D] text-white outline-none focus:border-indigo-500"
                />
              </div>

              {/* URL Asli */}
              <div>
                <label className="block font-semibold text-[#CBD5E1] mb-1">
                  URL Tujuan Asli <span className="text-rose-400">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://shopee.co.id/... atau https://wa.me/..."
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141A29] border border-[#222B3D] text-white outline-none focus:border-indigo-500 font-mono text-xs"
                />
              </div>

              {/* Kategori */}
              <div>
                <label className="block font-semibold text-[#CBD5E1] mb-1">
                  Kategori Produk
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141A29] border border-[#222B3D] text-white outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Opsi Pantulan (Cloaker) */}
              <div>
                <label className="block font-semibold text-[#CBD5E1] mb-1.5">
                  Sistem Pantulan URL (Anti-Bot FB)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCloakerMode('base64')}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      cloakerMode === 'base64'
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 font-bold'
                        : 'bg-[#141A29] text-[#94A3B8] border-[#222B3D]'
                    }`}
                  >
                    <div className="text-xs">Base64 Cloaker</div>
                    <div className="text-[10px] text-[#64748B]">Rekomendasi</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCloakerMode('direct')}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      cloakerMode === 'direct'
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 font-bold'
                        : 'bg-[#141A29] text-[#94A3B8] border-[#222B3D]'
                    }`}
                  >
                    <div className="text-xs">Direct (Polos)</div>
                    <div className="text-[10px] text-[#64748B]">Tanpa pantulan</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCloakerMode('worker')}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      cloakerMode === 'worker'
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 font-bold'
                        : 'bg-[#141A29] text-[#94A3B8] border-[#222B3D]'
                    }`}
                  >
                    <div className="text-xs">Worker Custom</div>
                    <div className="text-[10px] text-[#64748B]">Domain sendiri</div>
                  </button>
                </div>
              </div>

              {/* Sub-ID Dinamis */}
              <div className="p-3 rounded-xl bg-[#141A29] border border-[#222B3D] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableSubId}
                    onChange={(e) => setEnableSubId(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-0 bg-[#0E121E] border-[#334155]"
                  />
                  <span className="font-semibold text-white">
                    Tempelkan Sub-ID Dinamis Acak
                  </span>
                </label>
                <p className="text-[11px] text-[#94A3B8] pl-6">
                  Menambahkan parameter acak dinamis agar URL tampak unik setiap kali dikirim ke Facebook.
                </p>
                {enableSubId && (
                  <div className="pl-6 pt-1 flex items-center gap-2">
                    <span className="text-[#64748B]">Prefix:</span>
                    <input
                      type="text"
                      value={subIdPrefix}
                      onChange={(e) => setSubIdPrefix(e.target.value)}
                      placeholder="fb_aff"
                      className="w-32 px-2 py-1 rounded-lg bg-[#0E121E] border border-[#222B3D] text-white font-mono text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="block font-semibold text-[#CBD5E1] mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Link aktif sampai akhir bulan promo 50%"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#141A29] border border-[#222B3D] text-white outline-none focus:border-indigo-500"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-[#1B2333] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#141A29] hover:bg-[#1C2438] text-[#94A3B8] text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
                >
                  Simpan ke Bank Link
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
