import React, { useMemo } from 'react';
import {
  Calendar,
  Eye,
  History,
  Languages,
  Link2Off,
  Lock,
  Mic,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { LANGUAGES } from '@/utils/constants';
import { formatTime, getLanguageDisplayName } from '@/utils/helpers';
import { isShareTokenValid } from '@/utils/share';
import type { SessionRecord, SessionRecordType } from '@/types';

interface SharedHistoryViewProps {
  token: string | null;
}

// 只读状态标识徽章
const ReadOnlyBadge: React.FC = () => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/30">
    <Lock className="w-3.5 h-3.5" />
    只读模式
  </span>
);

export const SharedHistoryView: React.FC<SharedHistoryViewProps> = ({ token }) => {
  const sessionRecords = useAppStore(state => state.sessionRecords);

  // 入口是否有效只取决于 token，与记录内容无关；失效时绝不退化为可写界面
  const isValid = useMemo(() => isShareTokenValid(token), [token]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, SessionRecord[]> = {};
    sessionRecords.forEach(record => {
      const date = record.timestamp.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(record);
    });
    return groups;
  }, [sessionRecords]);

  const getTypeIcon = (type: SessionRecordType) => {
    return type === 'voice' ? (
      <Mic className="w-4 h-4" />
    ) : (
      <Languages className="w-4 h-4" />
    );
  };

  const getTypeLabel = (type: SessionRecordType) => {
    return type === 'voice' ? '语音识别' : '手动翻译';
  };

  const getTypeColor = (type: SessionRecordType) => {
    return type === 'voice'
      ? 'bg-accent-red/20 text-accent-red'
      : 'bg-primary-500/20 text-primary-400';
  };

  const renderContent = () => {
    // 入口失效或权限不足：明确提示，且不提供任何可写能力
    if (!isValid) {
      return (
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="glass-panel rounded-2xl p-8 max-w-md mx-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-accent-red/15 rounded-full">
                <Link2Off className="w-8 h-8 text-accent-red" />
              </div>
            </div>
            <h2 className="text-lg font-semibold text-dark-100 mb-2">只读入口无效或已失效</h2>
            <p className="text-sm text-dark-400 leading-relaxed mb-6">
              该分享链接不存在、已被移除，或当前环境无权访问。为保护会话数据安全，页面不会切换为可写状态，请向分享者重新获取有效链接。
            </p>
            <a
              href={window.location.pathname}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-lg transition-all duration-200 ease-out font-medium border border-white/10 text-sm"
            >
              前往可写界面
            </a>
          </div>
        </div>
      );
    }

    // 数据为空或记录已被清空：说明情况
    if (sessionRecords.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center min-h-0">
          <div className="glass-panel rounded-2xl p-8 max-w-md mx-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-dark-700/50 rounded-full">
                <History className="w-8 h-8 text-dark-500" />
              </div>
            </div>
            <h2 className="text-lg font-semibold text-dark-100 mb-2">暂无可查看的记录</h2>
            <p className="text-sm text-dark-400 leading-relaxed">
              当前没有可显示的会话记录，可能是尚未产生新的记录，或记录已被清空。此处为只读视图，无法新增或修改内容。
            </p>
          </div>
        </div>
      );
    }

    // 正常只读视图：仅展示原文、译文与时间
    return (
      <div className="flex-1 min-h-0 flex flex-col glass-panel rounded-2xl overflow-hidden">
        {/* 只读提示横幅 */}
        <div className="flex items-center gap-2 px-4 py-3 bg-accent-yellow/10 border-b border-accent-yellow/20 flex-shrink-0">
          <Eye className="w-4 h-4 text-accent-yellow flex-shrink-0" />
          <p className="text-sm text-accent-yellow">
            当前为只读分享视图，仅可查看原文、译文与时间，无法修改、删除或追加记录。
          </p>
        </div>

        {/* 记录列表 */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {Object.entries(groupedByDate).map(([date, records]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3 px-2 sticky top-0 bg-dark-900/80 backdrop-blur-sm py-2 -mt-2 z-10">
                <Calendar className="w-4 h-4 text-dark-500" />
                <span className="text-sm font-medium text-dark-400">{date}</span>
                <span className="text-xs text-dark-600">({records.length} 条)</span>
              </div>
              <div className="space-y-2">
                {records.map(record => (
                  <div key={record.id} className="glass-card p-4">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(record.type)}`}>
                        {getTypeIcon(record.type)}
                        {getTypeLabel(record.type)}
                      </span>
                      <span className="text-xs text-dark-600 font-mono">
                        {formatTime(record.timestamp)}
                      </span>
                      <span className="text-xs text-dark-600">
                        {getLanguageDisplayName(record.sourceLang, LANGUAGES)} → {getLanguageDisplayName(record.targetLang, LANGUAGES)}
                      </span>
                    </div>
                    <p className="text-sm text-dark-300 whitespace-pre-wrap break-words mb-1">
                      {record.sourceText}
                    </p>
                    <p className="text-sm text-dark-100 whitespace-pre-wrap break-words border-l-2 border-primary-500 pl-3">
                      {record.targetText}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen h-screen w-full flex flex-col p-4 md:p-6 box-border">
      {/* 顶部导航栏（只读） */}
      <header className="flex items-center justify-between mb-4 md:mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-500/20 rounded-lg">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-400 to-primary-600" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-dark-100">实时字幕翻译 · 会话记录</h1>
            <p className="text-xs text-dark-500 hidden sm:block">Shared Read-only View</p>
          </div>
        </div>
        <ReadOnlyBadge />
      </header>

      {renderContent()}

      {/* 底部只读说明 */}
      <footer className="flex-shrink-0 pt-4 text-center">
        <p className="text-xs text-dark-600">
          此页面为只读分享视图，内容仅用于查看，任何修改都不会生效。
        </p>
      </footer>
    </div>
  );
};
