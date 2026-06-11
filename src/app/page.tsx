"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  Menu,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Sun,
  Download,
  FileText,
  Users,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { PatientTree } from "@/components/patient-tree";
import { ChatWindow } from "@/components/chat-window";
import { RecordDetailDrawer } from "@/components/record-detail-drawer";
import { ErrorBoundary } from "@/components/error-boundary";
import { SettingsDropdown } from "@/components/settings-dropdown";
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

  // Draggable panel width
  const [leftPanelWidth, setLeftPanelWidth] = useState(340);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);
  const MIN_PANEL_WIDTH = 240;
  const MAX_PANEL_WIDTH = 600;

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = leftPanelWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [leftPanelWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - dragStartX.current;
      const newWidth = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, dragStartWidth.current + delta));
      setLeftPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Hydrate store from localStorage after mount (prevents SSR/client mismatch)
  useEffect(() => {
    useChatStore.getState()._hydrate();
  }, []);

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
            {/* Export */}
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

            {/* Settings dropdown */}
            <SettingsDropdown />

            {/* Theme toggle */}
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
                className="flex-shrink-0 border-r flex flex-col bg-background overflow-hidden"
                style={{
                  width: leftPanelOpen ? `${leftPanelWidth}px` : "0px",
                  opacity: leftPanelOpen ? 1 : 0,
                  transition: isDragging.current ? "opacity 0.3s" : "width 0.3s ease-in-out, opacity 0.3s ease-in-out",
                }}
              >
                {leftPanelOpen && (
                  <ErrorBoundary>
                    <div className="flex flex-col h-full">
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
              {/* Draggable resize handle + toggle button */}
              {leftPanelOpen && (
                <div
                  className="flex-shrink-0 w-1.5 hover:w-2 flex items-center justify-center cursor-col-resize group relative z-10 transition-all duration-150"
                  style={{
                    background: "transparent",
                  }}
                  onMouseDown={handleDragStart}
                >
                  {/* Visual grip indicator */}
                  <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center">
                    <div className={cn(
                      "w-0.5 h-8 rounded-full bg-border group-hover:bg-primary/40 group-hover:h-12 transition-all duration-150"
                    )} />
                  </div>
                </div>
              )}
              <div
                className="absolute top-1/2 -translate-y-1/2 z-10"
                style={{
                  left: leftPanelOpen ? `${leftPanelWidth + (leftPanelOpen ? 6 : 0)}px` : "0",
                  transition: isDragging.current ? "none" : "left 0.3s ease-in-out",
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
          <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 px-3 pt-2 pb-[max(env(safe-area-inset-bottom,8px),8px)]">
            <div className="bg-background/80 backdrop-blur-lg rounded-2xl border border-border/50 shadow-lg px-3 py-2 flex items-center justify-between gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-accent/50 transition-colors text-xs font-medium max-w-[140px]">
                    <Users className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                    <span className="truncate">
                      {currentPatient.basicInfo.name}
                    </span>
                    <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
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
