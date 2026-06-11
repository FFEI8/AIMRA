"use client";

import React, { useState, useCallback } from "react";
import {
  useChatStore,
  ModelConfig,
  ModelProvider,
  MODEL_PRESETS,
  getProviderLabel,
  getModelDisplayInfo,
} from "@/lib/chat-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
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
  Settings2,
  RotateCcw,
  Save,
} from "lucide-react";
import { toast } from "sonner";

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
    description: "使用内置 AI 模型（z-ai-web-dev-sdk）",
    icon: Sparkles,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
  },
  {
    provider: "deepseek",
    label: "DeepSeek",
    description: "DeepSeek 深度求索大模型",
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
    description: "自定义 OpenAI 兼容 API 接口",
    icon: Server,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
];

// ---------------------------------------------------------------------------
// Endpoint placeholders per provider
// ---------------------------------------------------------------------------

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
// Component
// ---------------------------------------------------------------------------

export function ModelConfigPanel() {
  const modelConfig = useChatStore((s) => s.modelConfig);
  const setModelConfig = useChatStore((s) => s.setModelConfig);

  const [isOpen, setIsOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testError, setTestError] = useState("");

  // Local draft config for editing before saving
  const [draftConfig, setDraftConfig] = useState<ModelConfig>(modelConfig);

  const handleProviderSelect = useCallback(
    (provider: ModelProvider) => {
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
    },
    []
  );

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
        toast.error("连接测试失败");
      }
    } catch (err) {
      setTestStatus("error");
      setTestError(err instanceof Error ? err.message : "网络请求失败");
      toast.error("连接测试失败");
    }
  }, [draftConfig]);

  const displayInfo = getModelDisplayInfo(modelConfig);
  const isNonDefault = modelConfig.provider !== "default";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between gap-2 px-3 text-left font-normal"
        >
          <span className="flex items-center gap-2">
            <Settings2
              className={cn(
                "h-4 w-4 shrink-0",
                isNonDefault ? "text-amber-500" : "text-muted-foreground"
              )}
            />
            <span className="text-sm">模型配置</span>
          </span>
          <span className="flex items-center gap-2">
            {isNonDefault ? (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                {displayInfo}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                默认
              </Badge>
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </span>
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2 space-y-3 px-1">
        {/* Provider Selection Grid */}
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
                  "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all duration-200 cursor-pointer text-center",
                  isActive
                    ? `${card.borderColor} ${card.bgColor} shadow-sm`
                    : "border-border hover:border-muted-foreground/30 hover:bg-accent/50"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    isActive ? card.bgColor : "bg-muted"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? card.color : "text-muted-foreground")} />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium leading-tight",
                    isActive ? card.color : "text-foreground/80"
                  )}
                >
                  {card.label}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                  {card.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Configuration Fields (when non-default) */}
        {draftConfig.provider !== "default" && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
            {/* API Endpoint */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                API Endpoint
              </Label>
              <Input
                value={draftConfig.endpoint}
                onChange={(e) =>
                  setDraftConfig((prev) => ({ ...prev, endpoint: e.target.value }))
                }
                placeholder={ENDPOINT_PLACEHOLDERS[draftConfig.provider]}
                className="h-8 text-xs"
              />
            </div>

            {/* API Key */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                API Key
              </Label>
              <div className="relative">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={draftConfig.apiKey}
                  onChange={(e) =>
                    setDraftConfig((prev) => ({ ...prev, apiKey: e.target.value }))
                  }
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
                  {showApiKey ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Model Name */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                Model Name
              </Label>
              <Input
                value={draftConfig.model}
                onChange={(e) =>
                  setDraftConfig((prev) => ({ ...prev, model: e.target.value }))
                }
                placeholder={MODEL_PLACEHOLDERS[draftConfig.provider]}
                className="h-8 text-xs"
              />
            </div>

            {/* Max Tokens */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                Max Tokens
              </Label>
              <Input
                type="number"
                value={draftConfig.maxTokens}
                onChange={(e) =>
                  setDraftConfig((prev) => ({
                    ...prev,
                    maxTokens: parseInt(e.target.value, 10) || 4096,
                  }))
                }
                min={1}
                max={32768}
                className="h-8 text-xs"
              />
            </div>

            {/* Security Note */}
            <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-2">
              <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-tight">
                密钥仅存储在本地浏览器中，不会上传到服务器
              </p>
            </div>

            {/* Test Connection */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={handleTestConnection}
                disabled={testStatus === "testing"}
              >
                {testStatus === "testing" ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    测试中...
                  </>
                ) : (
                  "测试连接"
                )}
              </Button>

              {testStatus === "success" && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  连接成功
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

        {/* Save / Reset Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-7 text-xs gap-1.5 flex-1"
            onClick={handleSave}
          >
            <Save className="h-3.5 w-3.5" />
            保存配置
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={handleReset}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            重置
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
