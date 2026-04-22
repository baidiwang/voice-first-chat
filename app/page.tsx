"use client";
import {
  useRealtimeVoice,
  ActionItem,
  TranscriptItem,
} from "@/lib/useRealtimeVoice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

export default function Home() {
  const { connected, listening, transcript, actions, connect, disconnect } =
    useRealtimeVoice();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Topbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="font-medium text-sm">Lily</span>
          {connected ? (
            <Badge
              variant="default"
              className="bg-green-500 text-white text-xs"
            >
              Live
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Offline
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          Actions {actions.length > 0 && `(${actions.length})`}
        </Button>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Transcript */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <ScrollArea className="flex-1 px-4 py-4">
            <div className="flex flex-col gap-3 max-w-2xl mx-auto">
              {transcript.length === 0 && (
                <p className="text-muted-foreground text-sm text-center mt-8">
                  Press connect and start talking...
                </p>
              )}
              {transcript.map((item: TranscriptItem) => (
                <div
                  key={item.id}
                  className={`flex flex-col gap-1 ${
                    item.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2 rounded-2xl text-sm max-w-[85%] ${
                      item.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    } ${!item.isFinal ? "opacity-60 italic" : ""}`}
                  >
                    {item.text}
                  </div>
                  {item.role === "user" && !item.isFinal && (
                    <span className="text-xs text-muted-foreground">
                      listening...
                    </span>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Voice control bar */}
          <div className="border-t border-border px-4 py-4">
            <div className="flex items-center gap-4 max-w-2xl mx-auto">
              <Button
                onClick={connected ? disconnect : connect}
                variant={connected ? "destructive" : "default"}
                className="rounded-full w-12 h-12 p-0"
              >
                {connected ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <rect x="3" y="3" width="10" height="10" rx="2" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <rect x="5" y="1" width="6" height="9" rx="3" />
                    <path
                      d="M2.5 8.5a5.5 5.5 0 0 0 11 0"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <line
                      x1="8"
                      y1="14"
                      x2="8"
                      y2="16"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </Button>
              <div className="flex-1 flex items-center gap-1 h-8">
                {listening && connected ? (
                  Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-primary rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 24 + 4}px`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {connected ? "Connected" : "Press to connect"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action feed sidebar — desktop always visible, mobile toggleable */}
        <div
          className={`
            w-72 border-l border-border flex flex-col overflow-hidden
            ${sidebarOpen ? "flex" : "hidden"} md:flex
          `}
        >
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium">Agent actions</span>
            <span className="text-xs text-muted-foreground">
              {actions.length}
            </span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 flex flex-col gap-2">
              {actions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Tool calls will appear here
                </p>
              )}
              {actions.map((action: ActionItem) => (
                <div
                  key={action.id}
                  className="rounded-lg border border-border bg-muted/50 p-3 text-xs flex flex-col gap-1"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        action.status === "success"
                          ? "bg-green-500"
                          : action.status === "error"
                            ? "bg-red-500"
                            : "bg-yellow-500 animate-pulse"
                      }`}
                    />
                    <span className="font-mono font-medium">{action.tool}</span>
                  </div>
                  <pre className="text-muted-foreground bg-background rounded p-2 overflow-x-auto text-xs">
                    {JSON.stringify(
                      Object.fromEntries(
                        Object.entries(action.args).filter(
                          ([k]) => k !== "__call_id",
                        ),
                      ),
                      null,
                      2,
                    )}
                  </pre>
                  {action.result && (
                    <span
                      className={
                        action.status === "success"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-500"
                      }
                    >
                      {JSON.stringify(action.result)}
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    {action.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
