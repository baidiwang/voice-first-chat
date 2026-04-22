"use client";
import { useRealtimeVoice } from "@/lib/useRealtimeVoice";
import { useState, useRef, useEffect } from "react";

export default function Home() {
  const { connected, listening, transcript, actions, connect, disconnect } =
    useRealtimeVoice();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const notesCount = actions.filter(
    (a) => a.tool === "save_note" && a.status === "success",
  ).length;
  const tasksCount = actions.filter(
    (a) => a.tool === "create_task" && a.status === "success",
  ).length;

  const status = !connected ? "Ready" : listening ? "Listening" : "Thinking";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        setDrawerOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="h-screen grid overflow-hidden"
      style={{
        gridTemplateRows: "auto 1fr auto",
        gridTemplateColumns: drawerOpen ? "1fr 320px" : "1fr 16px",
        transition: "grid-template-columns 0.3s ease",
      }}
    >
      {/* Header */}
      <header
        className="col-span-full flex items-center justify-between px-6 py-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-4">
          <span
            className="text-base italic"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Lily
          </span>
          <div
            className="flex items-center gap-2 uppercase tracking-wider"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--text-muted)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: connected ? "var(--accent)" : "var(--text-ghost)",
                boxShadow: connected ? "0 0 6px var(--accent)" : "none",
              }}
            />
            <span>{connected ? "Live · post-call" : "Offline"}</span>
          </div>
        </div>
        <div
          className="flex gap-4"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--text-faint)",
          }}
        >
          <span>WebRTC</span>
          <span>{connected ? "42ms" : "—"}</span>
          <span>00:00</span>
        </div>
      </header>

      {/* Main content area */}
      <main className="relative flex flex-col overflow-hidden px-14 pt-5 pb-0">
        {/* Customer context */}
        <div
          className="mb-4 pb-3.5 border-b border-dashed"
          style={{ borderColor: "var(--border-dashed)" }}
        >
          <div className="flex items-baseline gap-3 mb-1">
            <span
              className="text-2xl tracking-tight"
              style={{ fontFamily: "var(--font-serif)", color: "var(--text)" }}
            >
              Northwind Logistics
            </span>
            <span
              className="uppercase tracking-wider px-2 py-0.5 rounded"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--accent)",
                border: "0.5px solid var(--accent-border)",
                letterSpacing: "0.06em",
              }}
            >
              Proposal
            </span>
          </div>
          <div
            className="flex gap-5"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--text-faint)",
            }}
          >
            <span>
              <strong
                className="mr-1 font-normal uppercase"
                style={{
                  color: "var(--text-muted)",
                  fontSize: 11,
                  letterSpacing: "0.1em",
                }}
              >
                contact
              </strong>
              Jordan Chen · VP Operations
            </span>
            <span>
              <strong
                className="mr-1 font-normal uppercase"
                style={{
                  color: "var(--text-muted)",
                  fontSize: 11,
                  letterSpacing: "0.1em",
                }}
              >
                arr
              </strong>
              $84,000
            </span>
            <span>
              <strong
                className="mr-1 font-normal uppercase"
                style={{
                  color: "var(--text-muted)",
                  fontSize: 11,
                  letterSpacing: "0.1em",
                }}
              >
                last
              </strong>
              Apr 14 · discovery
            </span>
          </div>
        </div>

        {/* Hero row */}
        <div className="flex items-center justify-center gap-10 py-10 pb-8 relative">
          <div className="text-center pointer-events-none">
            <div
              className="uppercase flex items-center justify-center gap-2 mb-5"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 18,
                color: "var(--accent)",
                letterSpacing: "0.24em",
              }}
            >
              <span
                className="h-px w-7 inline-block"
                style={{ background: "rgba(128, 61, 25, 0.3)" }}
              />
              <span>Lily is {status.toLowerCase()}</span>
              <span
                className="h-px w-7 inline-block"
                style={{ background: "rgba(212,112,58,0.3)" }}
              />
            </div>
            <div
              className="relative inline-block"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 96,
                lineHeight: 1,
                color: "var(--accent-bright)",
              }}
            >
              <span
                className="absolute inset-0 blur-2xl pointer-events-none"
                style={{ background: "var(--accent-glow)", zIndex: -1 }}
              />
              <span className="italic">{notesCount}</span>
              <span
                className="italic mx-2.5"
                style={{ color: "var(--text-ghost)" }}
              >
                ·
              </span>
              <span className="italic">{tasksCount}</span>
            </div>
            <div
              className="uppercase mt-4"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--text-muted)",
                letterSpacing: "0.2em",
              }}
            >
              <span style={{ color: "var(--text-faint)", marginRight: 40 }}>
                notes
              </span>
              <span>tasks</span>
            </div>
          </div>

          <VolumeRuler listening={listening && connected} />
        </div>

        {/* Transcript */}
        <div className="flex-1 overflow-y-auto min-h-0 pb-5">
          <div
            className="flex flex-col gap-4 max-w-xl mx-auto w-full"
            style={{ fontSize: 14, lineHeight: 1.6 }}
          >
            {transcript.length === 0 ? (
              <div className="mt-8 flex flex-col gap-3 items-center">
                <div
                  className="uppercase flex items-center gap-3 mb-2"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--text-faint)",
                    letterSpacing: "0.2em",
                  }}
                >
                  <span
                    className="h-px w-8"
                    style={{ background: "var(--text-ghost)" }}
                  />
                  <span>try asking</span>
                  <span
                    className="h-px w-8"
                    style={{ background: "var(--text-ghost)" }}
                  />
                </div>
                {[
                  "What did Jordan commit to on this call?",
                  "Save a note — biggest objection was pricing",
                  "Remind me to send the Tacoma proposal tomorrow 10am",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      if (!connected) connect();
                    }}
                    className="group flex items-center gap-2 hover:gap-3 transition-all cursor-pointer"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--text-muted)",
                      letterSpacing: "0.02em",
                      background: "transparent",
                      border: "none",
                    }}
                  >
                    <span style={{ color: "var(--accent)" }}>→</span>
                    <span className="group-hover:text-[var(--accent-bright)] transition-colors">
                      {prompt}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              transcript.map((item) => {
                const relatedAction = actions.find(
                  (a) => a.relatedTranscriptId === item.id,
                );
                return (
                  <div key={item.id} className="flex gap-4 items-start">
                    <span
                      className="uppercase pt-1 flex-shrink-0"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        letterSpacing: "0.14em",
                        minWidth: 48,
                        color:
                          item.role === "user"
                            ? "var(--accent)"
                            : "var(--text-faint)",
                      }}
                    >
                      {item.role === "user" ? "Maya" : "Lily"}
                    </span>
                    <div className="flex-1 flex flex-col gap-1">
                      <span
                        style={{
                          color: item.isFinal
                            ? "var(--text)"
                            : "var(--text-faint)",
                          fontStyle: item.isFinal ? "normal" : "italic",
                        }}
                      >
                        {item.text}
                        {!item.isFinal && (
                          <span style={{ opacity: 0.4 }}>...</span>
                        )}
                      </span>
                      {relatedAction && (
                        <span
                          className="flex items-center gap-2"
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 12,
                            color: "var(--text-faint)",
                          }}
                        >
                          <span
                            className="inline-block"
                            style={{
                              width: 8,
                              borderTop: "0.5px solid var(--text-faint)",
                              marginRight: 4,
                            }}
                          />
                          <span style={{ color: "var(--accent)" }}>
                            {relatedAction.tool}
                          </span>
                          <span
                            style={{
                              color:
                                relatedAction.status === "success"
                                  ? "var(--ok)"
                                  : "var(--pending)",
                            }}
                          >
                            · {relatedAction.status === "success" ? "ok" : "…"}
                          </span>
                        </span>
                      )}
                    </div>
                    <span
                      className="flex-shrink-0 pt-1.5"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: "var(--text-ghost)",
                      }}
                    >
                      {item.isFinal ? "—" : "live"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Bottom bar with mic */}
      <footer
        className="flex items-center gap-4 px-12 py-3.5 border-t"
        style={{ borderColor: "var(--border)", gridColumn: 1 }}
      >
        <button
          onClick={connected ? disconnect : connect}
          className="relative flex items-center justify-center rounded-full cursor-pointer"
          style={{
            width: 34,
            height: 34,
            border: "0.5px solid var(--accent)",
            background: connected ? "var(--accent-fill)" : "transparent",
          }}
        >
          {connected && (
            <span
              className="absolute rounded-full"
              style={{
                inset: -4,
                border: "0.5px solid var(--accent-ring)",
                animation: "ring 2s ease-in-out infinite",
              }}
            />
          )}
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            {connected ? (
              <rect
                x="4"
                y="4"
                width="8"
                height="8"
                rx="1"
                fill="var(--accent)"
              />
            ) : (
              <>
                <rect
                  x="5"
                  y="1"
                  width="6"
                  height="9"
                  rx="3"
                  fill="var(--accent)"
                />
                <path
                  d="M2.5 8.5a5.5 5.5 0 0 0 11 0"
                  stroke="var(--accent)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  fill="none"
                />
                <line
                  x1="8"
                  y1="14"
                  x2="8"
                  y2="16"
                  stroke="var(--accent)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </>
            )}
          </svg>
        </button>
        <div
          className="flex-1 uppercase"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--text-muted)",
            letterSpacing: "0.12em",
          }}
        >
          <span style={{ color: "var(--accent)" }}>{status}</span>
          {" — "}
          {connected ? "click mic to end" : "click mic to start"}
        </div>
      </footer>

      {/* Right drawer / spine */}
      <ActionDrawer
        actions={actions}
        open={drawerOpen}
        onToggle={() => setDrawerOpen((v) => !v)}
      />

      <style jsx global>{`
        @keyframes ring {
          0%,
          100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 0;
            transform: scale(1.4);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

function VolumeRuler({ listening }: { listening: boolean }) {
  const [levels, setLevels] = useState<number[]>(Array(8).fill(0.2));

  useEffect(() => {
    if (!listening) {
      setLevels(Array(8).fill(0.15));
      return;
    }
    const interval = setInterval(() => {
      setLevels(
        Array.from({ length: 8 }, (_, i) => {
          const peak = i === 4 ? 1 : Math.max(0.2, 1 - Math.abs(i - 4) * 0.18);
          return peak * (0.6 + Math.random() * 0.4);
        }),
      );
    }, 120);
    return () => clearInterval(interval);
  }, [listening]);

  return (
    <div className="flex flex-col items-start gap-1 pt-1">
      <div className="flex flex-col items-start gap-1">
        {levels.map((v, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-100"
            style={{
              height: 2,
              width: `${18 + v * 50}px`,
              background: v > 0.8 ? "var(--accent-bright)" : "var(--accent)",
              opacity: 0.2 + v * 0.8,
            }}
          />
        ))}
      </div>
      <span
        className="mt-1"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--text-faint)",
          letterSpacing: "0.08em",
        }}
      >
        -6dB
      </span>
    </div>
  );
}

function ActionDrawer({
  actions,
  open,
  onToggle,
}: {
  actions: ReturnType<typeof useRealtimeVoice>["actions"];
  open: boolean;
  onToggle: () => void;
}) {
  if (!open) {
    return (
      <aside
        onClick={onToggle}
        className="border-l flex flex-col items-center py-4 gap-2.5 cursor-pointer relative hover:bg-white/[0.03] transition-colors"
        style={{
          borderColor: "var(--border)",
          background: "var(--bg-raised)",
          gridColumn: 2,
          gridRow: "2 / 4",
          position: "relative",
        }}
      >
        <span
          className="absolute top-1/2 -translate-y-1/2 rounded  cursor-pointer"
          style={{
            left: -3,
            width: 6,
            height: 42,
            background: "var(--accent)",
            boxShadow: "0 0 8px rgba(212,112,58,0.5)",
          }}
        />
        {actions.length > 0 && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--accent)",
              fontWeight: 500,
              marginBottom: 6,
            }}
          >
            {actions.length}
          </span>
        )}
        <div className="flex flex-col gap-2 my-auto">
          {actions.slice(0, 5).map((a, i) => (
            <span
              key={a.id}
              className="rounded-full"
              style={{
                width: 5,
                height: 5,
                background:
                  a.status === "pending"
                    ? "var(--pending)"
                    : i === 0
                      ? "var(--accent)"
                      : "var(--ok)",
                boxShadow:
                  i === 0 && a.status !== "pending"
                    ? "0 0 4px var(--accent)"
                    : "none",
                animation:
                  a.status === "pending"
                    ? "pulse 1.2s ease-in-out infinite"
                    : "none",
              }}
            />
          ))}
        </div>
        <span
          className="uppercase mt-1"
          style={{
            writingMode: "vertical-rl",
            fontFamily: "var(--font-mono)",
            fontSize: 8,
            letterSpacing: "0.22em",
            color: "var(--text-faint)",
          }}
        >
          Actions
        </span>
      </aside>
    );
  }

  return (
    <aside
      className="border-l flex flex-col relative"
      style={{
        borderColor: "var(--border-strong)",
        background: "#17150f",
        gridColumn: 2,
        gridRow: "2 / 4",
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-3.5 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <span
          className="uppercase"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--text-muted)",
            letterSpacing: "0.14em",
          }}
        >
          Agent actions
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--accent)",
          }}
        >
          {actions.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto py-1.5">
        {actions.length === 0 && (
          <p
            className="text-center mt-6 px-4"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--text-faint)",
            }}
          >
            Tool calls will appear here
          </p>
        )}
        <span
          onClick={onToggle}
          className="absolute top-1/2 -translate-y-1/2 rounded cursor-pointer"
          style={{
            left: -3,
            width: 6,
            height: 42,
            background: "var(--accent)",
            boxShadow: "0 0 8px rgba(212,112,58,0.5)",
          }}
        />
        {actions.map((action, i) => (
          <div
            key={action.id}
            className="px-5 py-3 flex flex-col gap-1.5 border-b cursor-pointer transition-colors"
            style={{
              borderColor: "rgba(232,228,219,0.04)",
              background: i === 0 ? "rgba(212,112,58,0.05)" : "transparent",
              borderLeft:
                i === 0 ? "1px solid var(--accent)" : "1px solid transparent",
              paddingLeft: i === 0 ? 19 : 20,
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="rounded-full flex-shrink-0"
                style={{
                  width: 5,
                  height: 5,
                  background:
                    action.status === "success"
                      ? "var(--ok)"
                      : action.status === "error"
                        ? "#e24b4a"
                        : "var(--pending)",
                  animation:
                    action.status === "pending"
                      ? "pulse 1.2s ease-in-out infinite"
                      : "none",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--text)",
                  fontWeight: 500,
                }}
              >
                {action.tool}
              </span>
              <span
                className="ml-auto"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-faint)",
                }}
              >
                {action.timestamp}
              </span>
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--text-muted)",
                paddingLeft: 13,
                lineHeight: 1.6,
              }}
            >
              {Object.entries(action.args)
                .filter(([k]) => k !== "__call_id")
                .map(([k, v]) => (
                  <div key={k}>
                    <span style={{ color: "var(--text-faint)" }}>{k}:</span>{" "}
                    <span style={{ color: "var(--text)" }}>
                      {JSON.stringify(v)}
                    </span>
                  </div>
                ))}
            </div>
            {action.result != null && (
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color:
                    action.status === "success"
                      ? "var(--ok)"
                      : "var(--pending)",
                  paddingLeft: 13,
                }}
              >
                →{" "}
                {typeof action.result === "string"
                  ? action.result
                  : JSON.stringify(action.result)}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
