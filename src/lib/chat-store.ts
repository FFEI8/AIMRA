// ============================================================================
// AI Medical Record Analysis - Chat Store (Zustand)
// ============================================================================

import { create } from "zustand";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  contextItems?: string[];
  feedback?: "positive" | "negative" | null;
  stopped?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export type ModelProvider = "default" | "deepseek" | "dashscope" | "custom";

export interface ModelConfig {
  provider: ModelProvider;
  endpoint: string;
  apiKey: string;
  model: string;
  maxTokens: number;
}

// ---------------------------------------------------------------------------
// Model Presets
// ---------------------------------------------------------------------------

export const MODEL_PRESETS: Record<ModelProvider, Omit<ModelConfig, "provider">> = {
  default: {
    endpoint: "/api/chat",
    apiKey: "",
    model: "default",
    maxTokens: 4096,
  },
  deepseek: {
    endpoint: "https://api.deepseek.com/v1/chat/completions",
    apiKey: "",
    model: "deepseek-chat",
    maxTokens: 4096,
  },
  dashscope: {
    endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    apiKey: "",
    model: "qwen-plus",
    maxTokens: 4096,
  },
  custom: {
    endpoint: "",
    apiKey: "",
    model: "",
    maxTokens: 4096,
  },
};

export function getProviderLabel(provider: ModelProvider): string {
  const labels: Record<ModelProvider, string> = {
    default: "默认模型",
    deepseek: "DeepSeek",
    dashscope: "通义千问",
    custom: "自定义",
  };
  return labels[provider];
}

export function getModelDisplayInfo(config: ModelConfig): string {
  const label = getProviderLabel(config.provider);
  if (config.provider === "default") {
    return label;
  }
  return `${label} / ${config.model || "未设置"}`;
}

// ---------------------------------------------------------------------------
// Relative Time Formatting
// ---------------------------------------------------------------------------

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  if (days < 365) return `${Math.floor(days / 30)}个月前`;
  return `${Math.floor(days / 365)}年前`;
}

// ---------------------------------------------------------------------------
// Default System Prompt
// ---------------------------------------------------------------------------

const DEFAULT_SYSTEM_PROMPT = `你是一位专业的医疗AI助手，专注于病历数据的分析与解读。你的职责包括：

1. **病历数据解读**：根据用户选中的病历数据（包括基本信息、检查记录、检验报告、诊断记录、手术记录和病历文书），提供专业、准确的解读和分析。

2. **异常指标提示**：识别检验报告中的异常指标（标记为↑或↓的项目），解释其临床意义及可能的关联疾病。

3. **诊断关联分析**：分析患者各项诊断之间的关联性，评估疾病的严重程度和进展风险。

4. **诊疗建议**：基于患者的完整病历信息，提供合理的诊疗建议，但需明确说明仅供参考，不能替代医生的临床判断。

5. **病情总结**：对患者的整体病情进行系统性总结，突出关键问题。

请注意：
- 始终以专业、严谨的态度回答问题
- 明确标注AI分析的局限性，提醒用户及时就医
- 使用中文回答所有问题
- 当病历数据不完整时，主动提示补充信息的重要性`;

// ---------------------------------------------------------------------------
// Storage Keys & Helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY_SESSIONS = "medical-ai-sessions";
const STORAGE_KEY_MODEL = "medical-ai-model-config";
const STORAGE_KEY_CURRENT_SESSION = "medical-ai-current-session";
const MAX_MESSAGES_PER_SESSION = 50;

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore parse errors
  }
  return fallback;
}

