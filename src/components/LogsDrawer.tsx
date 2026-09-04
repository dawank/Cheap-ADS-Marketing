import React, { useState } from 'react';
import { ExecutionLog } from '../types';
import { X, Terminal, Trash2, CheckCircle2, AlertTriangle, Info, Clock, Filter, MessageSquare, Send, UserPlus, Globe } from 'lucide-react';

interface LogsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ExecutionLog[];
  onClearLogs: () => void;
}

export const LogsDrawer: React.FC<LogsDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  if (!isOpen) return null;

  const filteredLogs = logs.filter(l => filterType === 'all' ? true : l.type === filterType);

  const getTypeIcon = (type: ExecutionLog['type']) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="w-3.5 h-3.5 text-blue-400" />;
      case 'post':
        return <Send className="w-3.5 h-3.5 text-indigo-400" />;
      case 'join':
        return <UserPlus className="w-3.5 h-3.5 text-emerald-400" />;
      case 'browser':
        return <Globe className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <Terminal className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const getStatusBadge = (status: ExecutionLog['status']) => {
    switch (status) {
      case 'success':
        return <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">SUKSES</span>;
      case 'warning':
        return <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">PERINGATAN</span>;
      case 'error':
        return <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">GAGAL</span>;
      default:
        return <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">INFO</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-[#11141B] border-l border-[#1E293B] h-full flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b border-[#1E293B] bg-[#0D0F15] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Log Aktivitas & Otomatisasi</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#141824] text-[#94A3B8] border border-[#232D42] font-mono">
              {logs.length} entri
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClearLogs}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-rose-400 hover:bg-[#141824] transition"
              title="Bersihkan Log"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#141824] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2 border-b border-[#1E293B] bg-[#0D0F15]/60 flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-[#64748B] text-[11px] shrink-0">Filter:</span>
          {['all', 'comment', 'post', 'join', 'system', 'browser'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize shrink-0 transition ${
                filterType === f
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm ring-1 ring-indigo-400'
                  : 'bg-[#141824] text-[#94A3B8] hover:text-[#E2E8F0] border border-[#232D42]'
              }`}
            >
              {f === 'all' ? 'Semua' : f}
            </button>
          ))}
        </div>

        {/* Logs Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 font-mono text-xs">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-[#0D0F15] border border-[#1E293B] space-y-1.5 shadow-sm"
            >
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  {getTypeIcon(log.type)}
                  <span className="text-[#94A3B8]">[{log.timestamp}]</span>
                  <span className="text-[#E2E8F0] font-semibold truncate max-w-[120px] font-sans">{log.accountName}</span>
                </div>
                {getStatusBadge(log.status)}
              </div>

              <p className="text-[#CBD5E1] font-sans text-xs leading-relaxed">
                {log.message}
              </p>

              {log.target && (
                <div className="text-[10px] text-[#94A3B8] flex items-center justify-between pt-1 border-t border-[#1E293B]">
                  <span className="truncate">Target: {log.target}</span>
                  {log.linkUrl && (
                    <span className="text-indigo-400 truncate max-w-[150px]">➡️ {log.linkUrl}</span>
                  )}
                </div>
              )}
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-[#64748B]">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Belum ada rekaman log untuk filter ini.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
