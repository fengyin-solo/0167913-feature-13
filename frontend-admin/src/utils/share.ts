import type { ShareEntry, ShareAccess } from '@/types';

// 只读分享入口使用独立的存储 key，与可写会话记录隔离
const SHARES_STORAGE_KEY = 'subtitle-translator-readonly-shares';

// 只读入口默认有效期：30 天
export const SHARE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// token 前缀，便于辨识，也防止伪造的任意字符串直接命中
const TOKEN_PREFIX = 'ro_';

// 生成不可预测的分享 token
export const generateShareToken = (): string => {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function'
      ? Array.from(crypto.getRandomValues(new Uint8Array(24)), b =>
          b.toString(16).padStart(2, '0')
        ).join('')
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${TOKEN_PREFIX}${Date.now().toString(36)}_${rand}`;
};

const loadShares = (): ShareEntry[] => {
  try {
    const stored = localStorage.getItem(SHARES_STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return (parsed as ShareEntry[]).filter(
      e =>
        e &&
        typeof e.token === 'string' &&
        typeof e.createdAt === 'string' &&
        typeof e.expiresAt === 'string' &&
        typeof e.recordCountAtCreation === 'number'
    );
  } catch {
    console.error('Failed to load readonly shares from storage');
    return [];
  }
};

const persistShares = (shares: ShareEntry[]): void => {
  try {
    localStorage.setItem(SHARES_STORAGE_KEY, JSON.stringify(shares));
  } catch {
    console.error('Failed to persist readonly shares to storage');
  }
};

const isExpired = (entry: ShareEntry, now: number = Date.now()): boolean =>
  new Date(entry.expiresAt).getTime() <= now;

// 创建一个只读分享入口
export const createShareEntry = (recordCountAtCreation: number): ShareEntry => {
  const now = Date.now();
  const entry: ShareEntry = {
    token: generateShareToken(),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SHARE_TTL_MS).toISOString(),
    recordCountAtCreation,
  };
  persistShares([entry, ...loadShares()]);
  return entry;
};

// 获取所有未被撤销的入口（含已过期，便于在管理列表中标识）
export const listShareEntries = (): ShareEntry[] => loadShares();

// 撤销入口，撤销后旧链接立即失效
export const revokeShareEntry = (token: string): void => {
  persistShares(loadShares().filter(e => e.token !== token));
};

// 构造完整的只读分享链接
export const buildShareUrl = (token: string): string => {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#/share/${encodeURIComponent(token)}`;
};

/**
 * 校验只读入口。
 * 任何不合法情况都返回非 ok 状态，调用方必须停留在只读错误页，
 * 绝不能退化成可写界面。
 */
export const resolveShareAccess = (
  token: string | null | undefined
): ShareAccess => {
  if (!token || !token.startsWith(TOKEN_PREFIX)) {
    return { ok: false, reason: 'invalid' };
  }

  const entry = loadShares().find(e => e.token === token);
  if (!entry) {
    // 存储中查不到：入口从未被授权（伪造）或已被撤销/清理
    return { ok: false, reason: 'revoked' };
  }

  if (isExpired(entry)) {
    return { ok: false, reason: 'expired', entry };
  }

  return { ok: true, reason: 'valid', entry };
};