function saveToStorage(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Migration: old single-conversation format → new multi-session format
// ---------------------------------------------------------------------------

function migrateOldFormat(): ChatSession[] {
  if (typeof window === "undefined") return [];

  // Check if old format exists
  const oldMessages = localStorage.getItem("medical-ai-messages");
  const oldSystemPrompt = localStorage.getItem("medical-ai-system-prompt");

  if (!oldMessages) return [];

  try {
    const messages: ChatMessage[] = JSON.parse(oldMessages);
    if (!Array.isArray(messages) || messages.length === 0) return [];

    // Create a session from old messages
    const session: ChatSession = {
      id: generateId(),
      title: messages[0]?.content?.substring(0, 30) || "历史会话",
      messages: messages.slice(-MAX_MESSAGES_PER_SESSION),
      createdAt: messages[0]?.timestamp || Date.now(),
      updatedAt: Date.now(),
    };

    // Clean up old keys
    localStorage.removeItem("medical-ai-messages");
    localStorage.removeItem("medical-ai-system-prompt");
    localStorage.removeItem("medical-ai-selected-nodes");
    localStorage.removeItem("medical-ai-model");

    return [session];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Store Types
// ---------------------------------------------------------------------------

interface ChatStoreState {
  // Sessions
  sessions: ChatSession[];
  currentSessionId: string | null;

  // Computed
  messages: ChatMessage[];

  // Loading
  isLoading: boolean;

  // System prompt
  systemPrompt: string;

  // Selection
  selectedNodeIds: Set<string>;

  // UI
  leftPanelOpen: boolean;
  currentPatientId: string | null;
  previewNodeId: string | null;

  // Model
  modelConfig: ModelConfig;
}

interface ChatStoreActions {
  // Session
  createNewSession: () => string;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  renameSession: (sessionId: string, title: string) => void;

  // Message
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  updateMessageFeedback: (messageId: string, feedback: "positive" | "negative" | null) => void;
  setLoading: (loading: boolean) => void;
  setSystemPrompt: (prompt: string) => void;

  // Selection
  toggleNodeSelection: (nodeId: string) => void;
  selectAllChildren: (nodeIds: string[]) => void;
  deselectAllChildren: (nodeIds: string[]) => void;
  clearSelection: () => void;

  // UI
  toggleLeftPanel: () => void;
  setLeftPanelOpen: (open: boolean) => void;
  clearChat: () => void;
  setCurrentPatientId: (patientId: string | null) => void;
  setPreviewNodeId: (nodeId: string | null) => void;

  // Model
  setModelConfig: (config: Partial<ModelConfig>) => void;

  // Internal
  _persistSessions: () => void;
  _persistModelConfig: () => void;
}

// ---------------------------------------------------------------------------
// Store Implementation
// ---------------------------------------------------------------------------

export const useChatStore = create<ChatStoreState & ChatStoreActions>((set, get) => {
  // Initialize sessions (with migration support)
  const initialSessions = (() => {
    const stored = loadFromStorage<ChatSession[] | null>(STORAGE_KEY_SESSIONS, null);
    if (stored && stored.length > 0) return stored;
    // Try migrating old format
    const migrated = migrateOldFormat();
    if (migrated.length > 0) {
      saveToStorage(STORAGE_KEY_SESSIONS, migrated);
      return migrated;
    }
    return [];
  })();

  const initialCurrentSessionId = loadFromStorage<string | null>(STORAGE_KEY_CURRENT_SESSION, null);
  const initialModelConfig = loadFromStorage<ModelConfig>(STORAGE_KEY_MODEL, {
    provider: "default",
    ...MODEL_PRESETS.default,
  } as ModelConfig);

  // Compute messages from current session
  function getMessagesFromSession(sessions: ChatSession[], sessionId: string | null): ChatMessage[] {
    if (!sessionId) return [];
    const session = sessions.find((s) => s.id === sessionId);
    return session?.messages || [];
  }

  return {
    // ---- State ----
    sessions: initialSessions,
    currentSessionId: initialCurrentSessionId,
    messages: getMessagesFromSession(initialSessions, initialCurrentSessionId),
    isLoading: false,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    selectedNodeIds: new Set<string>(),
    leftPanelOpen: true,
    currentPatientId: null,
    previewNodeId: null,
    modelConfig: initialModelConfig,

    // ---- Session Actions ----
    createNewSession: () => {
      const newSession: ChatSession = {
        id: generateId(),
        title: "新会话",
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      set((state) => {
        const sessions = [newSession, ...state.sessions];
        return {
          sessions,
          currentSessionId: newSession.id,
          messages: [],
        };
      });
      get()._persistSessions();
      saveToStorage(STORAGE_KEY_CURRENT_SESSION, newSession.id);
      return newSession.id;
    },

    switchSession: (sessionId: string) => {
      set((state) => ({
        currentSessionId: sessionId,
        messages: getMessagesFromSession(state.sessions, sessionId),
      }));
      saveToStorage(STORAGE_KEY_CURRENT_SESSION, sessionId);
    },

    deleteSession: (sessionId: string) => {
      set((state) => {
        const sessions = state.sessions.filter((s) => s.id !== sessionId);
        const newCurrentId =
          state.currentSessionId === sessionId
            ? sessions.length > 0
              ? sessions[0].id
              : null
            : state.currentSessionId;
        return {
          sessions,
          currentSessionId: newCurrentId,
          messages: getMessagesFromSession(sessions, newCurrentId),
        };
      });
      get()._persistSessions();
      saveToStorage(STORAGE_KEY_CURRENT_SESSION, get().currentSessionId);
    },

    renameSession: (sessionId: string, title: string) => {
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId ? { ...s, title, updatedAt: Date.now() } : s
        ),
      }));
      get()._persistSessions();
    },

    // ---- Message Actions ----
    addMessage: (message) => {
      const newMessage: ChatMessage = {
        ...message,
        id: generateId(),
        timestamp: Date.now(),
      };

      set((state) => {
        let sessions = state.sessions;
        let currentSessionId = state.currentSessionId;

        // Auto-create session if none exists
        if (!currentSessionId) {
          const newSession: ChatSession = {
            id: generateId(),
            title: message.content.substring(0, 30) || "新会话",
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          sessions = [newSession, ...sessions];
          currentSessionId = newSession.id;
        }

        sessions = sessions.map((s) => {
          if (s.id !== currentSessionId) return s;

          const messages = [...s.messages, newMessage].slice(-MAX_MESSAGES_PER_SESSION);

          // Auto-title from first user message
          const title =
            s.messages.length === 0 && message.role === "user"
              ? message.content.substring(0, 30)
              : s.title;

          return {
            ...s,
            messages,
            title,
            updatedAt: Date.now(),
          };
        });

        return {
          sessions,
          currentSessionId,
          messages: getMessagesFromSession(sessions, currentSessionId),
        };
      });

      get()._persistSessions();
      saveToStorage(STORAGE_KEY_CURRENT_SESSION, get().currentSessionId);
    },

    updateMessageFeedback: (messageId: string, feedback: "positive" | "negative" | null) => {
      set((state) => {
        const sessions = state.sessions.map((s) => {
          if (s.id !== state.currentSessionId) return s;
          return {
            ...s,
            messages: s.messages.map((m) =>
              m.id === messageId ? { ...m, feedback } : m
            ),
            updatedAt: Date.now(),
          };
        });
        return {
          sessions,
          messages: getMessagesFromSession(sessions, state.currentSessionId),
        };
      });
      get()._persistSessions();
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },

    setSystemPrompt: (prompt: string) => {
      set({ systemPrompt: prompt });
    },

    // ---- Selection Actions ----
    toggleNodeSelection: (nodeId: string) => {
      set((state) => {
        const selectedNodeIds = new Set(state.selectedNodeIds);
        if (selectedNodeIds.has(nodeId)) {
          selectedNodeIds.delete(nodeId);
        } else {
          selectedNodeIds.add(nodeId);
        }
        return { selectedNodeIds };
      });
    },

    selectAllChildren: (nodeIds: string[]) => {
      set((state) => {
        const selectedNodeIds = new Set(state.selectedNodeIds);
        for (const id of nodeIds) {
          selectedNodeIds.add(id);
        }
        return { selectedNodeIds };
      });
    },

    deselectAllChildren: (nodeIds: string[]) => {
      set((state) => {
        const selectedNodeIds = new Set(state.selectedNodeIds);
        for (const id of nodeIds) {
          selectedNodeIds.delete(id);
        }
        return { selectedNodeIds };
      });
    },

    clearSelection: () => {
      set({ selectedNodeIds: new Set<string>() });
    },

    // ---- UI Actions ----
    toggleLeftPanel: () => {
      set((state) => ({ leftPanelOpen: !state.leftPanelOpen }));
    },

    setLeftPanelOpen: (open: boolean) => {
      set({ leftPanelOpen: open });
    },

    clearChat: () => {
      set((state) => {
        const sessions = state.sessions.map((s) => {
          if (s.id !== state.currentSessionId) return s;
          return { ...s, messages: [], updatedAt: Date.now() };
        });
        return {
          sessions,
          messages: [],
        };
      });
      get()._persistSessions();
    },

    setCurrentPatientId: (patientId: string | null) => {
      set({ currentPatientId: patientId });
    },

    setPreviewNodeId: (nodeId: string | null) => {
      set({ previewNodeId: nodeId });
    },

    // ---- Model Actions ----
    setModelConfig: (config: Partial<ModelConfig>) => {
      set((state) => {
        const modelConfig = { ...state.modelConfig, ...config };
        return { modelConfig };
      });
      get()._persistModelConfig();
    },

    // ---- Internal Persistence ----
    _persistSessions: () => {
      const { sessions } = get();
      saveToStorage(STORAGE_KEY_SESSIONS, sessions);
    },

    _persistModelConfig: () => {
      const { modelConfig } = get();
      saveToStorage(STORAGE_KEY_MODEL, modelConfig);
    },
  };
});
