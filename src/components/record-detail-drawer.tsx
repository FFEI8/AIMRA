"use client";

import { useMemo, useState, useCallback } from "react";
import {
  User,
  Stethoscope,
  FlaskConical,
  ClipboardList,
  Syringe,
  FileText,
  ArrowUp,
  ArrowDown,
  Calendar,
  UserCircle,
  Check,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/chat-store";
import {
  type TreeNode,
  type CategoryType,
  type PatientBasicInfo,
  type ExamRecord,
  type LabReport,
  type DiagnosisRecord,
  type SurgeryRecord,
  type EmrRecord,
  buildPatientTree,
  allPatients,
} from "@/lib/patient-data";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Category config (same as patient-tree)
// ---------------------------------------------------------------------------

const CATEGORY_CONFIG: Record<
  CategoryType,
  {
    icon: typeof User;
    label: string;
    color: string;
    gradient: string;
    headerBg: string;
  }
> = {
  basicInfo: {
    icon: User,
    label: "基本信息",
    color: "text-teal-600",
    gradient: "from-teal-500 to-teal-600",
    headerBg: "bg-teal-50",
  },
  exam: {
    icon: Stethoscope,
    label: "检查记录",
    color: "text-amber-600",
    gradient: "from-amber-500 to-amber-600",
    headerBg: "bg-amber-50",
  },
  lab: {
    icon: FlaskConical,
    label: "检验记录",
    color: "text-rose-600",
    gradient: "from-rose-500 to-rose-600",
    headerBg: "bg-rose-50",
  },
  diagnosis: {
    icon: ClipboardList,
    label: "诊断记录",
    color: "text-purple-600",
    gradient: "from-purple-500 to-purple-600",
    headerBg: "bg-purple-50",
  },
  surgery: {
    icon: Syringe,
    label: "手术记录",
    color: "text-orange-600",
    gradient: "from-orange-500 to-orange-600",
    headerBg: "bg-orange-50",
  },
  emr: {
    icon: FileText,
    label: "病历文书",
    color: "text-cyan-600",
    gradient: "from-cyan-500 to-cyan-600",
    headerBg: "bg-cyan-50",
  },
};

// ---------------------------------------------------------------------------
// Find node by id
// ---------------------------------------------------------------------------

function findNodeById(root: TreeNode, id: string): TreeNode | null {
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Detail views
// ---------------------------------------------------------------------------

function ExamDetailView({ data }: { data: ExamRecord }) {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{data.name}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="size-3.5" />
        <span>{data.date}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">结论：</span>
        <Badge
          variant={data.conclusion === "阳性" ? "destructive" : "default"}
          className={cn(
            data.conclusion === "阴性" && "bg-green-100 text-green-700 border-green-200"
          )}
        >
          {data.conclusion}
        </Badge>
      </div>
      <div className="space-y-1">
        <span className="text-sm text-muted-foreground">检查发现：</span>
        <p className="text-sm leading-relaxed bg-muted/50 rounded-md p-3">
          {data.findings}
        </p>
      </div>
    </div>
  );
}

function LabDetailView({ data, onAddItem }: { data: LabReport; onAddItem?: (itemName: string) => void }) {
  const abnormalCount = data.items.filter(
    (i) => i.flag === "H" || i.flag === "L"
  ).length;

  // Track which items are selected for individual add
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  const toggleItem = useCallback((idx: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const addSelectedItems = useCallback(() => {
    if (onAddItem && selectedItems.size > 0) {
      const itemNames = Array.from(selectedItems).map(i => data.items[i].name);
      onAddItem(itemNames.join("、"));
      setSelectedItems(new Set());
    }
  }, [onAddItem, selectedItems, data.items]);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{data.name}</span>
        <span className="text-xs text-muted-foreground">{data.date}</span>
      </div>

      {abnormalCount > 0 && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
          <FlaskConical className="size-3.5 text-rose-500" />
          <span className="text-xs text-rose-600 font-medium">
            发现 {abnormalCount} 项异常指标
          </span>
        </div>
      )}

      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50 border-b">
              {onAddItem && (
                <th className="text-center px-2 py-2 font-medium w-8">选择</th>
              )}
              <th className="text-left px-3 py-2 font-medium">项目名称</th>
              <th className="text-center px-3 py-2 font-medium">结果</th>
              <th className="text-center px-3 py-2 font-medium">单位</th>
              <th className="text-center px-3 py-2 font-medium">参考范围</th>
              <th className="text-center px-3 py-2 font-medium">标志</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => (
              <tr
                key={idx}
                className={cn(
                  "border-b last:border-b-0 cursor-pointer transition-colors",
                  idx % 2 === 0 ? "bg-background" : "bg-muted/20",
                  (item.flag === "H" || item.flag === "L") && "bg-rose-50/50",
                  selectedItems.has(idx) && "bg-primary/5 ring-1 ring-inset ring-primary/30"
                )}
                onClick={() => onAddItem && toggleItem(idx)}
              >
                {onAddItem && (
                  <td className="px-2 py-2 text-center">
                    <div className={cn(
                      "mx-auto size-4 rounded border flex items-center justify-center transition-colors",
                      selectedItems.has(idx)
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                    )}>
                      {selectedItems.has(idx) && <Check className="size-3" />}
                    </div>
                  </td>
                )}
                <td className="px-3 py-2 font-medium">{item.name}</td>
                <td
                  className={cn(
                    "px-3 py-2 text-center",
                    item.flag === "H" && "text-rose-600 font-bold",
                    item.flag === "L" && "text-amber-600 font-bold"
                  )}
                >
                  {item.result}
                </td>
                <td className="px-3 py-2 text-center text-muted-foreground">
                  {item.unit}
                </td>
                <td className="px-3 py-2 text-center text-muted-foreground">
                  {item.reference_range}
                </td>
                <td className="px-3 py-2 text-center">
                  {item.flag === "H" && (
                    <span className="inline-flex items-center gap-0.5 text-rose-600 font-bold">
                      <ArrowUp className="size-3" />↑
                    </span>
                  )}
                  {item.flag === "L" && (
                    <span className="inline-flex items-center gap-0.5 text-amber-600 font-bold">
                      <ArrowDown className="size-3" />↓
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add selected items button */}
      {onAddItem && selectedItems.size > 0 && (
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-md px-3 py-2">
          <span className="text-xs text-primary font-medium">
            已选择 {selectedItems.size} 项
          </span>
          <Button size="sm" className="h-7 text-xs" onClick={addSelectedItems}>
            添加选中项到上下文
          </Button>
        </div>
      )}
    </div>
  );
}

function DiagnosisDetailView({ data }: { data: DiagnosisRecord }) {
  // Classify disease by ICD code prefix
  function getClassification(code: string): { label: string; color: string } {
    const prefix = code.charAt(0);
    switch (prefix) {
      case "A":
      case "B":
        return { label: "感染性疾病", color: "bg-red-100 text-red-700" };
      case "C":
        return { label: "肿瘤", color: "bg-red-100 text-red-700" };
      case "D":
        return { label: "血液疾病", color: "bg-amber-100 text-amber-700" };
      case "E":
        return { label: "内分泌/代谢", color: "bg-purple-100 text-purple-700" };
      case "I":
        return { label: "循环系统", color: "bg-rose-100 text-rose-700" };
      case "J":
        return { label: "呼吸系统", color: "bg-sky-100 text-sky-700" };
      case "K":
        return { label: "消化系统", color: "bg-amber-100 text-amber-700" };
      case "N":
        return { label: "泌尿系统", color: "bg-teal-100 text-teal-700" };
      case "R":
        return { label: "症状/体征", color: "bg-gray-100 text-gray-700" };
      default:
        return { label: "其他", color: "bg-gray-100 text-gray-700" };
    }
  }

  const classification = getClassification(data.icd_code);

  return (
    <div className="space-y-4 p-4">
      <div className="text-sm font-medium">{data.name}</div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">ICD编码：</span>
        <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">
          {data.icd_code}
        </code>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">疾病分类：</span>
        <Badge variant="outline" className={classification.color}>
          {classification.label}
        </Badge>
      </div>
    </div>
  );
}

function SurgeryDetailView({ data }: { data: SurgeryRecord }) {
  return (
    <div className="space-y-4 p-4">
      <div className="text-sm font-medium">{data.name}</div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">手术代码</span>
          <p className="text-sm font-mono">{data.code}</p>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">手术日期</span>
          <div className="flex items-center gap-1.5 text-sm">
            <Calendar className="size-3.5 text-muted-foreground" />
            {data.date}
          </div>
        </div>
        <div className="col-span-2 space-y-1">
          <span className="text-xs text-muted-foreground">主刀医生</span>
          <div className="flex items-center gap-1.5 text-sm">
            <UserCircle className="size-3.5 text-muted-foreground" />
            {data.surgeon}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmrDetailView({ data }: { data: EmrRecord }) {
  // Split content into paragraphs by newlines or numbered items
  const paragraphs = data.content
    .split(/\n/)
    .filter(Boolean)
    .flatMap((p) => {
      // Try to split by numbered items like "1." "2." etc.
      const parts = p.split(/(?=\d+\.)/);
      return parts.filter(Boolean);
    });

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{data.title}</span>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="size-3" />
          {data.date}
        </div>
        <div className="flex items-center gap-1.5">
          <UserCircle className="size-3" />
          {data.doctor}
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        {paragraphs.map((p, idx) => (
          <p key={idx} className="text-sm leading-relaxed">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}

function BasicInfoDetailView({ data }: { data: PatientBasicInfo }) {
  // Calculate hospital stay duration
  const admissionDate = new Date(data.admission_date);
  const now = new Date();
  const diffDays = Math.max(
    1,
    Math.ceil(
      (now.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const fields = [
    { label: "姓名", value: data.name },
    { label: "性别", value: data.gender },
    { label: "年龄", value: `${data.age}岁` },
    { label: "住院号", value: data.patient_no },
    { label: "入院日期", value: data.admission_date },
    { label: "科室", value: data.department },
    { label: "床号", value: data.bed_no },
    { label: "主治医师", value: data.attending_doctor },
  ];

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {fields.map((f) => (
          <div key={f.label} className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground">{f.label}</span>
            <p className="text-sm font-medium">{f.value}</p>
          </div>
        ))}
      </div>
      <Separator />
      <div className="space-y-1">
        <span className="text-[11px] text-muted-foreground">主诉</span>
        <p className="text-sm leading-relaxed">{data.chief_complaint}</p>
      </div>
      <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-md px-3 py-2">
        <Calendar className="size-3.5 text-teal-600" />
        <span className="text-xs text-teal-700 font-medium">
          住院天数：{diffDays} 天
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function RecordDetailDrawer() {
  const previewNodeId = useChatStore((s) => s.previewNodeId);
  const setPreviewNodeId = useChatStore((s) => s.setPreviewNodeId);
  const selectedNodeIds = useChatStore((s) => s.selectedNodeIds);
  const toggleNodeSelection = useChatStore((s) => s.toggleNodeSelection);
  const currentPatientId = useChatStore((s) => s.currentPatientId);

  // Build the current patient tree to find the node
  const currentNode = useMemo(() => {
    if (!previewNodeId) return null;
    // Fallback to first patient if currentPatientId is null (same logic as page.tsx)
    const patientId = currentPatientId || allPatients[0]?.id;
    if (!patientId) return null;
    const patient = allPatients.find((p) => p.id === patientId);
    if (!patient) return null;
    const tree = buildPatientTree(patient);
    return findNodeById(tree, previewNodeId);
  }, [previewNodeId, currentPatientId]);

  const open = previewNodeId !== null;

  const config = currentNode
    ? CATEGORY_CONFIG[currentNode.category]
    : CATEGORY_CONFIG.basicInfo;

  const IconComp = config.icon;

  const isAlreadySelected = currentNode
    ? currentNode.isLeaf && selectedNodeIds.has(currentNode.id)
    : false;

  const handleClose = () => {
    setPreviewNodeId(null);
  };

  const handleAddToContext = () => {
    if (currentNode?.isLeaf) {
      toggleNodeSelection(currentNode.id);
      toast.success("已添加到对话上下文");
    }
  };

  // Handler for adding individual lab items to context
  const handleAddLabItem = useCallback((itemNames: string) => {
    if (currentNode?.isLeaf) {
      // If the whole node is not yet selected, select it first
      if (!selectedNodeIds.has(currentNode.id)) {
        toggleNodeSelection(currentNode.id);
      }
      toast.success(`已添加细项「${itemNames}」到对话上下文`);
    }
  }, [currentNode, selectedNodeIds, toggleNodeSelection]);

  // Render detail based on category
  function renderDetail() {
    if (!currentNode?.isLeaf || !currentNode.data) {
      return (
        <div className="p-4 text-sm text-muted-foreground">
          选择一条记录查看详情
        </div>
      );
    }

    switch (currentNode.category) {
      case "basicInfo":
        return <BasicInfoDetailView data={currentNode.data as PatientBasicInfo} />;
      case "exam":
        return <ExamDetailView data={currentNode.data as ExamRecord} />;
      case "lab":
        return <LabDetailView data={currentNode.data as LabReport} onAddItem={handleAddLabItem} />;
      case "diagnosis":
        return <DiagnosisDetailView data={currentNode.data as DiagnosisRecord} />;
      case "surgery":
        return <SurgeryDetailView data={currentNode.data as SurgeryRecord} />;
      case "emr":
        return <EmrDetailView data={currentNode.data as EmrRecord} />;
      default:
        return null;
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 flex flex-col"
      >
        {/* Always render SheetTitle for accessibility */}
        <SheetHeader className="sr-only">
          <SheetTitle>{currentNode ? config.label : "记录详情"}</SheetTitle>
          <SheetDescription>查看病历记录详情</SheetDescription>
        </SheetHeader>
        {/* Header with category gradient */}
        {currentNode && (
          <div
            className={cn(
              "bg-gradient-to-r px-4 py-3 text-white",
              config.gradient
            )}
          >
            <div>
              <p className="flex items-center gap-2 text-base font-semibold text-white">
                <IconComp className="size-5" />
                <span>{config.label}</span>
              </p>
              <p className="text-white/80 text-sm mt-0.5">
                {currentNode.label}
              </p>
            </div>
          </div>
        )}

        {/* Detail content */}
        <ScrollArea className="flex-1">{renderDetail()}</ScrollArea>

        {/* Footer */}
        <SheetFooter className="border-t px-4 py-3 flex-row gap-2 sm:justify-end">
          <Button variant="outline" size="sm" onClick={handleClose}>
            关闭
          </Button>
          <Button
            size="sm"
            onClick={handleAddToContext}
            disabled={isAlreadySelected}
            className={cn(
              isAlreadySelected && "opacity-50 cursor-not-allowed"
            )}
          >
            {isAlreadySelected ? "已添加" : "添加到对话上下文"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
