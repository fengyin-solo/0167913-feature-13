import React, { useMemo, useState } from 'react';
import {
  Share2,
  X,
  Link,
  Copy,
  Check,
  Trash2,
  Lock,
  Eye,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import {
  buildShareUrl,
  createShareEntry,
  listShareEntries,
  revokeShareEntry,
} from '@/utils/share';
import type { ShareEntry } from '@/types';

interface ShareManageModalProps {
  onClose: () => void;
}

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

export const ShareManageModal: React.FC<ShareManageModalProps> = ({ onClose }) => {
  const sessionRecords = useAppStore(state => state.sessionRecords);
  const addToast = useAppStore(state => state.addToast);

  // 入口列表由本弹窗本地维护（独立存储 key），生成/撤销后刷新
  const [entries, setEntries] = useState<ShareEntry[]>(() => listShareEntries());
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const now = Date.now();
  const isExpired = (entry: ShareEntry) => new Date(entry.expiresAt).getTime() <= now;

  const latestToken = useMemo(
    () => (createdToken ? entries.find(e => e.token === createdToken)?.token ?? null : null),
    [createdToken, entries]
  );

  const handleCreate = () => {
    const entry = createShareEntry(sessionRecords.length);
    setEntries(listShareEntries());
    setCreatedToken(entry.token);
    addToast('success', '只读分享入口已生成');
  };

  const handleCopy = async (token: string) => {
    const url = buildShareUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      addToast('success', '只读链接已复制到剪贴板');
      setTimeout(() => setCopiedToken(prev => (prev === token ? null : prev)), 2000);
    } catch {
      addToast('error', '复制失败，请手动选择链接复制');
    }
  };

  const handleRevoke = (token: string) => {
    revokeShareEntry(token);
    setEntries(listShareEntries());
    if (createdToken === token) setCreatedToken(null);
    if (copiedToken === token) setCopiedToken(null);
    addToast('success', '只读入口已撤销，旧链接立即失效');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* 弹窗主体 */}
      <div className="relative w-full max-w-lg glass-panel rounded-2xl flex flex-col overflow-hidden animate-fade-in max-h-[85vh]">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-yellow/15 rounded-lg">
              <Share2 className="w-6 h-6 text-accent-yellow" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-dark-100">只读分享</h2>
              <p className="text-sm text-dark-500">生成只能查看、不可改动的历史记录入口</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-dark-400 hover:text-dark-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* 只读能力说明 */}
          <div className="rounded-xl bg-dark-800/50 border border-white/10 p-4 space-y-2.5 text-sm">
            <p className="flex items-start gap-2 text-dark-300">
              <Eye className="w-4 h-4 mt-0.5 text-primary-400 flex-shrink-0" />
              打开链接仅可查看<strong className="text-dark-100">原文、译文与时间</strong>，
              不能修改、删除或继续追加。
            </p>
            <p className="flex items-start gap-2 text-dark-300">
              <Lock className="w-4 h-4 mt-0.5 text-accent-yellow flex-shrink-0" />
              只读页会明确标识「只读模式」；若当前没有记录或记录事后被清空，页面会说明情况。
            </p>
            <p className="flex items-start gap-2 text-dark-300">
              <ShieldAlert className="w-4 h-4 mt-0.5 text-accent-red flex-shrink-0" />
              入口可随时撤销，撤销或过期后旧链接立即失效，且不会退化成可写界面。
            </p>
          </div>

          {/* 当前数据情况 + 生成按钮 */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="text-sm text-dark-400">
              当前共有
              <span className="mx-1 font-semibold text-dark-100">{sessionRecords.length}</span>
              条历史记录
            </div>
            <Button
              variant="primary"
              onClick={handleCreate}
              icon={<Share2 className="w-4 h-4" />}
            >
              生成只读分享入口
            </Button>
          </div>

          {/* 最新生成的链接 */}
          {latestToken && (() => {
            const entry = entries.find(e => e.token === latestToken);
            if (!entry || isExpired(entry)) return null;
            return (
              <div className="rounded-xl bg-primary-500/10 border border-primary-500/30 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-primary-400">
                  <Link className="w-4 h-4" />
                  只读链接（有效期至 {formatDateTime(entry.expiresAt)}）
                </div>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={buildShareUrl(entry.token)}
                    onFocus={e => e.currentTarget.select()}
                    className="flex-1 min-w-0 px-3 py-2 text-xs font-mono bg-dark-900/70 border border-white/10 rounded-lg text-dark-200"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCopy(entry.token)}
                    icon={
                      copiedToken === entry.token ? (
                        <Check className="w-4 h-4 text-accent-green" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )
                    }
                  >
                    {copiedToken === entry.token ? '已复制' : '复制'}
                  </Button>
                </div>
              </div>
            );
          })()}

          {/* 已生成入口列表 */}
          {entries.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-dark-300">已生成的只读入口</h3>
              {entries.map(entry => {
                const expired = isExpired(entry);
                return (
                  <div
                    key={entry.token}
                    className="glass-card p-3 flex items-center gap-3 flex-wrap"
                  >
                    <div className="flex-1 min-w-[180px] space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-dark-500">
                          {entry.token.slice(0, 16)}…
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            expired
                              ? 'bg-dark-700/60 text-dark-500'
                              : 'bg-accent-green/15 text-accent-green'
                          }`}
                        >
                          {expired ? '已过期' : '生效中'}
                        </span>
                      </div>
                      <p className="text-xs text-dark-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDateTime(entry.createdAt)} 生成 ·
                        初始 {entry.recordCountAtCreation} 条 ·
                        至 {formatDateTime(entry.expiresAt)} 止
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={expired}
                      onClick={() => handleCopy(entry.token)}
                      icon={
                        copiedToken === entry.token ? (
                          <Check className="w-4 h-4 text-accent-green" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )
                      }
                    >
                      {copiedToken === entry.token ? '已复制' : '复制链接'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRevoke(entry.token)}
                      icon={<Trash2 className="w-4 h-4" />}
                    >
                      撤销
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
