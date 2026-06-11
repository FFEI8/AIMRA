"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useChatStore, formatRelativeTime } from "@/lib/chat-store";
import type { ChatSession } from "@/lib/chat-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MessageSquare,
  Plus,
  ChevronDown,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";

export function SessionManager() {
  const sessions = useChatStore((s) => s.sessions);
  const currentSessionId = useChatStore((s) => s.currentSessionId);
  const createNewSession = useChatStore((s) => s.createNewSession);
  const switchSession = useChatStore((s) => s.switchSession);
  const deleteSession = useChatStore((s) => s.deleteSession);
  const renameSession = useChatStore((s) => s.renameSession);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ChatSession | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Get current session name
  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const currentTitle = currentSession?.title || "新会话";

  // Sorted sessions by updatedAt desc
  const sortedSessions = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  // Focus rename input
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const handleCreateNew = useCallback(() => {
    createNewSession();
    setPopoverOpen(false);
  }, [createNewSession]);

  const handleSwitch = useCallback(
    (sessionId: string) => {
      switchSession(sessionId);
      setPopoverOpen(false);
    },
    [switchSession]
  );

  const handleStartRename = useCallback((session: ChatSession) => {
    setRenamingId(session.id);
    setRenameValue(session.title);
  }, []);

  const handleConfirmRename = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      renameSession(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue("");
  }, [renamingId, renameValue, renameSession]);

  const handleCancelRename = useCallback(() => {
    setRenamingId(null);
    setRenameValue("");
  }, []);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleConfirmRename();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancelRename();
      }
    },
    [handleConfirmRename, handleCancelRename]
  );

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) {
      deleteSession(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteSession]);

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between gap-2 px-3 text-left font-normal"
          >
            <span className="flex items-center gap-2 truncate">
              <MessageSquare className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{currentTitle}</span>
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                popoverOpen && "rotate-180"
              )}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start" sideOffset={8}>
          {/* Header */}
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-xs text-muted-foreground">
              会话列表 ({sessions.length})
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={handleCreateNew}
            >
              <Plus className="h-3 w-3" />
              新对话
            </Button>
          </div>

          {/* Session List */}
          <ScrollArea className="max-h-[320px]">
            {sortedSessions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 opacity-40" />
                <p className="text-xs">暂无会话记录</p>
              </div>
            ) : (
              <div className="p-1">
                {sortedSessions.map((session) => {
                  const isActive = session.id === currentSessionId;
                  const isRenaming = session.id === renamingId;

                  return (
                    <div
                      key={session.id}
                      className={cn(
                        "group relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/80 hover:bg-accent"
                      )}
                      onClick={() => {
                        if (!isRenaming) handleSwitch(session.id);
                      }}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                      )}

                      {/* Session icon */}
                      <MessageSquare className="h-4 w-4 shrink-0 opacity-60" />

                      {/* Session content */}
                      {isRenaming ? (
                        <div className="flex flex-1 items-center gap-1">
                          <Input
                            ref={renameInputRef}
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={handleRenameKeyDown}
                            onBlur={handleConfirmRename}
                            className="h-6 px-1.5 py-0 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmRename();
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelRename();
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm leading-tight">
                              {session.title.length > 25
                                ? session.title.substring(0, 25) + "..."
                                : session.title}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                              <span>{formatRelativeTime(session.updatedAt)}</span>
                              <span>·</span>
                              <span>{session.messages.length}条消息</span>
                            </div>
                          </div>

                          {/* Hover actions */}
                          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartRename(session);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(session);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除会话</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除会话「{deleteTarget?.title}」吗？此操作无法撤销，会话中的所有消息将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
