import React, { useState, useRef } from 'react';
import { ScheduledPost, FBAccount, FBGroup, TargetType, MediaType, RepeatInterval, LocalMediaItem } from '../types';
import { 
  Send, 
  Calendar, 
  Clock, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Link as LinkIcon, 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  User, 
  Users, 
  Layout, 
  Sparkles, 
  Eye, 
  RotateCw,
  FileText,
  HelpCircle,
  Copy,
  Upload,
  ShieldCheck,
  FileVideo,
  Film,
  Sliders,
  HardDrive,
  CheckCircle
} from 'lucide-react';
import { parseSpintax } from '../utils/spintax';

interface AutoPostTabProps {
  scheduledPosts: ScheduledPost[];
  accounts: FBAccount[];
  activeAccount: FBAccount | undefined;
  groups: FBGroup[];
  preSelectedGroupIds?: string[];
  onCreateScheduledPost: (post: Omit<ScheduledPost, 'id' | 'createdAt' | 'successCount' | 'failureCount' | 'logs'>) => void;
  onDeletePost: (id: string) => void;
  onTogglePausePost: (id: string) => void;
  onRunNowPost: (id: string) => void;
  onOpenSpintaxHelper: () => void;
}

export const AutoPostTab: React.FC<AutoPostTabProps> = ({
  scheduledPosts,
  accounts,
  activeAccount,
  groups,
  preSelectedGroupIds = [],
  onCreateScheduledPost,
  onDeletePost,
  onTogglePausePost,
  onRunNowPost,
  onOpenSpintaxHelper
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'queue'>('create');
  
  // Post Form State
  const [selectedAccountId, setSelectedAccountId] = useState<string>(activeAccount?.id || accounts[0]?.id || '');
  const [targetType, setTargetType] = useState<TargetType>('group');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(preSelectedGroupIds);
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [postTitle, setPostTitle] = useState('');
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [mediaUrls, setMediaUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1556742049-0a67e55722c0?w=600&auto=format&fit=crop&q=80'
  ]);
  
  // Local File Uploads (Foto & Video dari Penyimpanan Komputer)
  const [localMediaFiles, setLocalMediaFiles] = useState<LocalMediaItem[]>([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Anti-Banned & Human Emulation Engine Settings
  const [keystrokeEmulation, setKeystrokeEmulation] = useState(true);
  const [prePostDelaySec, setPrePostDelaySec] = useState(8);
  const [interGroupDelayMin, setInterGroupDelayMin] = useState(60);
  const [interGroupDelayMax, setInterGroupDelayMax] = useState(180);
  const [batchRestCount, setBatchRestCount] = useState(5);
  const [batchRestMinutes, setBatchRestMinutes] = useState(15);
  const [workingHoursOnly, setWorkingHoursOnly] = useState(true);

  const [scheduledDateTime, setScheduledDateTime] = useState<string>(() => {
    const now = new Date(Date.now() + 1000 * 60 * 30); // 30 min from now
    return now.toISOString().slice(0, 16);
  });
  const [repeatInterval, setRepeatInterval] = useState<RepeatInterval>('none');
  const [previewOutput, setPreviewOutput] = useState<string>('');
  const [groupSearchQuery, setGroupSearchQuery] = useState('');

  const currentAccount = accounts.find(a => a.id === selectedAccountId) || activeAccount;
  const currentAccountGroups = groups.filter(g => g.accountId === (currentAccount?.id || ''));

  const filteredAccountGroups = currentAccountGroups.filter(g => 
    g.name.toLowerCase().includes(groupSearchQuery.toLowerCase()) ||
    g.category.toLowerCase().includes(groupSearchQuery.toLowerCase())
  );

  // Spintax test live
  const handleTestSpintax = () => {
    setPreviewOutput(parseSpintax(content));
  };

  const handleToggleGroup = (gId: string) => {
    setSelectedGroupIds(prev => 
      prev.includes(gId) ? prev.filter(id => id !== gId) : [...prev, gId]
    );
  };

  const handleSelectAllGroups = () => {
    if (selectedGroupIds.length === filteredAccountGroups.length) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(filteredAccountGroups.map(g => g.id));
    }
  };

  const handleAddSampleImage = () => {
    const sampleImages = [
      'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'
    ];
    const randomImg = sampleImages[Math.floor(Math.random() * sampleImages.length)];
    setMediaUrls(prev => [...prev, randomImg]);
  };

  const handleRemoveMedia = (index: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Upload File Lokal (Gambar / Video)
  const handleLocalFilesUpload = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    fileArray.forEach(file => {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|avi|mkv)$/i.test(file.name);
      const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);

      if (!isImage && !isVideo) {
        alert(`File "${file.name}" bukan format gambar atau video yang didukung.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const newItem: LocalMediaItem = {
          id: `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size,
          type: isVideo ? 'video' : 'image',
          mimeType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
          dataUrl: dataUrl,
          filePath: (file as any).path || file.name
        };
        
        // Auto set media type according to uploaded file
        setMediaType(isVideo ? 'video' : 'image');
        setLocalMediaFiles(prev => [...prev, newItem]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveLocalMedia = (id: string) => {
    setLocalMediaFiles(prev => prev.filter(m => m.id !== id));
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSubmitPost = (e: React.FormEvent, isInstant = false) => {
    e.preventDefault();
    if (!content.trim()) return;

    let targetIds: string[] = [];
    let targetNames: string[] = [];

    if (targetType === 'group') {
      targetIds = selectedGroupIds;
      targetNames = groups.filter(g => selectedGroupIds.includes(g.id)).map(g => g.name);
      if (targetIds.length === 0) {
        alert('Pilih minimal 1 grup sasaran!');
        return;
      }
    } else if (targetType === 'page') {
      const page = currentAccount?.pages.find(p => p.id === selectedPageId) || currentAccount?.pages[0];
      if (page) {
        targetIds = [page.id];
        targetNames = [page.name];
      }
    } else {
      targetIds = ['timeline'];
      targetNames = ['Beranda / Feed Akun'];
    }

    const postData = {
      title: postTitle.trim() || `Auto Post ${targetType.toUpperCase()} - ${new Date().toLocaleDateString('id-ID')}`,
      accountId: selectedAccountId,
      targetType,
      targetIds,
      targetNames,
      content,
      linkUrl: linkUrl.trim() || undefined,
      mediaType,
      mediaUrls: mediaType === 'none' ? [] : mediaUrls,
      localMedia: localMediaFiles.length > 0 ? localMediaFiles : undefined,
      
      // Anti-Banned & Human Emulation Settings
      keystrokeEmulation,
      prePostDelaySec,
      interGroupDelayMin,
      interGroupDelayMax,
      batchRestCount,
      batchRestMinutes,
      workingHoursOnly,

      scheduledAt: isInstant ? new Date().toISOString() : new Date(scheduledDateTime).toISOString(),
      repeatInterval,
      status: isInstant ? ('running' as const) : ('scheduled' as const)
    };

    onCreateScheduledPost(postData);

    // Reset form or switch tab
    setActiveSubTab('queue');
    setContent('');
    setPostTitle('');
    setLinkUrl('');
    setLocalMediaFiles([]);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Navigation & Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#11141B] p-5 rounded-2xl border border-[#1E293B] shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Auto Post & Penjadwalan Terpadu</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
              Multi-Tujuan & Media
            </span>
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Jadwalkan postingan otomatis ke Halaman Facebook, Beranda Sendiri, atau Puluhan Grup yang diikuti dengan foto & video.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#0D0F15] p-1.5 rounded-xl border border-[#1E293B]">
          <button
            onClick={() => setActiveSubTab('create')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              activeSubTab === 'create'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm ring-1 ring-indigo-400'
                : 'text-[#94A3B8] hover:text-[#E2E8F0]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Post Baru</span>
          </button>
          <button
            onClick={() => setActiveSubTab('queue')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              activeSubTab === 'queue'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm ring-1 ring-indigo-400'
                : 'text-[#94A3B8] hover:text-[#E2E8F0]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Antrean Jadwal ({scheduledPosts.length})</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Form Composer (Left 2 Cols) */}
          <div className="lg:col-span-2 space-y-5">
            <form onSubmit={(e) => handleSubmitPost(e, false)} className="space-y-5">
              
              {/* Target Selector Card */}
              <div className="p-5 rounded-2xl bg-[#11141B] border border-[#1E293B] shadow-xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Layout className="w-3.5 h-3.5" /> 1. Tentukan Akun & Sasaran Posting
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#CBD5E1] mb-1">
                      Pilih Akun Facebook
                    </label>
                    <select
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#0D0F15] border border-[#1E293B] rounded-xl text-[#CBD5E1] focus:border-indigo-500 focus:outline-none"
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} (Post hari ini: {acc.dailyPostCount}/{acc.maxDailyPosts})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#CBD5E1] mb-1">
                      Tujuan Penayangan Post
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTargetType('group')}
                        className={`p-2 rounded-xl text-[11px] font-semibold border flex flex-col items-center justify-center gap-1 transition ${
                          targetType === 'group'
                            ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 shadow-sm'
                            : 'bg-[#0D0F15] text-[#94A3B8] border-[#1E293B] hover:bg-[#141824]'
                        }`}
                      >
                        <Users className="w-4 h-4 text-indigo-400" />
                        <span>Grup FB</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTargetType('page')}
                        className={`p-2 rounded-xl text-[11px] font-semibold border flex flex-col items-center justify-center gap-1 transition ${
                          targetType === 'page'
                            ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500 shadow-sm'
                            : 'bg-[#0D0F15] text-[#94A3B8] border-[#1E293B] hover:bg-[#141824]'
                        }`}
                      >
                        <Layout className="w-4 h-4 text-indigo-400" />
                        <span>Halaman Fans</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTargetType('timeline')}
                        className={`p-2 rounded-xl text-[11px] font-semibold border flex flex-col items-center justify-center gap-1 transition ${
                          targetType === 'timeline'
                            ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500 shadow-sm'
                            : 'bg-[#0D0F15] text-[#94A3B8] border-[#1E293B] hover:bg-[#141824]'
                        }`}
                      >
                        <User className="w-4 h-4 text-cyan-400" />
                        <span>Beranda Sendiri</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-Selector for Groups or Pages */}
                {targetType === 'group' && (
                  <div className="pt-3 border-t border-[#1E293B] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-[#CBD5E1] flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Pilih Grup Sasaran ({selectedGroupIds.length} terpilih)</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleSelectAllGroups}
                        className="text-[11px] text-indigo-400 hover:underline font-semibold"
                      >
                        {selectedGroupIds.length === filteredAccountGroups.length ? 'Batal Pilih Semua' : 'Pilih Semua Grup'}
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Cari dari grup yang sudah diikuti..."
                      value={groupSearchQuery}
                      onChange={(e) => setGroupSearchQuery(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-[#0D0F15] border border-[#1E293B] rounded-lg text-[#E2E8F0] placeholder-[#64748B] focus:outline-none focus:border-indigo-500"
                    />

                    <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-[#0D0F15] rounded-xl border border-[#1E293B]">
                      {filteredAccountGroups.map((g) => {
                        const isChecked = selectedGroupIds.includes(g.id);
                        return (
                          <label
                            key={g.id}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition ${
                              isChecked ? 'bg-indigo-950/40 border border-indigo-800/60 text-white' : 'hover:bg-[#141824] text-[#CBD5E1]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleGroup(g.id)}
                                className="w-3.5 h-3.5 rounded text-indigo-600 bg-[#0D0F15] border-[#232D42] focus:ring-indigo-500"
                              />
                              <span className="truncate font-medium">{g.name}</span>
                            </div>
                            <span className="text-[10px] text-[#94A3B8] shrink-0 ml-2 font-mono">
                              {(g.memberCount / 1000).toFixed(0)}k member
                            </span>
                          </label>
                        );
                      })}
                      {filteredAccountGroups.length === 0 && (
                        <p className="text-xs text-[#64748B] p-2 text-center">Tidak ada grup pada akun ini.</p>
                      )}
                    </div>
                  </div>
                )}

                {targetType === 'page' && (
                  <div className="pt-3 border-t border-[#1E293B]">
                    <label className="block text-[11px] font-semibold text-[#CBD5E1] mb-1">
                      Pilih Halaman Facebook yang Anda Kelola
                    </label>
                    <select
                      value={selectedPageId}
                      onChange={(e) => setSelectedPageId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#0D0F15] border border-[#1E293B] rounded-xl text-[#CBD5E1] focus:border-indigo-500 focus:outline-none"
                    >
                      {currentAccount?.pages.map(page => (
                        <option key={page.id} value={page.id}>
                          {page.name} ({page.category} - {page.likes.toLocaleString()} Pengikut)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Content & Media Card */}
              <div className="p-5 rounded-2xl bg-[#11141B] border border-[#1E293B] shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> 2. Konten Postingan & Media
                  </h3>
                  <button
                    type="button"
                    onClick={onOpenSpintaxHelper}
                    className="text-[11px] font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 bg-cyan-950/40 px-2 py-1 rounded-lg border border-cyan-800/60 transition"
                  >
                    <Sparkles className="w-3 h-3" /> Panduan Spintax
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#CBD5E1] mb-1">
                    Judul / Label Postingan Internal
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Flash Sale Jam Tangan Pria Hari Ini"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#0D0F15] border border-[#1E293B] rounded-xl text-[#E2E8F0] placeholder-[#64748B] focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-[#CBD5E1]">
                      Teks Postingan <span className="text-[#94A3B8] font-normal">(Mendukung variasi {'{opsi1|opsi2}'})</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleTestSpintax}
                      className="text-[10px] text-indigo-400 hover:underline font-semibold"
                    >
                      Uji Acak Spintax
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    required
                    placeholder="{Halo kawan|Permisi agan|Hai semuanya}! 🔥&#10;&#10;{Lagi ada diskon spesial|Promo hemat hadir lagi}: Belanja hemat bebas ongkir se-Indonesia.&#10;&#10;Cek langsung katalognya di sini:&#10;https://shopee.co.id/toko-promo"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#0D0F15] border border-[#1E293B] rounded-xl text-[#E2E8F0] placeholder-[#64748B] focus:border-indigo-500 focus:outline-none resize-none font-sans"
                  />
                </div>

                {/* Link URL Attachment */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#CBD5E1] mb-1 flex items-center gap-1">
                    <LinkIcon className="w-3 h-3 text-indigo-400" />
                    <span>Link Tautan Promosi (Website / Marketplace / Biolink)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://tokopedia.com/promo-spesial"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#0D0F15] border border-[#1E293B] rounded-xl text-[#E2E8F0] placeholder-[#64748B] focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Media Type & Local File Attachments */}
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="block text-[11px] font-semibold text-[#CBD5E1]">
                      Lampiran Media Postingan
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <HardDrive className="w-3 h-3" /> Mendukung Video & Foto Lokal
                    </span>
                  </div>

                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setMediaType('image')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition ${
                        mediaType === 'image' ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-indigo-400' : 'bg-[#0D0F15] text-[#94A3B8] border-[#1E293B]'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> Gambar / Foto
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaType('video')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition ${
                        mediaType === 'video' ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-indigo-400' : 'bg-[#0D0F15] text-[#94A3B8] border-[#1E293B]'
                      }`}
                    >
                      <VideoIcon className="w-3.5 h-3.5" /> Video Promosi
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaType('none')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition ${
                        mediaType === 'none' ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-indigo-400' : 'bg-[#0D0F15] text-[#94A3B8] border-[#1E293B]'
                      }`}
                    >
                      Teks Saja
                    </button>
                  </div>

                  {mediaType !== 'none' && (
                    <div className="space-y-3">
                      {/* Local File Dropzone */}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleLocalFilesUpload(e.target.files);
                          }
                        }}
                        multiple 
                        accept={mediaType === 'video' ? 'video/mp4,video/quicktime,video/webm' : 'image/png,image/jpeg,image/webp,image/gif'}
                        className="hidden" 
                      />

                      <div 
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                        onDragLeave={() => setIsDraggingFile(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingFile(false);
                          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            handleLocalFilesUpload(e.dataTransfer.files);
                          }
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-4 rounded-xl border-2 border-dashed transition cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
                          isDraggingFile 
                            ? 'border-indigo-500 bg-indigo-950/30' 
                            : 'border-[#2A3449] hover:border-indigo-500/70 bg-[#0D0F15] hover:bg-[#121622]'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#CBD5E1]">
                            Klik untuk Pilih File dari Komputer atau Tarik ke Sini
                          </p>
                          <p className="text-[10px] text-[#64748B] mt-0.5">
                            {mediaType === 'video' 
                              ? 'Mendukung format video: MP4, MOV, WEBM (Unggah berkas asli dari penyimpanan lokal)' 
                              : 'Mendukung format gambar: JPG, PNG, WEBP, GIF (Bisa pilih banyak foto sekaligus)'}
                          </p>
                        </div>
                      </div>

                      {/* Display Local Media Attachments */}
                      {localMediaFiles.length > 0 && (
                        <div className="p-3 bg-[#0D0F15] rounded-xl border border-[#1E293B] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Berkas Lokal Siap Diunggah ({localMediaFiles.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => setLocalMediaFiles([])}
                              className="text-[10px] text-rose-400 hover:underline font-semibold"
                            >
                              Hapus Semua Berkas Lokal
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {localMediaFiles.map((item) => (
                              <div key={item.id} className="p-2 bg-[#141824] rounded-lg border border-[#232D42] flex items-center gap-2.5 relative group">
                                {item.type === 'video' ? (
                                  <div className="w-12 h-12 rounded bg-black flex items-center justify-center text-indigo-400 shrink-0 border border-indigo-500/30">
                                    <Film className="w-5 h-5" />
                                  </div>
                                ) : (
                                  <img src={item.dataUrl} alt={item.name} className="w-12 h-12 rounded object-cover border border-[#232D42] shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs text-white font-medium truncate">{item.name}</p>
                                  <p className="text-[10px] text-[#94A3B8] font-mono">
                                    {formatBytes(item.size)} • {item.type === 'video' ? 'Video Lokal' : 'Foto Lokal'}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLocalMedia(item.id)}
                                  className="p-1 rounded bg-black/60 text-rose-400 hover:bg-rose-600 hover:text-white transition shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Video Player Preview if local video uploaded */}
                      {localMediaFiles.some(m => m.type === 'video') && (
                        <div className="p-3 bg-[#0D0F15] rounded-xl border border-[#1E293B] space-y-2">
                          <span className="text-[11px] text-[#94A3B8] block font-semibold">Pratinjau Video Lokal Terpilih:</span>
                          <div className="rounded-xl overflow-hidden border border-[#232D42] aspect-video bg-black flex items-center justify-center">
                            <video
                              controls
                              src={localMediaFiles.find(m => m.type === 'video')?.dataUrl}
                              className="w-full h-full max-h-48 object-contain"
                            />
                          </div>
                        </div>
                      )}

                      {/* Fallback / Sample Image URLs (Optional) */}
                      {mediaType === 'image' && localMediaFiles.length === 0 && (
                        <div className="p-3 bg-[#0D0F15] rounded-xl border border-[#1E293B] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-[#94A3B8]">Atau Gambar dari Web URL ({mediaUrls.length})</span>
                            <button
                              type="button"
                              onClick={handleAddSampleImage}
                              className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Tambah Contoh Gambar
                            </button>
                          </div>

                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {mediaUrls.map((url, idx) => (
                              <div key={idx} className="relative group rounded-lg overflow-hidden border border-[#232D42] aspect-video bg-[#141824]">
                                <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMedia(idx)}
                                  className="absolute top-1 right-1 p-1 rounded bg-black/70 text-rose-400 hover:bg-rose-600 hover:text-white transition"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* 3. Anti-Banned & Human Emulation Protection Center */}
              <div className="p-5 rounded-2xl bg-[#11141B] border border-emerald-900/40 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> 3. Proteksi Anti-Banned & Human Emulation
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Perilaku Manusia 100% Alami
                  </span>
                </div>

                <p className="text-xs text-[#94A3B8]">
                  Sistem mengeksekusi postingan dengan meniru kebiasaan nyata manusia: mengetik perlahan, jeda acak antar grup, istirahat otomatis berkala, dan pembatasan jam aktif agar akun awet serta terhindar dari checkpoint Facebook.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  {/* Keystroke Typing Emulation */}
                  <div className="p-3 bg-[#0D0F15] rounded-xl border border-[#1E293B] space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={keystrokeEmulation} 
                          onChange={(e) => setKeystrokeEmulation(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 bg-[#0D0F15] border-[#232D42] focus:ring-emerald-500" 
                        />
                        <span>Ketik Karakter Alami (Human Keystroke)</span>
                      </label>
                      <span className="text-[10px] text-emerald-400 font-mono">60-150ms / huruf</span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      Mengetik satu per satu karakter dengan ritme acak layaknya keyboard manusia, bukan paste instan yang langsung dicurigai bot Facebook.
                    </p>
                  </div>

                  {/* Working Hours Only */}
                  <div className="p-3 bg-[#0D0F15] rounded-xl border border-[#1E293B] space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={workingHoursOnly} 
                          onChange={(e) => setWorkingHoursOnly(e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 bg-[#0D0F15] border-[#232D42] focus:ring-emerald-500" 
                        />
                        <span>Batasi Jam Aktif Alami (08:00 - 22:00)</span>
                      </label>
                      <span className="text-[10px] text-amber-400 font-mono">Anti-Nokturnal</span>
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      Mencegah postingan di jam dini hari (misal jam 02.00 - 05.00) yang biasanya menjadi pemicu deteksi bot otomatis Facebook.
                    </p>
                  </div>

                  {/* Pre-Post Reading Delay */}
                  <div className="p-3 bg-[#0D0F15] rounded-xl border border-[#1E293B] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#CBD5E1]">
                        Jeda Membaca Sebelum Posting
                      </label>
                      <span className="text-xs font-mono text-emerald-400 font-bold">{prePostDelaySec} Detik</span>
                    </div>
                    <input 
                      type="range" 
                      min={3} 
                      max={25} 
                      value={prePostDelaySec} 
                      onChange={(e) => setPrePostDelaySec(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer" 
                    />
                    <p className="text-[10px] text-[#64748B]">
                      Simulasi mata manusia membaca halaman grup dan meninjau postingan sebelum menekan tombol Kirim.
                    </p>
                  </div>

                  {/* Inter-group delay range */}
                  <div className="p-3 bg-[#0D0F15] rounded-xl border border-[#1E293B] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#CBD5E1]">
                        Jeda Acak Antar Grup Sasaran
                      </label>
                      <span className="text-xs font-mono text-emerald-400 font-bold">{interGroupDelayMin} - {interGroupDelayMax} Detik</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="number" 
                        min={20} 
                        max={300} 
                        value={interGroupDelayMin} 
                        onChange={(e) => setInterGroupDelayMin(Number(e.target.value))}
                        className="px-2 py-1 text-xs bg-[#141824] border border-[#232D42] rounded text-white" 
                        placeholder="Min (detik)" 
                      />
                      <input 
                        type="number" 
                        min={30} 
                        max={600} 
                        value={interGroupDelayMax} 
                        onChange={(e) => setInterGroupDelayMax(Number(e.target.value))}
                        className="px-2 py-1 text-xs bg-[#141824] border border-[#232D42] rounded text-white" 
                        placeholder="Max (detik)" 
                      />
                    </div>
                    <p className="text-[10px] text-[#64748B]">
                      Jeda bervariasi secara dinamis agar ritme postingan tidak berbentuk pola matematis yang kaku.
                    </p>
                  </div>

                  {/* Batch Cooldown Rest Pattern */}
                  <div className="md:col-span-2 p-3 bg-[#0D0F15] rounded-xl border border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <span>Pola Istirahat Akun (Batch Rest Cooldown)</span>
                      </p>
                      <p className="text-[11px] text-[#64748B]">
                        Akun akan berhenti dan mendinginkan diri selama periode tertentu setelah memposting beberapa grup.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-[#CBD5E1]">Istirahat setiap</span>
                      <input 
                        type="number" 
                        min={2} 
                        max={20} 
                        value={batchRestCount} 
                        onChange={(e) => setBatchRestCount(Number(e.target.value))}
                        className="w-14 px-2 py-1 text-xs bg-[#141824] border border-[#232D42] rounded text-white text-center font-bold" 
                      />
                      <span className="text-xs text-[#CBD5E1]">grup, selama</span>
                      <input 
                        type="number" 
                        min={5} 
                        max={60} 
                        value={batchRestMinutes} 
                        onChange={(e) => setBatchRestMinutes(Number(e.target.value))}
                        className="w-14 px-2 py-1 text-xs bg-[#141824] border border-[#232D42] rounded text-white text-center font-bold" 
                      />
                      <span className="text-xs text-[#CBD5E1]">menit</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule & Repeat Settings */}
              <div className="p-5 rounded-2xl bg-[#11141B] border border-[#1E293B] shadow-xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> 4. Penjadwalan & Pengulangan
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#CBD5E1] mb-1">
                      Waktu Peluncuran (Tanggal & Jam)
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledDateTime}
                      onChange={(e) => setScheduledDateTime(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#0D0F15] border border-[#1E293B] rounded-xl text-[#CBD5E1] focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#CBD5E1] mb-1">
                      Interval Pengulangan Otomatis
                    </label>
                    <select
                      value={repeatInterval}
                      onChange={(e) => setRepeatInterval(e.target.value as RepeatInterval)}
                      className="w-full px-3 py-2 text-xs bg-[#0D0F15] border border-[#1E293B] rounded-xl text-[#CBD5E1] focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="none">Sekali Saja (Tanpa Pengulangan)</option>
                      <option value="hourly">Setiap Jam (Auto Rotate Spintax)</option>
                      <option value="daily">Setiap Hari (Pada Jam yang Sama)</option>
                      <option value="weekly">Setiap Minggu</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1E293B] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={(e) => handleSubmitPost(e, true)}
                    className="px-4 py-2 text-xs font-semibold text-[#CBD5E1] bg-[#141824] hover:bg-[#1C2336] border border-[#232D42] rounded-xl transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5 text-amber-400" />
                    <span>Kirim Sekarang (Instant)</span>
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400 transition flex items-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Jadwalkan Postingan</span>
                  </button>
                </div>
              </div>

            </form>
          </div>

          {/* Realtime Live Preview (Right 1 Col) */}
          <div className="space-y-4">
            <div className="p-4 bg-[#11141B] border border-[#1E293B] rounded-2xl sticky top-20 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Preview Tampilan Facebook</span>
                </span>
                <span className="text-[10px] text-[#94A3B8] font-mono">Simulasi Post</span>
              </div>

              {/* FB Feed Card Simulation */}
              <div className="p-3.5 bg-[#0D0F15] rounded-xl border border-[#1E293B] space-y-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={currentAccount?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt="Author"
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-[#232D42]"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">
                      {targetType === 'page' ? (currentAccount?.pages[0]?.name || currentAccount?.name) : currentAccount?.name}
                    </h4>
                    <p className="text-[10px] text-[#94A3B8] flex items-center gap-1">
                      <span>Baru saja</span> • <Globe className="w-2.5 h-2.5" />
                    </p>
                  </div>
                </div>

                {/* Simulated Content */}
                <div className="text-xs text-[#CBD5E1] whitespace-pre-wrap leading-relaxed">
                  {previewOutput || parseSpintax(content) || 'Ketik teks postingan di sebelah kiri untuk melihat simulasi hasil spintax di sini.'}
                </div>

                {/* Media Preview inside card */}
                {mediaType === 'image' && mediaUrls.length > 0 && (
                  <div className="rounded-lg overflow-hidden border border-[#232D42] aspect-video bg-[#141824]">
                    <img src={mediaUrls[0]} alt="Post visual" className="w-full h-full object-cover" />
                  </div>
                )}

                {mediaType === 'video' && (
                  <div className="rounded-lg overflow-hidden border border-[#232D42] aspect-video bg-black flex items-center justify-center text-xs text-[#64748B]">
                    <VideoIcon className="w-8 h-8 text-[#64748B]" />
                  </div>
                )}

                {/* Link Preview box */}
                {linkUrl && (
                  <div className="p-2.5 bg-[#141824] rounded-lg border border-[#232D42] space-y-1">
                    <span className="text-[10px] font-mono text-indigo-400 truncate block">{linkUrl}</span>
                    <p className="text-[11px] font-bold text-white line-clamp-1">Promo & Penawaran Spesial Terbaru</p>
                    <p className="text-[10px] text-[#94A3B8] line-clamp-1">Klik untuk membuka tautan resmi</p>
                  </div>
                )}
              </div>

              <div className="p-3 bg-indigo-950/30 border border-indigo-900/40 rounded-xl text-[11px] text-indigo-300">
                💡 <b>Tips Anti-Spam:</b> Gunakan spintax pada setiap kalimat agar postingan ke multi-grup tidak dianggap duplikat oleh algoritma FB.
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* Queue of Scheduled Posts */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scheduledPosts.map((post) => {
              const account = accounts.find(a => a.id === post.accountId);

              return (
                <div
                  key={post.id}
                  className="p-5 rounded-2xl bg-[#11141B] border border-[#1E293B] shadow-xl flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                          {post.targetType === 'group' ? `Grup (${post.targetIds.length} grup)` : post.targetType === 'page' ? 'Halaman Fans' : 'Beranda Sendiri'}
                        </span>
                        <h3 className="text-sm font-bold text-white mt-1.5">{post.title}</h3>
                        <p className="text-[11px] text-[#94A3B8]">Akun: <b className="text-[#CBD5E1]">{account?.name || 'FB Account'}</b></p>
                      </div>

                      {/* Status */}
                      <div>
                        {post.status === 'scheduled' ? (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Terjadwal
                          </span>
                        ) : post.status === 'running' ? (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <RotateCw className="w-3 h-3 animate-spin" /> Sedang Mengirim
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
                            {post.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content Snippet */}
                    <p className="mt-3 text-xs text-[#CBD5E1] line-clamp-3 bg-[#0D0F15] p-3 rounded-xl border border-[#1E293B] font-mono">
                      {post.content}
                    </p>

                    {/* Media and Anti-Ban Badges */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {post.localMedia && post.localMedia.length > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          {post.localMedia.length} Media Lokal ({post.localMedia.filter(m => m.type === 'video').length > 0 ? 'Ada Video' : 'Foto'})
                        </span>
                      )}
                      {post.keystrokeEmulation && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Ketik Alami ({post.prePostDelaySec || 8}s jeda)
                        </span>
                      )}
                      {post.batchRestCount && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                          Rest tiap {post.batchRestCount} grup ({post.batchRestMinutes || 15}m)
                        </span>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-[#0D0F15] border border-[#1E293B] text-[#CBD5E1]">
                        <span className="text-[#94A3B8]">Jadwal:</span>
                        <p className="font-semibold text-white">{new Date(post.scheduledAt).toLocaleString('id-ID')}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-[#0D0F15] border border-[#1E293B] text-[#CBD5E1]">
                        <span className="text-[#94A3B8]">Pengulangan:</span>
                        <p className="font-semibold text-white capitalize">{post.repeatInterval === 'none' ? 'Sekali Saja' : post.repeatInterval}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-[#1E293B] flex items-center justify-between gap-2">
                    <button
                      onClick={() => onRunNowPost(post.id)}
                      className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition flex items-center justify-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5" /> Jalankan Sekarang
                    </button>

                    <button
                      onClick={() => onTogglePausePost(post.id)}
                      className="p-1.5 rounded-lg bg-[#141824] hover:bg-[#1C2336] text-[#CBD5E1] border border-[#232D42] transition"
                      title={post.status === 'paused' ? 'Lanjutkan' : 'Jeda'}
                    >
                      {post.status === 'paused' ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
                    </button>

                    <button
                      onClick={() => onDeletePost(post.id)}
                      className="p-1.5 rounded-lg bg-[#141824] hover:bg-rose-950/80 text-[#94A3B8] hover:text-rose-400 border border-[#232D42] transition"
                      title="Hapus Jadwal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          {scheduledPosts.length === 0 && (
            <div className="text-center py-12 bg-[#11141B] rounded-2xl border border-[#1E293B]">
              <Clock className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
              <p className="text-sm text-[#CBD5E1] font-semibold">Belum ada postingan yang dijadwalkan.</p>
              <button
                onClick={() => setActiveSubTab('create')}
                className="mt-3 px-4 py-2 text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition"
              >
                + Buat Jadwal Postingan Baru
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
