"use client";

import React, { useMemo, useState } from "react";
import type { PatientData } from "@/lib/patient-data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const [timelineOpen, setTimelineOpen] = useState(false);

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

    // Timeline events
    const events: { date: string; type: "admission" | "exam" | "surgery" | "discharge"; label: string }[] = [];

    // Admission event
    events.push({
      date: patient.basicInfo.admission_date,
      type: "admission",
      label: "入院",
    });

    // Exam events
    for (const exam of patient.exams) {
      events.push({
        date: exam.date,
        type: "exam",
        label: exam.name,
      });
    }

    // Surgery events
    for (const surgery of patient.surgeries) {
      events.push({
        date: surgery.date,
        type: "surgery",
        label: surgery.name,
      });
    }

    // Discharge - find from EMR
    const dischargeEmr = patient.emrs.find((e) => e.title === "出院小结");
    if (dischargeEmr) {
      events.push({
        date: dischargeEmr.date,
        type: "discharge",
        label: "出院",
      });
    }

    // Sort events by date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Timeline range
    const allDates = events.map((e) => new Date(e.date).getTime());
    const minDate = Math.min(...allDates);
    const maxDate = Math.max(...allDates);
    const dateRange = maxDate - minDate || 1;

    // Position each event as a percentage
    const positionedEvents = events.map((e) => ({
      ...e,
      position: ((new Date(e.date).getTime() - minDate) / dateRange) * 100,
    }));

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
      positionedEvents,
      minDate,
      maxDate,
    };
  }, [patient]);

  const eventTypeStyles: Record<string, { color: string; dot: string }> = {
    admission: { color: "text-teal-600 dark:text-teal-400", dot: "bg-teal-500" },
    exam: { color: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
    surgery: { color: "text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
    discharge: { color: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-primary" />
          患者统计
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
        <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4">
          <div className="flex items-center gap-2 rounded-lg border p-2.5">
            <FlaskConical className="h-4 w-4 shrink-0 text-violet-500" />
            <div>
              <p className="text-xs text-muted-foreground">检验报告</p>
              <p className="text-sm font-semibold">{stats.labReportCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border p-2.5">
            <Activity className="h-4 w-4 shrink-0 text-sky-500" />
            <div>
              <p className="text-xs text-muted-foreground">诊断记录</p>
              <p className="text-sm font-semibold">{stats.diagnosisCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border p-2.5">
            <Scissors className="h-4 w-4 shrink-0 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">手术记录</p>
              <p className="text-sm font-semibold">{stats.surgeryCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border p-2.5">
            <FileText className="h-4 w-4 shrink-0 text-emerald-500" />
            <div>
              <p className="text-xs text-muted-foreground">病历文书</p>
              <p className="text-sm font-semibold">{stats.emrCount}</p>
            </div>
          </div>
        </div>

        {/* Hospital Stay Timeline */}
        <Collapsible open={timelineOpen} onOpenChange={setTimelineOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              住院时间线
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                timelineOpen && "rotate-180"
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-3">
            {/* Visual Timeline Bar */}
            <div className="relative">
              {/* Gradient bar */}
              <div className="h-2 w-full rounded-full bg-gradient-to-r from-teal-400 via-amber-400 to-emerald-400 opacity-30" />
              {/* Event markers */}
              <div className="relative -top-2 h-4">
                {stats.positionedEvents.map((event, idx) => {
                  const style = eventTypeStyles[event.type];
                  return (
                    <div
                      key={idx}
                      className="absolute -translate-x-1/2"
                      style={{ left: `${event.position}%` }}
                    >
                      <div
                        className={cn(
                          "h-4 w-4 rounded-full border-2 border-white dark:border-gray-800 shadow-sm",
                          style.dot
                        )}
                        title={`${event.date} - ${event.label}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Event List */}
            <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
              {stats.positionedEvents.map((event, idx) => {
                const style = eventTypeStyles[event.type];
                return (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <div className={cn("h-2 w-2 shrink-0 rounded-full", style.dot)} />
                    <span className="shrink-0 text-muted-foreground">{event.date}</span>
                    <Badge
                      variant="outline"
                      className={cn("h-5 shrink-0 px-1.5 text-[10px]", style.color)}
                    >
                      {event.label}
                    </Badge>
                    <span className="truncate font-medium">{event.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
              {Object.entries(eventTypeStyles).map(([type, style]) => {
                const labels: Record<string, string> = {
                  admission: "入院",
                  exam: "检查",
                  surgery: "手术",
                  discharge: "出院",
                };
                return (
                  <span key={type} className="flex items-center gap-1">
                    <span className={cn("inline-block h-2 w-2 rounded-full", style.dot)} />
                    {labels[type]}
                  </span>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
