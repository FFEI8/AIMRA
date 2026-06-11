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

export interface ChatPrompt {
  id: string;
  title: string;
  content: string;
  category: string;
  isBuiltin: boolean;
}

export const BUILTIN_CHAT_PROMPTS: ChatPrompt[] = [
  {
    id: "prompt-analyze",
    title: "病情分析",
    content: "请综合分析该患者的所有病历数据，给出整体病情评估，包括主要诊断、关键异常指标和病情严重程度判断。",
    category: "分析",
    isBuiltin: true,
  },
  {
    id: "prompt-abnormal",
    title: "异常指标解读",
    content: "请详细解读该患者检验报告中的异常指标，分析各异常指标的临床意义及可能的关联疾病。",
    category: "分析",
    isBuiltin: true,
  },
  {
    id: "prompt-diagnosis",
    title: "鉴别诊断",
    content: "基于该患者的临床表现和检查结果，请列出主要鉴别诊断及其依据，并分析各诊断的可能性。",
    category: "诊断",
    isBuiltin: true,
  },
  {
    id: "prompt-treatment",
    title: "诊疗建议",
    content: "基于该患者的完整病历信息，请提供诊疗建议，包括治疗方案优化、进一步检查建议和注意事项。",
    category: "治疗",
    isBuiltin: true,
  },
  {
    id: "prompt-prognosis",
    title: "预后评估",
    content: "请根据该患者的诊断、检查结果和治疗效果，评估患者的预后情况，包括可能的并发症和风险因素。",
    category: "评估",
    isBuiltin: true,
  },
  {
    id: "prompt-medication",
    title: "用药分析",
    content: "请分析该患者当前用药方案的合理性，包括药物相互作用、剂量适宜性及可能的调整建议。",
    category: "治疗",
    isBuiltin: true,
  },
  {
    id: "prompt-summary",
    title: "病情总结",
    content: "请对该患者的整体病情进行系统性总结，突出关键问题和需要关注的重点。",
    category: "分析",
    isBuiltin: true,
  },
  {
    id: "prompt-followup",
    title: "随访计划",
    content: "请为该患者制定详细的随访计划，包括复查项目、随访频率和注意事项。",
    category: "评估",
    isBuiltin: true,
  },
];

const STORAGE_KEY_CHAT_PROMPTS = "medical-ai-chat-prompts";

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

  // Chat prompts
  chatPrompts: ChatPrompt[];

  // Selection
  selectedNodeIds: Set<string>;

  // UI
  leftPanelOpen: boolean;
  currentPatientId: string | null;
  previewNodeId: string | null;
  patientFilter: "all" | "inpatient" | "discharged";
  // Model
  modelConfig: ModelConfig;

  // Hydration
  _hasHydrated: boolean;
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

  // Chat Prompts
  addChatPrompt: (prompt: Omit<ChatPrompt, "id" | "isBuiltin">) => void;
  deleteChatPrompt: (promptId: string) => void;
  updateChatPrompt: (promptId: string, updates: Partial<ChatPrompt>) => void;

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
  setPatientFilter: (filter: "all" | "inpatient" | "discharged") => void;
  // Model
  setModelConfig: (config: Partial<ModelConfig>) => void;

  // Hydration
  _hydrate: () => void;

  // Internal
  _persistSessions: () => void;
  _persistModelConfig: () => void;
  _persistChatPrompts: () => void;
}

// ---------------------------------------------------------------------------
// Helper: Compute messages from current session
// ---------------------------------------------------------------------------

function getMessagesFromSession(sessions: ChatSession[], sessionId: string | null): ChatMessage[] {
  if (!sessionId) return [];
  const session = sessions.find((s) => s.id === sessionId);
  return session?.messages || [];
}

// ---------------------------------------------------------------------------
// Default Model Config
// ---------------------------------------------------------------------------

const DEFAULT_MODEL_CONFIG: ModelConfig = {
  provider: "default",
  ...MODEL_PRESETS.default,
};

// ---------------------------------------------------------------------------
// Store Implementation
// ---------------------------------------------------------------------------

export const useChatStore = create<ChatStoreState & ChatStoreActions>((set, get) => {
  return {
    // ---- State (always initialized with SSR-safe defaults) ----
    sessions: [],
    currentSessionId: null,
    messages: [],
    isLoading: false,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    chatPrompts: BUILTIN_CHAT_PROMPTS,
    selectedNodeIds: new Set<string>(),
    leftPanelOpen: true,
    currentPatientId: null,
    previewNodeId: null,
    patientFilter: "all",
    modelConfig: DEFAULT_MODEL_CONFIG,
    _hasHydrated: false,

    // ---- Hydration (loads persisted state from localStorage after mount) ----
    _hydrate: () => {
      // Load sessions
      const stored = loadFromStorage<ChatSession[] | null>(STORAGE_KEY_SESSIONS, null);
      let sessions: ChatSession[] = [];
      if (stored && stored.length > 0) {
        sessions = stored;
      } else {
        // Try migrating old format
        const migrated = migrateOldFormat();
        if (migrated.length > 0) {
          saveToStorage(STORAGE_KEY_SESSIONS, migrated);
          sessions = migrated;
        }
      }

      const currentSessionId = loadFromStorage<string | null>(STORAGE_KEY_CURRENT_SESSION, null);
      const modelConfig = loadFromStorage<ModelConfig>(STORAGE_KEY_MODEL, DEFAULT_MODEL_CONFIG);
      const chatPrompts = loadFromStorage<ChatPrompt[]>(STORAGE_KEY_CHAT_PROMPTS, BUILTIN_CHAT_PROMPTS);

      set({
        sessions,
        currentSessionId,
        messages: getMessagesFromSession(sessions, currentSessionId),
        modelConfig,
        chatPrompts,
        _hasHydrated: true,
      });
    },

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

    // ---- Chat Prompt Actions ----
    addChatPrompt: (prompt) => {
      const newPrompt: ChatPrompt = {
        ...prompt,
        id: generateId(),
        isBuiltin: false,
      };
      set((state) => ({
        chatPrompts: [...state.chatPrompts, newPrompt],
      }));
      get()._persistChatPrompts();
    },

    deleteChatPrompt: (promptId) => {
      set((state) => ({
        chatPrompts: state.chatPrompts.filter((p) => p.id !== promptId || p.isBuiltin),
      }));
      get()._persistChatPrompts();
    },

    updateChatPrompt: (promptId, updates) => {
      set((state) => ({
        chatPrompts: state.chatPrompts.map((p) =>
          p.id === promptId ? { ...p, ...updates } : p
        ),
      }));
      get()._persistChatPrompts();
    },

    // ---- Model Actions ----
    setModelConfig: (config: Partial<ModelConfig>) => {
      set((state) => {
        const modelConfig = { ...state.modelConfig, ...config };
        return { modelConfig };
      });
      get()._persistModelConfig();
    },

    // ---- UI Actions ----
    setPatientFilter: (filter) => {
      set({ patientFilter: filter });
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

    _persistChatPrompts: () => {
      const { chatPrompts } = get();
      saveToStorage(STORAGE_KEY_CHAT_PROMPTS, chatPrompts);
    },
  };
});
