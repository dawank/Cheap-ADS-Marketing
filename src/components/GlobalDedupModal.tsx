import React, { useState } from 'react';
import { GlobalPostHistory, FBAccount } from '../types';
import { 
  ShieldCheck, 
  X, 
  Trash2, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  Users,
  Layers,
  Database,
  Download
} from 'lucide-react';

interface GlobalDedupModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: GlobalPostHistory[];
  onClearHistory: () => void;
  onRemoveItem: (id: string) => void;
  accounts: FBAccount[];
}

export const GlobalDedupModal: React.FC<GlobalDedupModalProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onRemoveItem,
  accounts
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState('all');

  if (!isOpen) return null;

  const filteredHistory = history.filter(item => {
    const matchesSearch = 
      item.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.postId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.commentSnippet.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAccount = selectedAccountFilter === 'all' || item.accountId === selectedAccountFilter;

    return matchesSearch && matchesAccount;
  });

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `cheapads-dedup-history-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#11141B] border border-[#1E293B] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1E293B] flex items-center justify-between bg-[#0D0F15]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Database Anti-Tabrakan Antar-Akun</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                  Global Conflict Prevention
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Mencegah Akun A dan Akun B mengomentari postingan yang sama di grup mana pun.
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

        {/* Stats Row */}
        <div className="px-6 py-3.5 bg-[#141824] border-b border-[#1E293B] grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 bg-[#0D0F15] p-3 rounded-xl border border-[#1E293B]">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-[#94A3B8]">Total Postingan Terlindungi</p>
              <p className="text-lg font-bold text-white font-mono">{history.length} <span className="text-xs font-normal text-indigo-300">Target Unik</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#0D0F15] p-3 rounded-xl border border-[#1E293B]">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-[#94A3B8]">Status Proteksi</p>
              <p className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Aktif & Real-time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#0D0F15] p-3 rounded-xl border border-[#1E293B]">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-[#94A3B8]">Akun Tersinkronisasi</p>
              <p className="text-sm font-semibold text-white font-mono">{accounts.length} Akun Facebook</p>
            </div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="p-4 border-b border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#64748B]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari ID Postingan, Nama Grup, atau Akun..."
                className="w-full bg-[#0D0F15] border border-[#1E293B] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={selectedAccountFilter}
              onChange={(e) => setSelectedAccountFilter(e.target.value)}
              className="bg-[#0D0F15] border border-[#1E293B] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="all">Semua Akun</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1E293B] hover:bg-[#2A374F] text-xs font-semibold text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor JSON</span>
            </button>
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Database</span>
            </button>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[400px]">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-[#64748B]">
              <ShieldCheck className="w-12 h-12 mx-auto mb-2 opacity-30 text-emerald-400" />
              <p className="text-sm font-medium text-[#94A3B8]">Belum ada data riwayat postingan</p>
              <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                Ketika akun Anda berkomentar atau posting di Facebook, riwayat postingan akan tercatat di sini secara otomatis.
              </p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div 
                key={item.id}
                className="bg-[#0D0F15] p-3.5 rounded-xl border border-[#1E293B] hover:border-[#2E3C56] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-white">{item.groupName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                      {item.postId}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {item.actionType === 'reply_top' ? 'Balas Komen Teratas' : 'Komentar Utama'}
                    </span>
                  </div>

                  <p className="text-xs text-[#94A3B8] italic line-clamp-1">
                    "{item.commentSnippet}"
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-[#64748B] pt-0.5 flex-wrap">
                    <span className="text-indigo-300 font-medium">Oleh: {item.accountName}</span>
                    <span>•</span>
                    <span>{item.timestamp}</span>
                    <span>•</span>
                    <span className="text-emerald-400 truncate max-w-[200px]">{item.linkUsed}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <a
                    href={item.postUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-[#141824] hover:bg-[#1E293B] text-[#94A3B8] hover:text-white transition-colors"
                    title="Buka Postingan FB"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                    title="Hapus Dari Database Proteksi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E293B] bg-[#0D0F15] flex items-center justify-between text-xs text-[#94A3B8]">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Anti-Duplicate Lock aktif: 100% aman dari dobel komentar.</span>
          </div>
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
