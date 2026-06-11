"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  useChatStore,
  ModelConfig,
  ModelProvider,
  MODEL_PRESETS,
  getProviderLabel,
  getModelDisplayInfo,
  BUILTIN_CHAT_PROMPTS,
} from "@/lib/chat-store";
import type { ChatPrompt } from "@/lib/chat-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Settings,
  Stethoscope,
  Brain,
  BookOpen,
  Sparkles,
  Bot,
  Globe,
  Server,
  KeyRound,
  Cpu,
  Eye,
  EyeOff,
  ChevronDown,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Save,
  Plus,
  Trash2,
  Pencil,
  MessageSquare,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// System Prompt Presets
// ---------------------------------------------------------------------------

interface PromptPreset {
  id: string;
  label: string;
  icon: React.ElementType;
  prompt: string;
}

const SYSTEM_PROMPT_PRESETS: PromptPreset[] = [
  {
    id: "general",
    label: "通用医疗助手",
    icon: Stethoscope,
    prompt: `你是一位专业的医疗AI助手，专注于病历数据的分析与解读。你的职责包括：

1. **病历数据解读**：根据用户选中的病历数据，提供专业、准确的解读和分析。
2. **异常指标提示**：识别检验报告中的异常指标，解释其临床意义及可能的关联疾病。
3. **诊断关联分析**：分析患者各项诊断之间的关联性，评估疾病的严重程度和进展风险。
4. **诊疗建议**：基于患者的完整病历信息，提供合理的诊疗建议，但需明确说明仅供参考。
5. **病情总结**：对患者的整体病情进行系统性总结，突出关键问题。

请注意：
- 始终以专业、严谨的态度回答问题
- 明确标注AI分析的局限性，提醒用户及时就医
- 使用中文回答所有问题`,
  },
  {
    id: "specialist",
    label: "专科诊断顾问",
    icon: Brain,
    prompt: `你是一位资深的专科诊断顾问AI，擅长深入分析复杂病例，提供专科级别的诊断意见。你的职责包括：

1. **深度诊断分析**：基于患者的完整病历数据，进行深入的鉴别诊断分析。
2. **专科评估**：针对特定系统疾病，提供专科评估意见。
3. **检查建议**：根据现有检查结果的疑点，推荐进一步的专科检查方案。
4. **风险分层**：对患者的疾病风险进行分层评估，识别高危因素。
5. **治疗方案优化**：在现有治疗方案基础上，提出优化建议和替代方案。

请注意：
- 分析需有循证医学依据
- 区分确定诊断与疑似诊断
- 对不确定性保持诚实
- 使用中文回答所有问题`,
  },
  {
    id: "educator",
    label: "医学教育导师",
    icon: BookOpen,
    prompt: `你是一位医学教育导师AI，擅长以教学的方式解读病历，帮助医学生和住院医师学习临床思维。

1. **病例教学**：以教学的方式解读患者病历，帮助学习者理解疾病的发生发展过程。
2. **临床思维示范**：展示系统的临床思维过程。
3. **知识点链接**：将病历中的具体表现与医学基础知识进行关联讲解。
4. **提问引导**：通过提问引导学习者主动思考。
5. **循证解读**：引用指南和文献依据，讲解诊疗决策的证据基础。

请注意：语言通俗易懂，鼓励互动式学习，使用中文回答所有问题。`,
  },
  {
    id: "research",
    label: "科研分析助手",
    icon: Sparkles,
    prompt: `你是一位科研分析助手AI，擅长从病历数据中提取科研价值，辅助临床研究。

1. **数据结构化**：将非结构化的病历文本转换为结构化的科研数据格式。
2. **变量识别**：从病历中识别可用于科研分析的变量。
3. **文献关联**：将病例特点与已有研究文献进行关联。
4. **统计分析建议**：根据研究问题类型，推荐合适的统计分析方法。
5. **研究设计辅助**：基于病例特点，协助设计临床研究方案。

请注意：注重数据的准确性和完整性，区分临床实践与科研用途，使用中文回答所有问题。`,
  },
];

