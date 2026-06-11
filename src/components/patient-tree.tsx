"use client";

import { useMemo, useState, useCallback } from "react";
import {
  User,
  Stethoscope,
  FlaskConical,
  ClipboardList,
  Syringe,
  FileText,
  ChevronRight,
  ChevronDown,
  Search,
  Minus,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/chat-store";
import {
  type TreeNode,
  type CategoryType,
  type PatientData,
  type ExamRecord,
  type LabReport,
  getNodeSummary,
} from "@/lib/patient-data";

// ---------------------------------------------------------------------------
// Category config
// ---------------------------------------------------------------------------

const CATEGORY_CONFIG: Record<
  CategoryType,
  { icon: typeof User; label: string; color: string; bg: string; dot: string }
> = {
  basicInfo: {
    icon: User,
    label: "基本信息",
    color: "text-teal-600",
    bg: "bg-teal-50",
    dot: "bg-teal-500",
  },
  exam: {
    icon: Stethoscope,
    label: "检查记录",
    color: "text-amber-600",
    bg: "bg-amber-50",
    dot: "bg-amber-500",
  },
  lab: {
    icon: FlaskConical,
    label: "检验记录",
    color: "text-rose-600",
    bg: "bg-rose-50",
    dot: "bg-rose-500",
  },
  diagnosis: {
    icon: ClipboardList,
    label: "诊断记录",
    color: "text-purple-600",
    bg: "bg-purple-50",
    dot: "bg-purple-500",
  },
  surgery: {
    icon: Syringe,
    label: "手术记录",
    color: "text-orange-600",
    bg: "bg-orange-50",
    dot: "bg-orange-500",
  },
  emr: {
    icon: FileText,
    label: "病历文书",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    dot: "bg-cyan-500",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLeafIds(node: TreeNode): string[] {
  if (node.isLeaf) return [node.id];
  return (node.children ?? []).flatMap(getLeafIds);
}

function hasAbnormalIndicator(node: TreeNode): "abnormal" | "positive" | null {
  if (!node.isLeaf || !node.data) return null;
  if (node.category === "exam") {
    const exam = node.data as ExamRecord;
    if (exam.conclusion === "阳性") return "positive";
  }
  if (node.category === "lab") {
    const report = node.data as LabReport;
    if (report.items.some((i) => i.flag === "H" || i.flag === "L"))
      return "abnormal";
  }
  return null;
}

function filterTree(node: TreeNode, query: string): TreeNode | null {
  const q = query.toLowerCase();
  if (node.label.toLowerCase().includes(q)) return node;
  if (!node.children) return null;
  const filtered = node.children
    .map((c) => filterTree(c, q))
    .filter(Boolean) as TreeNode[];
  if (filtered.length > 0) {
    return { ...node, children: filtered };
  }
  return null;
}

function collectAllNodeIds(node: TreeNode): string[] {
  const ids = [node.id];
  if (node.children) {
    for (const child of node.children) {
      ids.push(...collectAllNodeIds(child));
    }
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PatientTreeProps {
  treeData: TreeNode;
  patients: PatientData[];
  currentPatientId: string;
  onPatientChange: (id: string) => void;
}

// ---------------------------------------------------------------------------
// TreeNodeItem
// ---------------------------------------------------------------------------

interface TreeNodeItemProps {
  node: TreeNode;
  depth: number;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
}

function TreeNodeItem({
  node,
  depth,
  expandedIds,
  toggleExpand,
}: TreeNodeItemProps) {
  const selectedNodeIds = useChatStore((s) => s.selectedNodeIds);
  const toggleNodeSelection = useChatStore((s) => s.toggleNodeSelection);
  const selectAllChildren = useChatStore((s) => s.selectAllChildren);
  const deselectAllChildren = useChatStore((s) => s.deselectAllChildren);
  const setPreviewNodeId = useChatStore((s) => s.setPreviewNodeId);

  const config = CATEGORY_CONFIG[node.category];
  const IconComp = config.icon;
  const isExpanded = expandedIds.has(node.id);
  const leafIds = useMemo(() => getLeafIds(node), [node]);
  const isLeaf = node.isLeaf;
  const isSelected = isLeaf && selectedNodeIds.has(node.id);

  // Checkbox state for non-leaf
  const allSelected =
    !isLeaf && leafIds.length > 0 && leafIds.every((id) => selectedNodeIds.has(id));
  const someSelected =
    !isLeaf && leafIds.some((id) => selectedNodeIds.has(id)) && !allSelected;

  const abnormal = hasAbnormalIndicator(node);

  const handleCheckboxChange = useCallback(() => {
    if (isLeaf) {
      toggleNodeSelection(node.id);
    } else {
      if (allSelected) {
        deselectAllChildren(leafIds);
      } else {
        selectAllChildren(leafIds);
      }
    }
  }, [
    isLeaf,
    allSelected,
    leafIds,
    toggleNodeSelection,
    selectAllChildren,
    deselectAllChildren,
    node.id,
  ]);

  const summaryText = useMemo(() => {
    if (isLeaf && node.data) {
      const s = getNodeSummary(node);
      return s.length > 100 ? s.substring(0, 100) + "…" : s;
    }
    return "";
  }, [isLeaf, node]);

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1.5 py-1 px-2 rounded-md transition-colors",
          isLeaf
            ? isSelected
              ? "border-l-3 border-l-primary/60 bg-primary/5"
              : "hover:bg-gradient-to-r hover:from-muted/50 hover:to-transparent"
            : "font-semibold"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* Expand/collapse */}
        {!isLeaf ? (
          <button
            onClick={() => toggleExpand(node.id)}
            className="flex items-center justify-center w-4 h-4 shrink-0"
          >
            <ChevronRight
              className={cn(
                "size-3.5 text-muted-foreground transition-transform duration-200",
                isExpanded && "rotate-90"
              )}
            />
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {/* Checkbox */}
        <div className="relative shrink-0" onClick={handleCheckboxChange}>
          <Checkbox
            checked={isLeaf ? isSelected : allSelected ? true : someSelected ? "indeterminate" : false}
            onCheckedChange={handleCheckboxChange}
            className="size-3.5"
          />
          {someSelected && !allSelected && (
            <Minus className="size-2.5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary pointer-events-none" />
          )}
        </div>

        {/* Category icon (leaf only) */}
        {isLeaf && (
          <IconComp className={cn("size-3.5 shrink-0", config.color)} />
        )}

        {/* Label */}
        {isLeaf ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "truncate text-sm cursor-pointer flex-1",
                  isSelected ? "text-foreground font-medium" : "text-muted-foreground"
                )}
                onClick={() => setPreviewNodeId(node.id)}
              >
                {node.label}
              </span>
            </TooltipTrigger>
            {summaryText && (
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-xs">{summaryText}</p>
              </TooltipContent>
            )}
          </Tooltip>
        ) : (
          <span
            className={cn("truncate text-sm flex-1", config.color)}
          >
            {node.label}
          </span>
        )}

        {/* Category icon (non-leaf) */}
        {!isLeaf && (
          <IconComp className={cn("size-3.5 shrink-0", config.color)} />
        )}

        {/* Abnormal indicator */}
        {abnormal && (
          <span
            className={cn(
              "size-2 rounded-full shrink-0",
              abnormal === "abnormal" ? "bg-rose-500" : "bg-amber-500"
            )}
          />
        )}

        {/* Select all / deselect toggle for category nodes */}
        {!isLeaf && node.children && node.children.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-[10px] shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              if (allSelected) {
                deselectAllChildren(leafIds);
              } else {
                selectAllChildren(leafIds);
              }
            }}
          >
            {allSelected ? "取消" : "全选"}
          </Button>
        )}
      </div>

      {/* Children */}
      {!isLeaf && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PatientTree (main component)
// ---------------------------------------------------------------------------

export function PatientTree({
  treeData,
  patients,
  currentPatientId,
  onPatientChange,
}: PatientTreeProps) {
  const selectedNodeIds = useChatStore((s) => s.selectedNodeIds);
  const clearSelection = useChatStore((s) => s.clearSelection);

  const [searchQuery, setSearchQuery] = useState("");
  const [allExpanded, setAllExpanded] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Collect all non-leaf ids for expand all/collapse all
  const allNonLeafIds = useMemo(
    () => collectAllNodeIds(treeData).filter(
      (id) => {
        // Find node by id
        function findNode(n: TreeNode): TreeNode | null {
          if (n.id === id) return n;
          for (const c of n.children ?? []) {
            const found = findNode(c);
            if (found) return found;
          }
          return null;
        }
        const found = findNode(treeData);
        return found ? !found.isLeaf : false;
      }
    ),
    [treeData]
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    if (allExpanded) {
      setExpandedIds(new Set());
      setAllExpanded(false);
    } else {
      setExpandedIds(new Set(allNonLeafIds));
      setAllExpanded(true);
    }
  }, [allExpanded, allNonLeafIds]);

  // Filter tree
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return treeData;
    return filterTree(treeData, searchQuery.trim()) ?? treeData;
  }, [treeData, searchQuery]);

  // Selection summary: count selected per category
  const selectionSummary = useMemo(() => {
    const counts: Partial<Record<CategoryType, number>> = {};
    function countInTree(node: TreeNode) {
      if (node.isLeaf && selectedNodeIds.has(node.id)) {
        counts[node.category] = (counts[node.category] ?? 0) + 1;
      }
      node.children?.forEach(countInTree);
    }
    countInTree(treeData);
    return counts;
  }, [treeData, selectedNodeIds]);

  const totalSelected = Object.values(selectionSummary).reduce(
    (a: number, b: number | undefined) => a + (b ?? 0),
    0
  );

  // Get initials from patient name
  function getInitials(name: string): string {
    // For Chinese names, take the last character or first character
    if (/[\u4e00-\u9fff]/.test(name)) {
      return name.length >= 2 ? name.slice(-1) : name.charAt(0);
    }
    return name
      .split(" ")
      .map((w) => w.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  const patientColorMap: Record<string, string> = {
    "patient-001": "bg-teal-500",
    "patient-002": "bg-amber-500",
    "patient-003": "bg-purple-500",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Patient selector */}
      <div className="p-3 border-b space-y-2">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          患者列表
        </div>
        <div className="flex gap-2 flex-wrap">
          {patients.map((p) => (
            <Button
              key={p.id}
              variant={currentPatientId === p.id ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-8 gap-1.5 text-xs",
                currentPatientId === p.id && "shadow-sm"
              )}
              onClick={() => onPatientChange(p.id)}
            >
              <span
                className={cn(
                  "size-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0",
                  currentPatientId === p.id
                    ? "bg-white/30"
                    : patientColorMap[p.id] ?? "bg-muted-foreground"
                )}
              >
                {getInitials(p.basicInfo.name)}
              </span>
              {p.basicInfo.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Search & controls */}
      <div className="p-3 border-b space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="搜索记录..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px] px-2"
            onClick={handleToggleAll}
          >
            {allExpanded ? "全部折叠" : "全部展开"}
          </Button>
          {totalSelected > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] px-2 text-rose-500 hover:text-rose-600"
              onClick={clearSelection}
            >
              清除选择 ({totalSelected})
            </Button>
          )}
        </div>
      </div>

      {/* Selection summary */}
      {totalSelected > 0 && (
        <div className="px-3 py-2 border-b">
          <div className="flex items-center gap-2 flex-wrap">
            {(
              Object.entries(selectionSummary) as [CategoryType, number][]
            ).map(([cat, count]) => {
              if (!count) return null;
              const cfg = CATEGORY_CONFIG[cat];
              return (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
                >
                  <span className={cn("size-2 rounded-full", cfg.dot)} />
                  {cfg.label} {count}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Tree content */}
      <ScrollArea className="flex-1">
        <div className="py-1">
          {filteredTree.children?.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              depth={0}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
