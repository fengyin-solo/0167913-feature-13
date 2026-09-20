// 语言类型
export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

// 字幕条目
export interface SubtitleEntry {
  id: string;
  originalText: string;
  translatedText: string;
  timestamp: Date;
  isActive: boolean;
}

// 翻译结果
export interface TranslationResult {
  id: string;
  sourceText: string;
  targetText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: Date;
}

// 音频设置
export interface AudioSettings {
  volume: number;
  speed: number;
  ttsEnabled: boolean;
}

// 控制面板状态
export interface ControlPanelState {
  sourceLang: string;
  targetLang: string;
  isMicOn: boolean;
  isRecording: boolean;
  audioSettings: AudioSettings;
}

// Toast 类型
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// 会话记录类型
export type SessionRecordType = 'voice' | 'manual';

// 会话记录条目
export interface SessionRecord {
  id: string;
  type: SessionRecordType;
  sourceText: string;
  targetText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: Date;
  metadata?: {
    confidence?: number;
    duration?: number;
  };
}

// 只读分享入口（持久化）
export interface ShareEntry {
  // 不可预测的访问凭证
  token: string;
  // 创建时间（ISO 字符串）
  createdAt: string;
  // 到期时间（ISO 字符串）
  expiresAt: string;
  // 创建入口时的记录条数，用于区分"创建时为空"与"创建后被清空"
  recordCountAtCreation: number;
}

// 只读入口校验失败原因
export type ShareAccessReason = 'invalid' | 'revoked' | 'expired' | 'valid';

// 只读入口校验结果。失败时 entry 可能为空，调用方不得回退到可写界面
export interface ShareAccess {
  ok: boolean;
  reason: ShareAccessReason;
  entry?: ShareEntry;
}

// 应用状态
export interface AppState {
  // 控制面板
  sourceLang: string;
  targetLang: string;
  isMicOn: boolean;
  isRecording: boolean;
  audioSettings: AudioSettings;
  
  // 字幕
  subtitles: SubtitleEntry[];
  currentSubtitle: string;
  
  // 翻译
  inputText: string;
  translationHistory: TranslationResult[];
  isTranslating: boolean;
  
  // Toast
  toasts: Toast[];
  
  // 会话记录
  sessionRecords: SessionRecord[];
  
  // Actions
  setSourceLang: (lang: string) => void;
  setTargetLang: (lang: string) => void;
  toggleMic: () => void;
  setAudioSettings: (settings: Partial<AudioSettings>) => void;
  addSubtitle: (original: string, translated: string) => void;
  setCurrentSubtitle: (text: string) => void;
  setInputText: (text: string) => void;
  translate: () => Promise<void>;
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
  addSessionRecord: (record: Omit<SessionRecord, 'id' | 'timestamp'>) => void;
  deleteSessionRecord: (id: string) => void;
  clearSessionRecords: () => void;
}
