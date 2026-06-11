"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useChatStore } from "@/lib/chat-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Stethoscope,
  Brain,
  BookOpen,
  Sparkles,
  Settings,
  ChevronDown,
  Save,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Preset System Prompts
// ---------------------------------------------------------------------------

interface PromptPreset {
  id: string;
  label: string;
  icon: React.ElementType;
  prompt: string;
}

const PROMPT_PRESETS: PromptPreset[] = [
  {
    id: "general",
    label: "通用医疗助手",
    icon: Stethoscope,
    prompt: `你是一位专业的医疗AI助手，专注于病历数据的分析与解读。你的职责包括：

1. **病历数据解读**：根据用户选中的病历数据（包括基本信息、检查记录、检验报告、诊断记录、手术记录和病历文书），提供专业、准确的解读和分析。

2. **异常指标提示**：识别检验报告中的异常指标（标记为↑或↓的项目），解释其临床意义及可能的关联疾病。

3. **诊断关联分析**：分析患者各项诊断之间的关联性，评估疾病的严重程度和进展风险。

4. **诊疗建议**：基于患者的完整病历信息，提供合理的诊疗建议，但需明确说明仅供参考，不能替代医生的临床判断。

5. **病情总结**：对患者的整体病情进行系统性总结，突出关键问题。

请注意：
- 始终以专业、严谨的态度回答问题
- 明确标注AI分析的局限性，提醒用户及时就医
- 使用中文回答所有问题
- 当病历数据不完整时，主动提示补充信息的重要性`,
  },
  {
    id: "specialist",
    label: "专科诊断顾问",
    icon: Brain,
    prompt: `你是一位资深的专科诊断顾问AI，擅长深入分析复杂病例，提供专科级别的诊断意见。你的职责包括：

1. **深度诊断分析**：基于患者的完整病历数据，进行深入的鉴别诊断分析，列出可能的诊断及依据。

2. **专科评估**：针对特定系统疾病（如心血管、内分泌、肾脏等），提供专科评估意见。

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
    prompt: `你是一位医学教育导师AI，擅长以教学的方式解读病历，帮助医学生和住院医师学习临床思维。你的职责包括：

1. **病例教学**：以教学的方式解读患者病历，帮助学习者理解疾病的发生发展过程。

2. **临床思维示范**：展示系统的临床思维过程，包括病史采集要点、鉴别诊断思路、检查选择依据。

3. **知识点链接**：将病历中的具体表现与医学基础知识（病理生理、药理等）进行关联讲解。

4. **提问引导**：通过提问引导学习者主动思考，培养临床推理能力。

5. **循证解读**：引用指南和文献依据，讲解诊疗决策的证据基础。

请注意：
- 语言通俗易懂，适合医学学习者
- 鼓励互动式学习
- 使用中文回答所有问题`,
  },
  {
    id: "research",
    label: "科研分析助手",
    icon: Sparkles,
    prompt: `你是一位科研分析助手AI，擅长从病历数据中提取科研价值，辅助临床研究。你的职责包括：

1. **数据结构化**：将非结构化的病历文本转换为结构化的科研数据格式。

2. **变量识别**：从病历中识别可用于科研分析的变量，包括人口学特征、临床指标、治疗方案和结局。

3. **文献关联**：将病例特点与已有研究文献进行关联，识别研究空白和创新点。

4. **统计分析建议**：根据研究问题类型，推荐合适的统计分析方法。

5. **研究设计辅助**：基于病例特点，协助设计临床研究方案。

请注意：
- 注重数据的准确性和完整性
- 区分临床实践与科研用途
- 使用中文回答所有问题`,
  },
];

// Default system prompt is the first preset
const DEFAULT_PROMPT = PROMPT_PRESETS[0].prompt;

function findPresetId(prompt: string): string | null {
  for (const preset of PROMPT_PRESETS) {
    if (prompt === preset.prompt) return preset.id;
  }
  return null;
}

export function SystemPromptPanel() {
  const systemPrompt = useChatStore((s) => s.systemPrompt);
  const setSystemPrompt = useChatStore((s) => s.setSystemPrompt);

  const [expanded, setExpanded] = useState(false);
  const [editValue, setEditValue] = useState(systemPrompt);

  // Derive activePresetId from the store's systemPrompt
  const activePresetId = useMemo(() => findPresetId(systemPrompt), [systemPrompt]);

  // Determine if prompt has been modified from default
  const isModified = editValue !== DEFAULT_PROMPT && editValue !== systemPrompt;
  const isCustomized = activePresetId === null && systemPrompt !== DEFAULT_PROMPT;

  const handleSelectPreset = useCallback(
    (preset: PromptPreset) => {
      setEditValue(preset.prompt);
      setSystemPrompt(preset.prompt);
      toast.success(`已切换至「${preset.label}」模式`);
    },
    [setSystemPrompt]
  );

  const handleSave = useCallback(() => {
    if (!editValue.trim()) {
      toast.error("系统提示词不能为空");
      return;
    }
    setSystemPrompt(editValue.trim());
    toast.success("系统提示词已保存");
  }, [editValue, setSystemPrompt]);

  const handleReset = useCallback(() => {
    setEditValue(DEFAULT_PROMPT);
    setSystemPrompt(DEFAULT_PROMPT);
    toast.success("已恢复默认设置");
  }, [setSystemPrompt]);

  // Badge text
  const badgeText = activePresetId
    ? PROMPT_PRESETS.find((p) => p.id === activePresetId)?.label
    : "已自定义";

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        <span className="flex items-center gap-2">
          <Settings
            className={cn(
              "h-4 w-4 transition-colors",
              isCustomized || isModified ? "text-amber-500" : "text-muted-foreground"
            )}
          />
          系统提示词
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] px-1.5 py-0",
              isCustomized && "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
            )}
          >
            {badgeText}
          </Badge>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2 space-y-3">
        {/* Preset Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {PROMPT_PRESETS.map((preset) => {
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

        {/* Custom Prompt Textarea */}
        <div className="space-y-2">
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={6}
            className="resize-none text-xs leading-relaxed"
            placeholder="输入自定义系统提示词..."
          />
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-7 gap-1 text-xs" onClick={handleSave}>
              <Save className="h-3 w-3" />
              保存
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={handleReset}
            >
              <RotateCcw className="h-3 w-3" />
              重置
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