// ---------------------------------------------------------------------------
// Provider Card Config
// ---------------------------------------------------------------------------

interface ProviderCardConfig {
  provider: ModelProvider;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const PROVIDER_CARDS: ProviderCardConfig[] = [
  {
    provider: "default",
    label: "默认模型",
    description: "使用内置 AI 模型",
    icon: Sparkles,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
  },
  {
    provider: "deepseek",
    label: "DeepSeek",
    description: "DeepSeek 深度求索",
    icon: Bot,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    provider: "dashscope",
    label: "阿里云百炼",
    description: "阿里云百炼平台",
    icon: Globe,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  {
    provider: "custom",
    label: "自定义模型",
    description: "OpenAI 兼容 API",
    icon: Server,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
];

const ENDPOINT_PLACEHOLDERS: Record<ModelProvider, string> = {
  default: "",
  deepseek: "https://api.deepseek.com/v1/chat/completions",
  dashscope: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  custom: "https://api.example.com/v1/chat/completions",
};

const MODEL_PLACEHOLDERS: Record<ModelProvider, string> = {
  default: "",
  deepseek: "deepseek-chat",
  dashscope: "qwen-plus",
  custom: "gpt-3.5-turbo",
};

// ---------------------------------------------------------------------------
// Settings Dropdown
// ---------------------------------------------------------------------------

export function SettingsDropdown() {
  const [activeDialog, setActiveDialog] = useState<"system" | "model" | "chat" | null>(null);

  const modelConfig = useChatStore((s) => s.modelConfig);
  const isNonDefault = modelConfig.provider !== "default";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className={cn("h-4 w-4", isNonDefault && "text-amber-500")} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-xs text-muted-foreground">配置</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setActiveDialog("system")} className="gap-2 cursor-pointer">
            <Stethoscope className="h-4 w-4 text-teal-500" />
            <span>系统提示词</span>
            <Badge variant="outline" className="ml-auto text-[9px] px-1 py-0 h-4">Prompt</Badge>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveDialog("model")} className="gap-2 cursor-pointer">
            <Cpu className="h-4 w-4 text-purple-500" />
            <span>模型配置</span>
            {isNonDefault ? (
              <Badge variant="secondary" className="ml-auto text-[9px] px-1 py-0 h-4">
                {getProviderLabel(modelConfig.provider)}
              </Badge>
            ) : (
              <Badge variant="outline" className="ml-auto text-[9px] px-1 py-0 h-4">默认</Badge>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveDialog("chat")} className="gap-2 cursor-pointer">
            <MessageSquare className="h-4 w-4 text-emerald-500" />
            <span>对话提示词</span>
            <Badge variant="outline" className="ml-auto text-[9px] px-1 py-0 h-4">
              {BUILTIN_CHAT_PROMPTS.length}
            </Badge>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* System Prompt Dialog */}
      <SystemPromptDialog open={activeDialog === "system"} onOpenChange={(open) => !open && setActiveDialog(null)} />

      {/* Model Config Dialog */}
      <ModelConfigDialog open={activeDialog === "model"} onOpenChange={(open) => !open && setActiveDialog(null)} />

      {/* Chat Prompts Dialog */}
      <ChatPromptsDialog open={activeDialog === "chat"} onOpenChange={(open) => !open && setActiveDialog(null)} />
    </>
  );
}

// ---------------------------------------------------------------------------
// System Prompt Dialog
// ---------------------------------------------------------------------------

function SystemPromptDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const systemPrompt = useChatStore((s) => s.systemPrompt);
  const setSystemPrompt = useChatStore((s) => s.setSystemPrompt);
  const [editValue, setEditValue] = useState(systemPrompt);

  const handleOpen = useCallback((isOpen: boolean) => {
    if (isOpen) {
      setEditValue(systemPrompt);
    }
    onOpenChange(isOpen);
  }, [systemPrompt, onOpenChange]);

