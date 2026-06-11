"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useChatStore, getModelDisplayInfo, formatRelativeTime } from "@/lib/chat-store";
import type { ModelConfig, ChatMessage, ChatPrompt } from "@/lib/chat-store";
import { formatSelectedContext } from "@/lib/patient-data";
import type { TreeNode, CategoryType } from "@/lib/patient-data";
import { SessionManager } from "@/components/session-manager";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bot,
  Cpu,
  Trash2,
  Send,
  StopCircle,
  Mic,
  MicOff,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Volume2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Sparkles,
  Stethoscope,
  Brain,
  FlaskConical,
  Pill,
  FileText,
  Loader2,
  Keyboard,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Category emoji config for context preview
// ---------------------------------------------------------------------------

const CATEGORY_EMOJI: Record<CategoryType, string> = {
  basicInfo: "👤",
  exam: "🔬",
  lab: "🧪",
  diagnosis: "📋",
  surgery: "🔪",
  emr: "📄",
};

const CATEGORY_LABEL: Record<CategoryType, string> = {
  basicInfo: "基本信息",
  exam: "检查记录",
  lab: "检验记录",
  diagnosis: "诊断记录",
  surgery: "手术记录",
  emr: "病历文书",
};

// ---------------------------------------------------------------------------
// Quick Action Definitions
// ---------------------------------------------------------------------------

// Prompt category icons
const PROMPT_CATEGORY_ICONS: Record<string, React.ElementType> = {
  "分析": FlaskConical,
  "诊断": Brain,
  "治疗": Pill,
  "评估": FileText,
};

// ---------------------------------------------------------------------------
// Date Divider Helpers
// ---------------------------------------------------------------------------

function getDateLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDate.getTime() === today.getTime()) return "今天";
  if (msgDate.getTime() === yesterday.getTime()) return "昨天";
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function shouldShowDivider(messages: ChatMessage[], index: number): boolean {
  if (index === 0) return true;
  const curr = new Date(messages[index].timestamp);
  const prev = new Date(messages[index - 1].timestamp);
  return (
    curr.getFullYear() !== prev.getFullYear() ||
    curr.getMonth() !== prev.getMonth() ||
    curr.getDate() !== prev.getDate()
  );
}

// ---------------------------------------------------------------------------
// Typing Indicator
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2.5">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
          <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
        </div>
        <span className="text-xs text-muted-foreground ml-1">AI 正在思考</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Markdown Code Block with Copy
// ---------------------------------------------------------------------------

