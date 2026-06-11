"use client";

import React, { useMemo } from "react";
import type { PatientData } from "@/lib/patient-data";
import { useChatStore } from "@/lib/chat-store";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  FlaskConical,
  Stethoscope,
  Scissors,
  FileText,
  ChevronDown,
  Activity,
  TrendingUp,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PatientStatsCardProps {
  patient: PatientData;
}

// Color-mapped progress bar helper
function ColorProgress({
  value,
  colorClass,
  className,
}: {
  value: number;
  colorClass: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700",
        className
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500", colorClass)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function PatientStatsCard({ patient }: PatientStatsCardProps) {
  const statsCollapsed = useChatStore((s) => s.statsCollapsed);
  const setStatsCollapsed = useChatStore((s) => s.setStatsCollapsed);

  // Compute statistics
  const stats = useMemo(() => {
    // Abnormal lab indicators
    let abnormalCount = 0;
    let totalLabItems = 0;
    for (const report of patient.labReports) {
      for (const item of report.items) {
        totalLabItems += 1;
        if (item.flag === "H" || item.flag === "L") {
          abnormalCount += 1;
        }
      }
    }

    // Positive exams
    const positiveExams = patient.exams.filter((e) => e.conclusion === "阳性").length;
    const totalExams = patient.exams.length;

    // Length of stay
    const admissionDate = new Date(patient.basicInfo.admission_date);
    const now = new Date();
    const losDays = Math.max(
      1,
      Math.ceil((now.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    // Typical max stay reference: 30 days
    const losPercent = Math.min(100, (losDays / 30) * 100);

    return {
      abnormalCount,
      totalLabItems,
      abnormalPercent: totalLabItems > 0 ? (abnormalCount / totalLabItems) * 100 : 0,
      positiveExams,
      totalExams,
      positiveExamPercent: totalExams > 0 ? (positiveExams / totalExams) * 100 : 0,
      losDays,
      losPercent,
      labReportCount: patient.labReports.length,
      diagnosisCount: patient.diagnoses.length,
      surgeryCount: patient.surgeries.length,
      emrCount: patient.emrs.length,
    };
  }, [patient]);

  return (
    <Collapsible open={!statsCollapsed} onOpenChange={(open) => setStatsCollapsed(!open)}>
      <div className="px-3 py-2 border-b">
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <span className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              患者统计
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                {patient.status === "inpatient" ? "在院" : "已出院"}
              </Badge>
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                !statsCollapsed && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="px-3 py-3 space-y-3 border-b">
          {/* Abnormal Indicators */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-rose-500" />
                异常指标
              </span>
              <span className="font-medium">
                <span className="text-rose-600 dark:text-rose-400">{stats.abnormalCount}</span>
                <span className="text-muted-foreground">/{stats.totalLabItems}</span>
              </span>
            </div>
            <ColorProgress value={stats.abnormalPercent} colorClass="bg-rose-500" />
          </div>

          {/* Positive Exams */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Stethoscope className="h-3.5 w-3.5 text-amber-500" />
                阳性检查
              </span>
              <span className="font-medium">
                <span className="text-amber-600 dark:text-amber-400">{stats.positiveExams}</span>
                <span className="text-muted-foreground">/{stats.totalExams}</span>
              </span>
            </div>
            <ColorProgress value={stats.positiveExamPercent} colorClass="bg-amber-500" />
          </div>

          {/* Length of Stay */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-teal-500" />
                住院天数
              </span>
              <span className="font-medium">
                <span className="text-teal-600 dark:text-teal-400">{stats.losDays}</span>
                <span className="text-muted-foreground">天</span>
              </span>
            </div>
            <ColorProgress value={stats.losPercent} colorClass="bg-teal-500" />
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex items-center gap-2 rounded-lg border p-2">
              <FlaskConical className="h-3.5 w-3.5 shrink-0 text-violet-500" />
              <div>
                <p className="text-[10px] text-muted-foreground">检验</p>
                <p className="text-xs font-semibold">{stats.labReportCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-2">
              <Activity className="h-3.5 w-3.5 shrink-0 text-sky-500" />
              <div>
                <p className="text-[10px] text-muted-foreground">诊断</p>
                <p className="text-xs font-semibold">{stats.diagnosisCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-2">
              <Scissors className="h-3.5 w-3.5 shrink-0 text-orange-500" />
              <div>
                <p className="text-[10px] text-muted-foreground">手术</p>
                <p className="text-xs font-semibold">{stats.surgeryCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-2">
              <FileText className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <div>
                <p className="text-[10px] text-muted-foreground">病历</p>
                <p className="text-xs font-semibold">{stats.emrCount}</p>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
