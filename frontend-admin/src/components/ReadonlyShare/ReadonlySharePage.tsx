import React, { useEffect, useMemo } from 'react';
import {
  Lock,
  Eye,
  Clock,
  History,
  Inbox,
  Trash2,
  ShieldAlert,
  Link2Off,
  TimerOff,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { resolveShareAccess } from '@/utils/share';
import { formatTime } from '@/utils/helpers';
import type { SessionRecord } from '@/types';

interface ReadonlySharePageProps {
  token: string;
}

// 只读页面期间临时修改文档标题，离开后还原
const WRITABLE_DOC_TITLE = '实时字幕翻译系统';

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

// 只读模式徽标：在页面多个关键位置明确标识
const ReadonlyBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/30 ${className}`}
  >
    <Lock className="w-3.5 h-3.5" />
    只读模式 · READ-ONLY
  </span>
);

const ReadonlyNotice: React.FC = () => (
  <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-accent-yellow/10 border border-accent-yellow/25 text-sm text-accent-yellow/90">
    <Eye className="w-4 h-4 mt-0.5 flex-shrink-0" />
    <p>
      你正在通过只读入口查看会话记录，仅可浏览<strong>原文、译文与时间</strong>，
      不能修改、删除或继续追加任何内容。
    </p>
  </div>
);

// 入口失效/权限不足时的错误态：绝不提供进入可写界面的出口，防止退化为可写
const AccessErrorState: React.FC<{ kind: 'invalid' | 'revoked' | 'expired'; expiresAt?: string }> = ({
  kind,
  expiresAt,
}) => {
  const content = {
    invalid: {
      icon: <ShieldAlert className="w-12 h-12 text-accent-red" />,
      title: '只读入口无效',
      desc: '链接格式不正确或不是有效的只读分享入口。为保证数据安全，不会进入可写界面。',
    },
    revoked: {
      icon: <Link2Off className="w-12 h-12 text-accent-red" />,
      title: '只读入口已失效',
      desc: '该分享入口可能已被所有者撤销，或从未被授权。请向分享者重新索取有效的只读链接。',
    },
    expired: {
      icon: <TimerOff className="w-12 h-12 text-accent-yellow" />,
      title: '只读入口已过期',
      desc: `该只读入口的有效期已于 ${expiresAt ? formatDateTime(expiresAt) : '此前'} 截止。请向分享者重新索取链接。`,
    },
  }[kind];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md glass-panel rounded-2xl p-8 flex flex-col items-center text-center animate-fade-in">
        <ReadonlyBadge className="mb-6" />
        <div className="p-4 bg-dark-800/60 rounded-full mb-4">{content.icon}</div>
        <h1 className="text-xl font-semibold text-dark-100 mb-2">{content.title}</h1>
        <p className="text-sm text-dark-400 leading-relaxed">{content.desc}</p>
        <div className="mt-6 w-full pt-5 border-t border-white/10">
          <p className="text-xs text-dark-500 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            当前仍处于只读上下文，未授予任何写入权限
          </p>
        </div>
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ cleared: boolean; countAtCreation: number }> = ({
  cleared,
  countAtCreation,
}) => (
  <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
    {cleared ? (
      <Trash2 className="w-16 h-16 mb-4 opacity-30 text-dark-500" />
    ) : (
      <Inbox className="w-16 h-16 mb-4 opacity-30 text-dark-500" />
    )}
    <p className="text-lg font-medium text-dark-300 mb-1">
      {cleared ? '记录已被清空' : '暂无任何记录'}
    </p>
    <p className="text-sm text-dark-500 max-w-sm leading-relaxed">
      {cleared
        ? `这些记录在创建只读入口之后已被所有者清空（创建时共有 ${countAtCreation} 条）。只读入口无法恢复或重新写入内容。`
        : '该只读入口创建时尚未产生任何记录。当前为只读模式，无法在此添加内容。'}
    </p>
  </div>
);

// 单条记录：只呈现时间、原文、译文
const ReadonlyRecordItem: React.FC<{ record: SessionRecord }> = ({ record }) => (
  <div className="glass-card p-4 animate-slide-up">
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 text-xs text-dark-500 font-mono pt-1 whitespace-nowrap">
        {formatTime(record.timestamp)}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <p className="text-base leading-relaxed text-dark-200 whitespace-pre-wrap break-words">
          {record.sourceText}
        </p>
        <p className="text-sm leading-relaxed text-primary-400 whitespace-pre-wrap break-words">
          {record.targetText}
        </p>
      </div>
    </div>
  </div>
);

export const ReadonlySharePage: React.FC<ReadonlySharePageProps> = ({ token }) => {
  // 只读取状态，不引用任何写 action
  const sessionRecords = useAppStore(state => state.sessionRecords);

  // 进入只读页时在文档标题上也标识只读状态
  useEffect(() => {
    document.title = '只读分享 · 实时字幕翻译';
    return () => {
      document.title = WRITABLE_DOC_TITLE;
    };
  }, []);

  // 权限/有效性只在挂载时校验一次；任何失败都停留在只读错误态
  const access = useMemo(() => resolveShareAccess(token), [token]);

  if (!access.ok || !access.entry) {
    return (
      <AccessErrorState
        kind={access.reason === 'expired' ? 'expired' : access.reason === 'invalid' ? 'invalid' : 'revoked'}
        expiresAt={access.entry?.expiresAt}
      />
    );
  }

  const entry = access.entry;
  const wasCleared = entry.recordCountAtCreation > 0 && sessionRecords.length === 0;

  // 按日期分组（store 中的记录已是最新在前）
  const groupedByDate = sessionRecords.reduce<Record<string, SessionRecord[]>>((groups, record) => {
    const date = new Date(record.timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(record);
    return groups;
  }, {});

  return (
    <div className="min-h-screen h-screen w-full flex flex-col p-4 md:p-6 box-border">
      {/* 顶部：标题 + 只读徽标 */}
      <header className="flex items-center justify-between gap-3 mb-4 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 bg-primary-500/20 rounded-lg flex-shrink-0">
            <History className="w-5 h-5 text-primary-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-dark-100 truncate">
              会话记录 · 只读分享
            </h1>
            <p className="text-xs text-dark-500 truncate">Read-only Shared Session History</p>
          </div>
        </div>
        <ReadonlyBadge className="flex-shrink-0" />
      </header>

      {/* 只读说明条 */}
      <div className="mb-4 flex-shrink-0">
        <ReadonlyNotice />
      </div>

      {/* 记录主体 */}
      <main className="flex-1 min-h-0 w-full max-w-3xl mx-auto glass-panel rounded-2xl flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-dark-900/50 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-dark-300">
            <History className="w-4 h-4 text-dark-500" />
            历史记录
          </div>
          <span className="text-xs text-dark-500">共 {sessionRecords.length} 条</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {sessionRecords.length === 0 ? (
            <EmptyState cleared={wasCleared} countAtCreation={entry.recordCountAtCreation} />
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByDate).map(([date, records]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-3 px-1 text-sm font-medium text-dark-400">
                    <Clock className="w-4 h-4 text-dark-500" />
                    {date}
                    <span className="text-xs text-dark-600">({records.length} 条)</span>
                  </div>
                  <div className="space-y-2">
                    {records.map(record => (
                      <ReadonlyRecordItem key={record.id} record={record} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部状态栏：再次明确只读归属 */}
        <footer className="px-6 py-3 border-t border-white/10 bg-dark-900/50 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-dark-500">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              只读模式 · 仅可查看，无法修改或追加
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              入口有效期至 {formatDateTime(entry.expiresAt)}
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
};