function CodeBlock({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const codeStr = String(children).replace(/\n$/, "");

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(codeStr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [codeStr]);

  if (!match) {
    return (
      <code className={cn("rounded bg-muted px-1.5 py-0.5 text-sm font-mono", className)} {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between bg-muted/70 px-3 py-1.5 text-xs text-muted-foreground">
        <span>{language}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={handleCopy}
        >
          {copied ? (
            <span className="text-green-500 text-[10px]">已复制</span>
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      <SyntaxHighlighter
        style={resolvedTheme === "dark" ? oneDark : oneLight}
        language={language}
        PreTag="div"
        customStyle={{ margin: 0, borderRadius: 0, fontSize: "13px" }}
      >
        {codeStr}
      </SyntaxHighlighter>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty Chat Placeholder with Chat Prompts
// ---------------------------------------------------------------------------

function EmptyChatPlaceholder({ onQuickAction }: { onQuickAction: (text: string) => void }) {
  const chatPrompts = useChatStore((s) => s.chatPrompts);

  const categoryDotColors: Record<string, string> = {
    "分析": "bg-teal-500",
    "诊断": "bg-purple-500",
    "治疗": "bg-amber-500",
    "评估": "bg-rose-500",
  };

  // Group by category for sectioned display
  const groupedPrompts = useMemo(() => {
    const groups: Record<string, ChatPrompt[]> = {};
    for (const prompt of chatPrompts) {
      if (!groups[prompt.category]) groups[prompt.category] = [];
      groups[prompt.category].push(prompt);
    }
    return groups;
  }, [chatPrompts]);

  return (
    <div className="flex flex-col gap-4 py-6 px-2 rounded-xl bg-gradient-to-b from-muted/30 to-transparent">
      {/* Minimalist header with animated icon */}
      <div className="flex items-center gap-2.5 text-muted-foreground">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/15 to-teal-500/10 shadow-sm animate-[gradientShift_4s_ease-in-out_infinite]">
          <Stethoscope className="h-4.5 w-4.5 text-emerald-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">选择病历数据，开始智能分析</p>
          <p className="text-xs text-muted-foreground">点击提示词快速提问，或输入自定义问题</p>
        </div>
      </div>

      {/* Subtle divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Quick prompts - horizontal rows by category */}
      <div className="w-full space-y-2.5">
        {Object.entries(groupedPrompts).map(([category, prompts]) => {
          const Icon = PROMPT_CATEGORY_ICONS[category] ?? Sparkles;
          return (
            <div key={category}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="h-3 w-3 text-muted-foreground" />
                <span className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded",
                  category === "分析" ? "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30" :
                  category === "诊断" ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30" :
                  category === "治疗" ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30" :
                  category === "评估" ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30" :
                  "text-muted-foreground bg-muted"
                )}>
                  {category}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {prompts.map((prompt) => (
                  <Tooltip key={prompt.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px] px-2.5 rounded-full gap-1.5 transition-all duration-200 hover:scale-[1.04] hover:shadow-sm active:scale-[0.98]"
                        onClick={() => onQuickAction(prompt.content)}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", categoryDotColors[prompt.category] ?? "bg-muted-foreground")} />
                        {prompt.title}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-xs">{prompt.content}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat Prompt Quick Bar (below messages)
// ---------------------------------------------------------------------------

function ChatPromptBar({ onQuickAction }: { onQuickAction: (text: string) => void }) {
  const chatPrompts = useChatStore((s) => s.chatPrompts);

  const categoryDotColors: Record<string, string> = {
    "分析": "bg-teal-500",
    "诊断": "bg-purple-500",
    "治疗": "bg-amber-500",
    "评估": "bg-rose-500",
  };

  if (chatPrompts.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 pb-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <Sparkles className="h-3 w-3 shrink-0 text-muted-foreground" />
      {chatPrompts.map((prompt) => (
        <Tooltip key={prompt.id}>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] px-2.5 rounded-full shrink-0 gap-1.5"
              onClick={() => onQuickAction(prompt.content)}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", categoryDotColors[prompt.category] ?? "bg-muted-foreground")} />
              {prompt.title}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-xs">{prompt.content}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

interface ChatWindowProps {
  treeData: TreeNode;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ChatWindow({ treeData }: ChatWindowProps) {
  const messages = useChatStore((s) => s.messages);
  const isLoading = useChatStore((s) => s.isLoading);
  const selectedNodeIds = useChatStore((s) => s.selectedNodeIds);
  const modelConfig = useChatStore((s) => s.modelConfig);
  const systemPrompt = useChatStore((s) => s.systemPrompt);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessageFeedback = useChatStore((s) => s.updateMessageFeedback);
  const setLoading = useChatStore((s) => s.setLoading);
  const clearChat = useChatStore((s) => s.clearChat);

  const { resolvedTheme } = useTheme();

  // Local state
  const [inputValue, setInputValue] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  // streamingMsgId is used for internal tracking only, not for rendering
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const [contextPreviewOpen, setContextPreviewOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [micState, setMicState] = useState<"idle" | "recording" | "processing">("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // ---------------------------------------------------------------------------
  // Computed values
  // ---------------------------------------------------------------------------

  // Collect selected leaf nodes from tree
  const selectedNodes = useMemo(() => {
    const result: TreeNode[] = [];
    function traverse(node: TreeNode) {
      if (node.isLeaf && selectedNodeIds.has(node.id)) {
        result.push(node);
      }
      if (node.children) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    }
    traverse(treeData);
    return result;
  }, [treeData, selectedNodeIds]);

  // Group selected nodes by category for context preview
  const selectedByCategory = useMemo(() => {
    const groups: Partial<Record<CategoryType, TreeNode[]>> = {};
    for (const node of selectedNodes) {
      if (!groups[node.category]) groups[node.category] = [];
      groups[node.category]!.push(node);
    }
    return groups;
  }, [selectedNodes]);

  // Formatted context text
  const formattedContext = useMemo(
    () => formatSelectedContext(selectedNodes),
    [selectedNodes]
  );

  // Context length and warning
  const contextLength = formattedContext.length;
  const contextWarning = contextLength > 4000;

  // Token estimation for input
  const estimatedTokens = Math.ceil(inputValue.length / 2);

  // Non-default model display
  const modelDisplay = modelConfig.provider !== "default" ? getModelDisplayInfo(modelConfig) : null;

  // ---------------------------------------------------------------------------
  // Auto-scroll to bottom
  // ---------------------------------------------------------------------------

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);



  // ---------------------------------------------------------------------------
  // Voice recording (mock)
  // ---------------------------------------------------------------------------

  const startRecording = useCallback(() => {
    setMicState("recording");
    setRecordingTime(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime((t) => t + 1);
    }, 1000);
  }, []);

  const stopRecording = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setMicState("processing");
    // Simulate processing
    setTimeout(() => {
      setInputValue((prev) => prev + "请分析当前选中的病历数据");
      setMicState("idle");
      toast.success("语音识别完成");
    }, 1500);
  }, []);

  // ---------------------------------------------------------------------------
  // Send message
  // ---------------------------------------------------------------------------

  const handleSend = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText || inputValue).trim();
      if (!text || isLoading) return;

      // Add user message
      const contextItems = selectedNodes.map((n) => n.label);
      addMessage({
        role: "user",
        content: text,
        contextItems: contextItems.length > 0 ? contextItems : undefined,
      });

      setInputValue("");
      setStreamingContent("");
      setLoading(true);

      // Build context
      const context = formattedContext;

      // Build history (last 10 messages)
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Create abort controller
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const streamingId = `streaming-${Date.now()}`;
      setStreamingMsgId(streamingId);

      try {
        const bodyPayload: Record<string, unknown> = {
          message: text,
          systemPrompt,
          context: context || undefined,
          history,
          stream: true,
        };

        // Include model config for non-default providers
        if (modelConfig.provider !== "default") {
          bodyPayload.modelConfig = {
            provider: modelConfig.provider,
            endpoint: modelConfig.endpoint,
            apiKey: modelConfig.apiKey,
            model: modelConfig.model,
            max_tokens: modelConfig.maxTokens,
          };
        }

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({ error: "请求失败" }));
          throw new Error(errData.error || `HTTP ${response.status}`);
        }

        if (!response.body) {
          throw new Error("服务器返回空响应");
        }

        // Read the stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "data: [DONE]") continue;

            if (trimmed.startsWith("data: ")) {
              const jsonStr = trimmed.slice(6);
              try {
                const parsed = JSON.parse(jsonStr);
                const content =
                  parsed.choices?.[0]?.delta?.content ??
                  parsed.choices?.[0]?.text ??
                  "";
                if (content) {
                  accumulated += content;
                  setStreamingContent(accumulated);
                }
              } catch {
                // Skip unparseable lines
              }
            }
          }
        }

        // Stream completed - add final assistant message
        if (accumulated) {
          addMessage({ role: "assistant", content: accumulated });
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // User stopped the generation
          if (streamingContent) {
            addMessage({
              role: "assistant",
              content: streamingContent,
              stopped: true,
            });
          }
          toast.info("已停止生成");
        } else {
          const errorMsg =
            err instanceof Error ? err.message : "未知错误";
          addMessage({
            role: "assistant",
            content: `❌ 请求失败：${errorMsg}\n\n请检查网络连接和模型配置后重试。`,
          });
        }
      } finally {
        setLoading(false);
        setStreamingContent("");
        setStreamingMsgId(null);
        abortControllerRef.current = null;
      }
    },
    [
      inputValue,
      isLoading,
      selectedNodes,
      formattedContext,
      messages,
      systemPrompt,
      modelConfig,
      addMessage,
      setLoading,
      streamingContent,
    ]
  );

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleClear = useCallback(() => {
    clearChat();
    setClearConfirmOpen(false);
    toast.success("聊天记录已清除");
  }, [clearChat]);

  // ---------------------------------------------------------------------------
  // Textarea auto-resize
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
    }
  }, [inputValue]);

  // ---------------------------------------------------------------------------
  // Keyboard shortcuts
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ?: Shortcuts (only when not typing)
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA") {
          e.preventDefault();
          setShortcutsOpen(true);
        }
      }
      // Escape: stop/blur
      if (e.key === "Escape") {
        if (isLoading) {
          handleStop();
        }
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoading, handleStop]);

  // ---------------------------------------------------------------------------
  // Quick action handlers
  // ---------------------------------------------------------------------------

  const handleQuickAction = useCallback(
    (label: string) => {
      handleSend(label);
    },
    [handleSend]
  );

  // ---------------------------------------------------------------------------
  // Message actions
  // ---------------------------------------------------------------------------

  const handleCopyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("已复制到剪贴板");
  }, []);

  const handleFeedback = useCallback(
    (msgId: string, feedback: "positive" | "negative") => {
      updateMessageFeedback(msgId, feedback);
      toast.success(feedback === "positive" ? "感谢反馈！" : "我们会改进");
    },
    [updateMessageFeedback]
  );

  const handleRegenerate = useCallback(
    (msgIndex: number) => {
      // Find the user message before this assistant message
      const userMsg = messages
        .slice(0, msgIndex)
        .reverse()
        .find((m) => m.role === "user");
      if (userMsg) {
        handleSend(userMsg.content);
      }
    },
    [messages, handleSend]
  );

  const handleTTS = useCallback((content: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(content.slice(0, 500));
      utterance.lang = "zh-CN";
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
      toast.info("正在朗读...");
    } else {
      toast.error("当前浏览器不支持语音合成");
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Render Markdown with custom components
  // ---------------------------------------------------------------------------

  const markdownComponents = useMemo(
    () => ({
      code: CodeBlock,
      table: ({ children }: React.HTMLAttributes<HTMLTableElement>) => (
        <div className="my-3 overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">{children}</table>
        </div>
      ),
      thead: ({ children }: React.HTMLAttributes<HTMLTableSectionElement>) => (
        <thead className="bg-muted/50">{children}</thead>
      ),
      th: ({ children }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
        <th className="border-b px-3 py-2 text-left font-semibold text-sm">{children}</th>
      ),
      td: ({ children }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
        <td className="border-b px-3 py-2 text-sm">{children}</td>
      ),
      blockquote: ({ children }: React.HTMLAttributes<HTMLQuoteElement>) => (
        <blockquote className="my-3 border-l-4 border-primary/30 bg-muted/30 pl-4 py-2 italic text-muted-foreground">
          {children}
        </blockquote>
      ),
      a: ({ href, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:text-primary/80"
        >
          {children}
        </a>
      ),
    }),
    []
  );

  // ---------------------------------------------------------------------------
  // Recording time formatter
  // ---------------------------------------------------------------------------

  const formatRecordingTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ---------------------------------------------------------------------------
  // Word count helper
  // ---------------------------------------------------------------------------

  const countWords = (text: string) => {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = text
      .replace(/[\u4e00-\u9fa5]/g, "")
      .split(/\s+/)
      .filter(Boolean).length;
    return chineseChars + englishWords;
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex h-full flex-col">
      {/* ================================================================= */}
      {/* Chat Header                                                       */}
      {/* ================================================================= */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        {/* Session manager - primary nav */}
        <SessionManager />

        {/* Context indicator - compact inline */}
        {selectedNodes.length > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {selectedNodes.length} 项数据
          </span>
        )}

        {/* Model badge */}
        {modelDisplay && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 gap-1 shrink-0">
            <Cpu className="h-3 w-3" />
            {modelDisplay}
          </Badge>
        )}

        <div className="flex-1" />

        {/* Message count */}
        <Badge variant="secondary" className="text-[10px] shrink-0">
          {messages.length} 条消息
        </Badge>

        {/* Clear button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          title="清除聊天"
          onClick={() => setClearConfirmOpen(true)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>



      {/* ================================================================= */}
      {/* Messages Area                                                     */}
      {/* ================================================================= */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-4 space-y-1">
          {messages.length === 0 && !isLoading && (
            <EmptyChatPlaceholder onQuickAction={handleQuickAction} />
          )}

          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            const showDivider = shouldShowDivider(messages, idx);

            return (
              <React.Fragment key={msg.id}>
                {showDivider && (
                  <div className="flex items-center gap-3 py-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {getDateLabel(msg.timestamp)}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}

                <div
                  ref={(el) => {
                    if (el) messageRefs.current.set(msg.id, el);
                  }}
                  className={cn(
                    "group flex gap-3 px-1 py-2 rounded-lg transition-colors animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
                    isUser ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Avatar */}
                  {isUser ? (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      你
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={cn(
                      "relative max-w-[85%] rounded-xl px-4 py-3 text-sm",
                      isUser
                        ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground"
                        : "bg-muted border-l-3 border-l-emerald-500",
                      msg.stopped && "border-dashed border-2 border-muted-foreground/30"
                    )}
                  >
                    {/* Context items badges (user messages) */}
                    {isUser && msg.contextItems && msg.contextItems.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {msg.contextItems.slice(0, 3).map((item, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[10px]"
                          >
                            {item.length > 15 ? item.slice(0, 15) + "..." : item}
                          </span>
                        ))}
                        {msg.contextItems.length > 3 && (
                          <span className="inline-flex items-center rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[10px]">
                            +{msg.contextItems.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Message content */}
                    {isUser ? (
                      <p className="whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    ) : (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown components={markdownComponents}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}

                    {/* Stopped indicator */}
                    {msg.stopped && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <StopCircle className="h-3 w-3" />
                        生成已停止
                      </div>
                    )}

                    {/* Word count (AI messages) */}
                    {!isUser && !msg.stopped && (
                      <span className="mt-1 block text-[10px] text-muted-foreground/60">
                        {countWords(msg.content)} 字
                        <span className="text-[10px] text-muted-foreground/40 ml-2">
                          {formatRelativeTime(msg.timestamp)}
                        </span>
                      </span>
                    )}

                    {/* Timestamp (user messages) */}
                    {isUser && (
                      <span className="mt-1 block text-[10px] text-primary-foreground/50">
                        {formatRelativeTime(msg.timestamp)}
                      </span>
                    )}

                    {/* Message actions (hover) */}
                    <div
                      className={cn(
                        "absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full",
                        "flex items-center gap-0.5 rounded-full border bg-background px-1 py-0.5 shadow-md",
                        "opacity-0 transition-opacity group-hover:opacity-100 z-10"
                      )}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        title="复制"
                        onClick={() => handleCopyMessage(msg.content)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      {!isUser && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-6 w-6", msg.feedback === "positive" && "text-green-500")}
                            title="有帮助"
                            onClick={() => handleFeedback(msg.id, "positive")}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-6 w-6", msg.feedback === "negative" && "text-red-500")}
                            title="需改进"
                            onClick={() => handleFeedback(msg.id, "negative")}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            title="朗读"
                            onClick={() => handleTTS(msg.content)}
                          >
                            <Volume2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            title="重新生成"
                            onClick={() => handleRegenerate(idx)}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          {/* Streaming indicator / content */}
          {isLoading && streamingContent && (
            <div className="flex gap-3 px-1 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="max-w-[85%] rounded-xl bg-muted border-l-3 border-l-emerald-500 px-4 py-3 text-sm">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown components={markdownComponents}>
                    {streamingContent}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}

          {isLoading && !streamingContent && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* ================================================================= */}
      {/* Context Preview (collapsible)                                     */}
      {/* ================================================================= */}
      {selectedNodes.length > 0 && (
        <Collapsible open={contextPreviewOpen} onOpenChange={setContextPreviewOpen}>
          <div className="border-t bg-muted/20">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between gap-2 rounded-none px-4 py-2 text-xs h-8"
              >
                <span className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  将附加 {selectedNodes.length} 项病历数据
                  {contextWarning && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <AlertTriangle className="h-3 w-3" />
                      上下文较长
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  {/* Category badges */}
                  {Object.entries(selectedByCategory).map(([cat, nodes]) => (
                    <Badge
                      key={cat}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-5 gap-1"
                    >
                      <span>{CATEGORY_EMOJI[cat as CategoryType]}</span>
                      <span>{CATEGORY_LABEL[cat as CategoryType]}</span>
                      <span>{nodes!.length}</span>
                    </Badge>
                  ))}
                  {contextPreviewOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronUp className="h-3 w-3" />
                  )}
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-3">
                <div className="rounded-lg border bg-background p-3 text-xs text-muted-foreground max-h-40 overflow-y-auto">
                  <pre className="whitespace-pre-wrap break-words">
                    {formattedContext.length > 500
                      ? formattedContentPreview(formattedContext)
                      : formattedContext}
                  </pre>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  上下文长度：{contextLength} 字符
                  {contextWarning && " · 建议减少选择项以提高响应质量"}
                </p>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      {/* ================================================================= */}
      {/* Input Area                                                        */}
      {/* ================================================================= */}
      <div className="border-t px-4 py-3">
        {/* Chat Prompt Quick Bar - attached above input */}
        {messages.length > 0 && !isLoading && (
          <ChatPromptBar onQuickAction={handleQuickAction} />
        )}

        <div className="flex items-end gap-2">
          {/* Mic button */}
          <div className="relative">
            {micState === "recording" && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
            )}
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-9 w-9 shrink-0",
                micState === "recording" && "bg-red-50 border-red-300 text-red-600 hover:bg-red-100 hover:text-red-700",
                micState === "processing" && "opacity-50"
              )}
              onClick={() => {
                if (micState === "idle") startRecording();
                else if (micState === "recording") stopRecording();
              }}
              disabled={micState === "processing"}
              title={micState === "recording" ? "停止录音" : "语音输入"}
            >
              {micState === "recording" ? (
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <MicOff className="h-4 w-4" />
                </div>
              ) : micState === "processing" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Recording timer */}
          {micState === "recording" && (
            <span className="text-xs text-red-600 shrink-0">
              {formatRecordingTime(recordingTime)}
            </span>
          )}

          {/* Textarea + controls */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="输入消息，按 Enter 发送..."
              className="min-h-[40px] max-h-[180px] resize-none pr-20 text-sm"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="absolute bottom-1.5 right-2 flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">
                {inputValue.length}字 · ~{estimatedTokens}token
              </span>
              {isLoading ? (
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleStop}
                  title="停止生成"
                >
                  <StopCircle className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim()}
                  title="发送消息"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* Clear Chat Confirmation AlertDialog                                */}
      {/* ================================================================= */}
      <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认清除聊天记录</AlertDialogTitle>
            <AlertDialogDescription>
              确定要清除当前会话的所有聊天记录吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClear}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              清除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ================================================================= */}
      {/* Keyboard Shortcuts Dialog                                         */}
      {/* ================================================================= */}
      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5 text-primary" />
              键盘快捷键
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {[
              { key: "Enter", desc: "发送消息" },
              { key: "Shift + Enter", desc: "换行" },
              { key: "Escape", desc: "停止生成 / 取消焦点" },
              { key: "?", desc: "显示快捷键" },
            ].map((shortcut) => (
              <div key={shortcut.key} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-muted-foreground">{shortcut.desc}</span>
                <kbd className="rounded border bg-muted px-2 py-0.5 text-xs font-mono">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper: preview first 500 chars of formatted context
// ---------------------------------------------------------------------------

function formattedContentPreview(text: string): string {
  return text.slice(0, 500) + "\n\n... (内容过长，已截断显示)";
}
