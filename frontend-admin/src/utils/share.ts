import { generateId } from '@/utils/helpers';

// 只读分享入口的存储键
const SHARE_ENTRIES_KEY = 'subtitle-translator-share-entries';

// 只读分享条目
export interface ShareEntry {
  token: string;
  createdAt: string;
}

// 当前地址解析出的只读分享请求
export interface ShareRequest {
  isShare: boolean;
  token: string | null;
}

const loadShareEntries = (): ShareEntry[] => {
  try {
    const stored = localStorage.getItem(SHARE_ENTRIES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (entry): entry is ShareEntry =>
            !!entry &&
            typeof entry.token === 'string' &&
            typeof entry.createdAt === 'string'
        );
      }
    }
  } catch {
    console.error('Failed to load share entries from storage');
  }
  return [];
};

const saveShareEntries = (entries: ShareEntry[]) => {
  try {
    localStorage.setItem(SHARE_ENTRIES_KEY, JSON.stringify(entries));
    return true;
  } catch {
    console.error('Failed to save share entries to storage');
    return false;
  }
};

// 构造只读分享链接
export const buildShareUrl = (token: string): string => {
  return `${window.location.origin}${window.location.pathname}?share=${encodeURIComponent(token)}`;
};

// 校验只读入口是否有效（token 必须存在且已登记）
export const isShareTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  return loadShareEntries().some(entry => entry.token === token);
};

// 创建一个新的只读分享入口，返回完整链接；存储不可用时返回 null
export const createShareEntry = (): string | null => {
  const token = `share-${generateId()}`;
  const entries = loadShareEntries();
  if (!saveShareEntries([...entries, { token, createdAt: new Date().toISOString() }])) {
    return null;
  }
  // 确认入口真正写入成功（隐私模式等场景下可能静默失败）
  if (!isShareTokenValid(token)) {
    return null;
  }
  return buildShareUrl(token);
};

// 解析当前地址是否为只读分享入口
export const parseShareRequest = (): ShareRequest => {
  try {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('share')) {
      return { isShare: false, token: null };
    }
    const token = params.get('share');
    return { isShare: true, token: token && token.trim() ? token : null };
  } catch {
    return { isShare: false, token: null };
  }
};
