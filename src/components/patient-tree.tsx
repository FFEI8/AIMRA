"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  User,
  Stethoscope,
  FlaskConical,
  ClipboardList,
  Syringe,
  FileText,
  ChevronRight,
  Search,
  Minus,
  Bed,
  LogOut,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  type PatientStatus,
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
    const exam = node.data as { conclusion: string };
    if (exam.conclusion === "阳性") return "positive";
  }
  if (node.category === "lab") {
    const report = node.data as { items: { flag: string }[] };
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
// Patient List Item
// ---------------------------------------------------------------------------

function PatientListItem({
  patient,
  isActive,
  onClick,
}: {
  patient: PatientData;
  isActive: boolean;
  onClick: () => void;
}) {
  function getInitials(name: string): string {
    if (/[\u4e00-\u9fff]/.test(name)) {
      return name.length >= 2 ? name.slice(-1) : name.charAt(0);
    }
    return name.split(" ").map((w) => w.charAt(0)).join("").toUpperCase().slice(0, 2);
  }

  const isInpatient = patient.status === "inpatient";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-200",
        "hover:bg-accent/60",
        isActive && "bg-primary/8 border-l-2 border-l-primary"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
          isActive ? "bg-primary" : isInpatient ? "bg-teal-500" : "bg-gray-400"
        )}
      >
        {getInitials(patient.basicInfo.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn("text-sm font-medium truncate", isActive && "text-primary")}>
            {patient.basicInfo.name}
          </span>
          <Badge
            variant={isInpatient ? "default" : "secondary"}
            className={cn(
              "text-[9px] px-1 py-0 h-4 shrink-0",
              isInpatient
                ? "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300 border-teal-200 dark:border-teal-800"
                : ""
            )}
          >
            {isInpatient ? "在院" : "出院"}
          </Badge>
        </div>
        <div className="text-[11px] text-muted-foreground truncate">
          {patient.basicInfo.department} · {patient.basicInfo.bed_no}床
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground shrink-0">
        {patient.basicInfo.gender}/{patient.basicInfo.age}岁
      </div>
    </button>
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
  const patientFilter = useChatStore((s) => s.patientFilter);
  const setPatientFilter = useChatStore((s) => s.setPatientFilter);

  const [searchQuery, setSearchQuery] = useState("");
  const [allExpanded, setAllExpanded] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Collect all non-leaf ids for expand all/collapse all
  const allNonLeafIds = useMemo(
    () => collectAllNodeIds(treeData).filter(
      (id) => {
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

  // Selection summary
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

  // Filter patients by status and search
  const filteredPatients = useMemo(() => {
    let result = patients;
    if (patientFilter !== "all") {
      result = result.filter((p) => p.status === patientFilter);
    }
    return result;
  }, [patients, patientFilter]);

  const inpatientCount = patients.filter((p) => p.status === "inpatient").length;
  const dischargedCount = patients.filter((p) => p.status === "discharged").length;

  // If current patient is not in filtered list, auto switch to the first in list
  useEffect(() => {
    if (filteredPatients.length > 0 && !filteredPatients.find((p) => p.id === currentPatientId)) {
      // Don't auto-switch, just keep current
    }
  }, [filteredPatients, currentPatientId]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Patient list header with filter tabs */}
      <div className="shrink-0 p-3 pb-0 border-b overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-muted-foreground">患者列表</div>
          <div className="flex items-center gap-0.5">
            <Button
              variant={patientFilter === "all" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 text-[10px] px-2"
              onClick={() => setPatientFilter("all")}
            >
              全部({patients.length})
            </Button>
            <Button
              variant={patientFilter === "inpatient" ? "default" : "ghost"}
              size="sm"
              className={cn("h-6 text-[10px] px-2", patientFilter === "inpatient" && "bg-teal-600 hover:bg-teal-700")}
              onClick={() => setPatientFilter("inpatient")}
            >
              <Bed className="h-3 w-3 mr-1" />
              在院({inpatientCount})
            </Button>
            <Button
              variant={patientFilter === "discharged" ? "secondary" : "ghost"}
              size="sm"
              className="h-6 text-[10px] px-2"
              onClick={() => setPatientFilter("discharged")}
            >
              <LogOut className="h-3 w-3 mr-1" />
              出院({dischargedCount})
            </Button>
          </div>
        </div>

        {/* Patient list - constrained height */}
        <ScrollArea className="max-h-[160px] min-h-0">
          <div className="space-y-0.5 py-2">
            {filteredPatients.map((p) => (
              <PatientListItem
                key={p.id}
                patient={p}
                isActive={currentPatientId === p.id}
                onClick={() => onPatientChange(p.id)}
              />
            ))}
          </div>
        </ScrollArea>

        {filteredPatients.length === 0 && (
          <div className="text-center py-3 text-xs text-muted-foreground">
            没有符合条件的患者
          </div>
        )}
      </div>

      {/* Controls bar (compact) */}
      <div className="shrink-0 px-3 py-1.5 border-b flex items-center gap-2">
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

      {/* Selection summary */}
      {totalSelected > 0 && (
        <div className="shrink-0 px-3 py-1.5 border-b">
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

      {/* Tree content - takes remaining space */}
      <ScrollArea className="flex-1 min-h-0">
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
