"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Menu,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Sun,
  Download,
  Heart,
  Stethoscope,
  FileText,
  Users,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { PatientTree } from "@/components/patient-tree";
import { ChatWindow } from "@/components/chat-window";
import { SystemPromptPanel } from "@/components/system-prompt";
import { ModelConfigPanel } from "@/components/model-config";
import { PatientStatsCard } from "@/components/patient-stats";
import { RecordDetailDrawer } from "@/components/record-detail-drawer";
import { ErrorBoundary } from "@/components/error-boundary";
import { useChatStore } from "@/lib/chat-store";
import { allPatients, buildPatientTree } from "@/lib/patient-data";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

function PatientInitial({
  name,
  isActive,
}: {
  name: string;
  isActive: boolean;
}) {
  const initial = name.charAt(0);
  return (
    <div
      className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all duration-200",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30"
          : "bg-muted text-muted-foreground"
      )}
    >
      {initial}
    </div>
  );
}

function PatientInitialWithHover({
  patient,
}: {
  patient: (typeof allPatients)[number];
}) {
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className="cursor-default">
          <PatientInitial
            name={patient.basicInfo.name}
            isActive={false}
          />
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-48 p-3" side="bottom">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
            {patient.basicInfo.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium">{patient.basicInfo.name}</p>
            <p className="text-xs text-muted-foreground">
              {patient.basicInfo.gender} · {patient.basicInfo.age}岁
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export default function Home() {
  const {
    leftPanelOpen,
    toggleLeftPanel,
    setLeftPanelOpen,
    currentPatientId,
    setCurrentPatientId,
    isLoading,
  } = useChatStore();
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();
  const [toggleHovered, setToggleHovered] = useState(false);

  // Close left panel on mobile by default
  useEffect(() => {
    if (isMobile) {
      setLeftPanelOpen(false);
    }
  }, [isMobile, setLeftPanelOpen]);

  // Build tree for current patient
  const treeData = useMemo(() => {
    const patient = allPatients.find((p) => p.id === currentPatientId);
    if (!patient) return buildPatientTree(allPatients[0]);
    return buildPatientTree(patient);
  }, [currentPatientId]);

  const currentPatient =
    allPatients.find((p) => p.id === currentPatientId) || allPatients[0];

  const handleExportChat = () => {
    const state = useChatStore.getState();
    const messages =
      state.sessions[state.currentSessionId]?.messages || [];
    if (messages.length === 0) return;
    const content = messages
      .map((msg) => {
        const role = msg.role === "user" ? "👤 用户" : "🤖 AI助手";
        const time = new Date(msg.timestamp).toLocaleString("zh-CN");
        let text = `## ${role} (${time})\n\n${msg.content}`;
        if (msg.contextItems && msg.contextItems.length > 0) {
          text += `\n\n> 附加病历: ${msg.contextItems.join(", ")}`;
        }
        return text;
      })
      .join("\n\n---\n\n");
    const sessionTitle =
      state.sessions[state.currentSessionId]?.title || "对话";
    const header = `# AI病历分析对话记录\n\n对话: ${sessionTitle} | 患者: ${currentPatient.basicInfo.name} | 导出时间: ${new Date().toLocaleString("zh-CN")}\n\n---\n\n`;
    const blob = new Blob([header + content], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `病历分析-${currentPatient.basicInfo.name}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-screen flex flex-col bg-background">
        {/* Top header */}
        <header className="flex items-center justify-between px-4 py-2 border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 z-10">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[320px] p-0">
                  <SheetTitle className="sr-only">患者病历菜单</SheetTitle>
                  <SheetDescription className="sr-only">
                    浏览和选择患者病历项目
                  </SheetDescription>
                  <PatientTree
                    treeData={treeData}
                    patients={allPatients}
                    currentPatientId={currentPatientId}
                    onPatientChange={setCurrentPatientId}
                  />
                </SheetContent>
              </Sheet>
            )}
            <div className="flex items-center gap-2.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm relative cursor-default">
                    <Activity
                      className={cn(
                        "h-4.5 w-4.5 text-primary transition-opacity duration-300",
                        isLoading && "animate-pulse"
                      )}
                    />
                    {isLoading && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary animate-ping" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>AI 病历分析系统</TooltipContent>
              </Tooltip>
              <div>
                <h1 className="text-sm font-bold leading-tight tracking-tight">
                  AI 病历分析助手
                </h1>
                <p className="text-[10px] text-muted-foreground/70 leading-tight">
                  Intelligent Medical Record Analysis
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Patient info badge - desktop */}
            <div className="hidden sm:flex items-center gap-2 text-xs bg-muted/40 border border-border/50 px-3 py-1.5 rounded-lg">
              {allPatients.length > 1 && (
                <div className="flex -space-x-1.5">
                  {allPatients.map((p) => (
                    <PatientInitialWithHover key={p.id} patient={p} />
                  ))}
                </div>
              )}
              <Heart className="h-3 w-3 text-rose-500/70" />
              <span className="font-medium text-foreground">
                {currentPatient.basicInfo.name}
              </span>
              <span className="text-muted-foreground/40">|</span>
              <span className="text-muted-foreground">
                {currentPatient.basicInfo.gender}/{currentPatient.basicInfo.age}
                岁
              </span>
              <span className="text-muted-foreground/40">|</span>
              <Stethoscope className="h-3 w-3 text-muted-foreground/50" />
              <span className="text-muted-foreground">
                住院号 {currentPatient.basicInfo.patient_no}
              </span>
            </div>
            {/* Patient info badge - mobile (compact) */}
            <div className="sm:hidden flex items-center gap-1 text-xs bg-muted/40 px-2 py-1 rounded-lg">
              <PatientInitial
                name={currentPatient.basicInfo.name}
                isActive={true}
              />
              <Heart className="h-3 w-3 text-rose-500/70" />
              <span className="font-medium text-foreground">
                {currentPatient.basicInfo.name}
              </span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleExportChat}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>导出对话</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setTheme(theme === "dark" ? "light" : "dark")
                  }
                >
                  {theme === "dark" ? (
                    <Sun className="h-3.5 w-3.5" />
                  ) : (
                    <Moon className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {theme === "dark" ? "浅色模式" : "深色模式"}
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left panel - Desktop */}
          {!isMobile && (
            <>
              <div
                className="flex-shrink-0 border-r flex flex-col bg-background transition-all duration-300 ease-in-out overflow-hidden"
                style={{
                  width: leftPanelOpen ? "340px" : "0px",
                  opacity: leftPanelOpen ? 1 : 0,
                }}
              >
                {leftPanelOpen && (
                  <ErrorBoundary>
                    <div className="flex flex-col h-full">
                      <PatientStatsCard patient={currentPatient} />
                      <PatientTree
                        treeData={treeData}
                        patients={allPatients}
                        currentPatientId={currentPatientId}
                        onPatientChange={setCurrentPatientId}
                      />
                    </div>
                  </ErrorBoundary>
                )}
              </div>
              <div
                className="absolute top-1/2 -translate-y-1/2 z-10"
                style={{
                  left: leftPanelOpen ? "340px" : "0",
                  transition: "left 300ms ease-in-out",
                }}
              >
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleLeftPanel}
                  onMouseEnter={() => setToggleHovered(true)}
                  onMouseLeave={() => setToggleHovered(false)}
                  className={cn(
                    "h-8 w-5 rounded-r-lg rounded-l-none border-l-0 bg-background hover:bg-accent",
                    "transition-all duration-300 ease-in-out shadow-sm",
                    toggleHovered && "w-6"
                  )}
                >
                  <div
                    className={cn(
                      "transition-transform duration-300 ease-in-out",
                      leftPanelOpen
                        ? "rotate-0"
                        : "rotate-180"
                    )}
                  >
                    {leftPanelOpen ? (
                      <PanelLeftClose className="h-3 w-3" />
                    ) : (
                      <PanelLeftOpen className="h-3 w-3" />
                    )}
                  </div>
                </Button>
              </div>
            </>
          )}

          {/* Right panel */}
          <div className="flex-1 flex flex-col min-w-0">
            <ErrorBoundary>
              <SystemPromptPanel />
              <ModelConfigPanel />
              <div className="flex-1 overflow-hidden">
                <ChatWindow treeData={treeData} />
              </div>
            </ErrorBoundary>
          </div>
        </div>

        {/* Record Detail Drawer */}
        <ErrorBoundary>
          <RecordDetailDrawer treeData={treeData} />
        </ErrorBoundary>

        {/* Mobile Bottom Action Bar */}
        {isMobile && (
          <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 px-3 pb-[env(safe-area-inset-bottom,8px)] pt-2">
            <div className="frosted-glass rounded-2xl border border-border/50 shadow-lg px-3 py-2 flex items-center justify-between gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-accent/50 transition-colors text-xs font-medium">
                    <Users className="h-3.5 w-3.5 text-primary/70" />
                    <span className="max-w-[80px] truncate">
                      {currentPatient.basicInfo.name}
                    </span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {allPatients.map((p) => (
                    <DropdownMenuItem
                      key={p.id}
                      onClick={() => setCurrentPatientId(p.id)}
                      className={cn(
                        "flex items-center gap-2 cursor-pointer",
                        p.id === currentPatientId && "bg-accent"
                      )}
                    >
                      <PatientInitial
                        name={p.basicInfo.name}
                        isActive={p.id === currentPatientId}
                      />
                      <span className="text-sm">{p.basicInfo.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {p.basicInfo.gender}/{p.basicInfo.age}岁
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Sheet>
                <SheetTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/15 transition-colors text-xs font-medium">
                    <FileText className="h-3.5 w-3.5" />
                    选择病历
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[320px] p-0">
                  <SheetTitle className="sr-only">患者病历菜单</SheetTitle>
                  <SheetDescription className="sr-only">
                    浏览和选择患者病历项目
                  </SheetDescription>
                  <PatientTree
                    treeData={treeData}
                    patients={allPatients}
                    currentPatientId={currentPatientId}
                    onPatientChange={setCurrentPatientId}
                  />
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground/60" />
                <Badge
                  variant="secondary"
                  className="h-5 px-1.5 text-[10px] font-medium"
                >
                  {useChatStore.getState().sessions[
                    useChatStore.getState().currentSessionId
                  ]?.messages?.length || 0}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