  const activePresetId = SYSTEM_PROMPT_PRESETS.find((p) => p.prompt === systemPrompt)?.id ?? null;
  const isCustomized = !activePresetId;

  const handleSelectPreset = useCallback((preset: PromptPreset) => {
    setEditValue(preset.prompt);
    setSystemPrompt(preset.prompt);
    toast.success(`已切换至「${preset.label}」模式`);
  }, [setSystemPrompt]);

  const handleSave = useCallback(() => {
    if (!editValue.trim()) {
      toast.error("系统提示词不能为空");
      return;
    }
    setSystemPrompt(editValue.trim());
    toast.success("系统提示词已保存");
  }, [editValue, setSystemPrompt]);

  const handleReset = useCallback(() => {
    const defaultPrompt = SYSTEM_PROMPT_PRESETS[0].prompt;
    setEditValue(defaultPrompt);
    setSystemPrompt(defaultPrompt);
    toast.success("已恢复默认设置");
  }, [setSystemPrompt]);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-teal-500" />
            系统提示词配置
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Preset selector */}
          <div className="grid grid-cols-2 gap-2">
            {SYSTEM_PROMPT_PRESETS.map((preset) => {
              const Icon = preset.icon;
              const isActive = activePresetId === preset.id;
              return (
                <Button
                  key={preset.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className="h-auto flex flex-col items-center gap-1 py-2 text-xs"
                  onClick={() => handleSelectPreset(preset)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{preset.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Edit area */}
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={8}
            className="resize-none text-xs leading-relaxed"
            placeholder="输入自定义系统提示词..."
          />

          {/* Status badge */}
          <div className="flex items-center justify-between">
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px]",
                isCustomized && "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
              )}
            >
              {isCustomized ? "已自定义" : (SYSTEM_PROMPT_PRESETS.find((p) => p.id === activePresetId)?.label ?? "自定义")}
            </Badge>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={handleReset}>
                <RotateCcw className="h-3 w-3" />
                重置
              </Button>
              <Button size="sm" className="h-7 gap-1 text-xs" onClick={handleSave}>
                <Save className="h-3 w-3" />
                保存
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Model Config Dialog
// ---------------------------------------------------------------------------

function ModelConfigDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const modelConfig = useChatStore((s) => s.modelConfig);
  const setModelConfig = useChatStore((s) => s.setModelConfig);

  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testError, setTestError] = useState("");
  const [draftConfig, setDraftConfig] = useState<ModelConfig>(modelConfig);

  const handleOpen = useCallback((isOpen: boolean) => {
    if (isOpen) {
      setDraftConfig(modelConfig);
      setTestStatus("idle");
      setTestError("");
    }
    onOpenChange(isOpen);
  }, [modelConfig, onOpenChange]);

  const handleProviderSelect = useCallback((provider: ModelProvider) => {
    const preset = MODEL_PRESETS[provider];
    setDraftConfig({
      provider,
      endpoint: preset.endpoint,
      apiKey: preset.apiKey,
      model: preset.model,
      maxTokens: preset.maxTokens,
    });
    setTestStatus("idle");
    setTestError("");
  }, []);

  const handleSave = useCallback(() => {
    setModelConfig(draftConfig);
    toast.success("模型配置已保存", {
      description: `当前使用：${getModelDisplayInfo(draftConfig)}`,
    });
  }, [draftConfig, setModelConfig]);

  const handleReset = useCallback(() => {
    const defaultConfig: ModelConfig = {
      provider: "default",
      ...MODEL_PRESETS.default,
    };
    setDraftConfig(defaultConfig);
    setModelConfig(defaultConfig);
    setTestStatus("idle");
    setTestError("");
    toast.info("已恢复默认配置");
  }, [setModelConfig]);

  const handleTestConnection = useCallback(async () => {
    if (draftConfig.provider === "default") {
      setTestStatus("success");
      return;
    }
    if (!draftConfig.endpoint || !draftConfig.apiKey) {
      setTestStatus("error");
      setTestError("请先填写 API 地址和密钥");
      return;
    }
    setTestStatus("testing");
    setTestError("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "你好，请回复「测试连接成功」",
          modelConfig: {
            provider: draftConfig.provider,
            endpoint: draftConfig.endpoint,
            apiKey: draftConfig.apiKey,
            model: draftConfig.model || "gpt-3.5-turbo",
            max_tokens: 50,
          },
          stream: false,
        }),
      });
      if (response.ok) {
        setTestStatus("success");
        toast.success("连接测试成功");
      } else {
        const data = await response.json().catch(() => ({ error: "未知错误" }));
        setTestStatus("error");
        setTestError(data.error || `HTTP ${response.status}`);
      }
    } catch (err) {
      setTestStatus("error");
      setTestError(err instanceof Error ? err.message : "网络请求失败");
    }
  }, [draftConfig]);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-purple-500" />
            模型配置
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Provider grid */}
          <div className="grid grid-cols-2 gap-2">
            {PROVIDER_CARDS.map((card) => {
              const isActive = draftConfig.provider === card.provider;
              const Icon = card.icon;
              return (
                <button
                  key={card.provider}
                  type="button"
                  onClick={() => handleProviderSelect(card.provider)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all cursor-pointer text-center",
                    isActive
                      ? `${card.borderColor} ${card.bgColor} shadow-sm`
                      : "border-border hover:border-muted-foreground/30 hover:bg-accent/50"
                  )}
                >
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", isActive ? card.bgColor : "bg-muted")}>
                    <Icon className={cn("h-4 w-4", isActive ? card.color : "text-muted-foreground")} />
                  </div>
                  <span className={cn("text-xs font-medium", isActive ? card.color : "text-foreground/80")}>
                    {card.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground line-clamp-1">{card.description}</span>
                </button>
              );
            })}
          </div>

          {/* Config fields for non-default */}
          {draftConfig.provider !== "default" && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  API Endpoint
                </Label>
                <Input
                  value={draftConfig.endpoint}
                  onChange={(e) => setDraftConfig((prev) => ({ ...prev, endpoint: e.target.value }))}
                  placeholder={ENDPOINT_PLACEHOLDERS[draftConfig.provider]}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                  API Key
                </Label>
                <div className="relative">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={draftConfig.apiKey}
                    onChange={(e) => setDraftConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="sk-..."
                    className="h-8 pr-9 text-xs"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0.5 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                  Model Name
                </Label>
                <Input
                  value={draftConfig.model}
                  onChange={(e) => setDraftConfig((prev) => ({ ...prev, model: e.target.value }))}
                  placeholder={MODEL_PLACEHOLDERS[draftConfig.provider]}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                  Max Tokens
                </Label>
                <Input
                  type="number"
                  value={draftConfig.maxTokens}
                  onChange={(e) => setDraftConfig((prev) => ({ ...prev, maxTokens: parseInt(e.target.value, 10) || 4096 }))}
                  min={1}
                  max={32768}
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-2">
                <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-tight">
                  密钥仅存储在本地浏览器中，不会上传到服务器
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={handleTestConnection}
                  disabled={testStatus === "testing"}
                >
                  {testStatus === "testing" ? (
                    <><Loader2 className="h-3 w-3 animate-spin" />测试中...</>
                  ) : "测试连接"}
                </Button>
                {testStatus === "success" && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />连接成功
                  </span>
                )}
                {testStatus === "error" && (
                  <span className="flex items-center gap-1 text-xs text-red-600" title={testError}>
                    <XCircle className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[120px]">{testError}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button size="sm" className="h-7 text-xs gap-1.5 flex-1" onClick={handleSave}>
              <Save className="h-3.5 w-3.5" />保存配置
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5" />重置
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Chat Prompts Dialog
// ---------------------------------------------------------------------------

function ChatPromptsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const chatPrompts = useChatStore((s) => s.chatPrompts);
  const addChatPrompt = useChatStore((s) => s.addChatPrompt);
  const deleteChatPrompt = useChatStore((s) => s.deleteChatPrompt);
  const updateChatPrompt = useChatStore((s) => s.updateChatPrompt);

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("分析");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const categories = useMemo(() => {
    const cats = new Set(chatPrompts.map((p) => p.category));
    return Array.from(cats);
  }, [chatPrompts]);

  const handleAdd = useCallback(() => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("标题和内容不能为空");
      return;
    }
    addChatPrompt({
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
    });
    setNewTitle("");
    setNewContent("");
    setIsAdding(false);
    toast.success("对话提示词已添加");
  }, [newTitle, newContent, newCategory, addChatPrompt]);

  const handleStartEdit = useCallback((prompt: ChatPrompt) => {
    setEditingId(prompt.id);
    setEditTitle(prompt.title);
    setEditContent(prompt.content);
  }, []);

  const handleSaveEdit = useCallback((id: string) => {
    updateChatPrompt(id, { title: editTitle, content: editContent });
    setEditingId(null);
    toast.success("已更新");
  }, [editTitle, editContent, updateChatPrompt]);

  const handleDelete = useCallback((id: string) => {
    deleteChatPrompt(id);
    toast.success("已删除");
  }, [deleteChatPrompt]);

  // Group prompts by category
  const groupedPrompts = useMemo(() => {
    const groups: Record<string, ChatPrompt[]> = {};
    for (const prompt of chatPrompts) {
      if (!groups[prompt.category]) groups[prompt.category] = [];
      groups[prompt.category].push(prompt);
    }
    return groups;
  }, [chatPrompts]);

  const categoryColors: Record<string, string> = {
    "分析": "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
    "诊断": "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
    "治疗": "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    "评估": "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-500" />
              对话提示词
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setIsAdding(!isAdding)}
            >
              <Plus className="h-3 w-3" />
              新增
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new prompt form */}
          {isAdding && (
            <div className="space-y-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
              <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300">新增对话提示词</div>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="提示词标题"
                className="h-8 text-xs"
              />
              <div className="flex gap-2">
                {["分析", "诊断", "治疗", "评估"].map((cat) => (
                  <Button
                    key={cat}
                    variant={newCategory === cat ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => setNewCategory(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="输入提示词内容..."
                rows={3}
                className="resize-none text-xs"
              />
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-xs gap-1" onClick={handleAdd}>
                  <Save className="h-3 w-3" />保存
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsAdding(false)}>
                  取消
                </Button>
              </div>
            </div>
          )}

          {/* Prompts list by category */}
          {Object.entries(groupedPrompts).map(([category, prompts]) => (
            <div key={category} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge className={cn("text-[10px] px-2", categoryColors[category] ?? "bg-gray-100 text-gray-700")}>
                  {category}
                </Badge>
                <span className="text-[10px] text-muted-foreground">{prompts.length} 个提示词</span>
              </div>
              {prompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="group flex items-start gap-2 rounded-lg border p-2.5 hover:bg-accent/30 transition-colors"
                >
                  {editingId === prompt.id ? (
                    <div className="flex-1 space-y-2">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="h-7 text-xs"
                      />
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="resize-none text-xs"
                      />
                      <div className="flex gap-1">
                        <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => handleSaveEdit(prompt.id)}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setEditingId(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{prompt.title}</div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                          {prompt.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!prompt.isBuiltin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleStartEdit(prompt)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                        {!prompt.isBuiltin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-rose-500 hover:text-rose-600"
                            onClick={() => handleDelete(prompt.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Legacy export for backward compatibility (used in page.tsx)
export function ModelConfigPanel() {
  // This is now handled by the settings dropdown, but kept as no-op for compatibility
  return null;
}
