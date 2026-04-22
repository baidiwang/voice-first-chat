"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type ActionItem = {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  status: "pending" | "success" | "error";
  result?: unknown;
  timestamp: string;
};

export type TranscriptItem = {
  id: string;
  role: "user" | "assistant";
  text: string;
  isFinal: boolean;
  confidence?: number;
};

export function useRealtimeVoice() {
  const [connected, setConnected] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const addAction = useCallback(
    (item: Omit<ActionItem, "id" | "timestamp">) => {
      const newItem: ActionItem = {
        ...item,
        id: `action_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setActions((prev) => [newItem, ...prev]);
      return newItem.id;
    },
    [],
  );

  const updateAction = useCallback((id: string, patch: Partial<ActionItem>) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );
  }, []);

  const handleToolCall = useCallback(
    async (toolName: string, args: Record<string, unknown>) => {
      const actionId = addAction({ tool: toolName, args, status: "pending" });
      try {
        const res = await fetch("/api/tools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tool: toolName, args }),
        });
        const result = await res.json();
        updateAction(actionId, { status: "success", result });

        // send result back to the realtime model
        dcRef.current?.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id: (args as Record<string, string>).__call_id,
              output: JSON.stringify(result),
            },
          }),
        );
        dcRef.current?.send(JSON.stringify({ type: "response.create" }));
      } catch (e) {
        updateAction(actionId, { status: "error", result: String(e) });
      }
    },
    [addAction, updateAction],
  );

  const handleDataChannelMessage = useCallback(
    (event: MessageEvent) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "conversation.item.input_audio_transcription.delta") {
        const text = msg.delta ?? "";
        setTranscript((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "user" && !last.isFinal) {
            return [...prev.slice(0, -1), { ...last, text: last.text + text }];
          }
          return [
            ...prev,
            { id: `t_${Date.now()}`, role: "user", text, isFinal: false },
          ];
        });
      }

      if (
        msg.type === "conversation.item.input_audio_transcription.completed"
      ) {
        setTranscript((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "user" && !last.isFinal) {
            return [...prev.slice(0, -1), { ...last, isFinal: true }];
          }
          return prev;
        });
      }

      if (msg.type === "response.audio_transcript.delta") {
        const text = msg.delta ?? "";
        setTranscript((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "assistant" && !last.isFinal) {
            return [...prev.slice(0, -1), { ...last, text: last.text + text }];
          }
          return [
            ...prev,
            { id: `t_${Date.now()}`, role: "assistant", text, isFinal: false },
          ];
        });
      }

      if (msg.type === "response.audio_transcript.done") {
        setTranscript((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "assistant") {
            return [...prev.slice(0, -1), { ...last, isFinal: true }];
          }
          return prev;
        });
      }

      if (msg.type === "response.function_call_arguments.done") {
        const args = JSON.parse(msg.arguments);
        handleToolCall(msg.name, { ...args, __call_id: msg.call_id });
      }
    },
    [handleToolCall],
  );

  const connect = useCallback(async () => {
    const sessionRes = await fetch("/api/session", { method: "POST" });
    const session = await sessionRes.json();
    const ephemeralKey = session.client_secret?.value;
    if (!ephemeralKey) return;

    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    const audio = new Audio();
    audio.autoplay = true;
    audioRef.current = audio;
    pc.ontrack = (e) => {
      audio.srcObject = e.streams[0];
    };

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    setListening(true);

    const dc = pc.createDataChannel("oai-events");
    dcRef.current = dc;
    dc.onmessage = handleDataChannelMessage;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const sdpRes = await fetch(
      "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      },
    );

    const answerSdp = await sdpRes.text();
    await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
    setConnected(true);
  }, [handleDataChannelMessage]);

  const disconnect = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    dcRef.current = null;
    setConnected(false);
    setListening(false);
  }, []);

  useEffect(() => {
    return () => {
      pcRef.current?.close();
    };
  }, []);

  return { connected, listening, transcript, actions, connect, disconnect };
}
