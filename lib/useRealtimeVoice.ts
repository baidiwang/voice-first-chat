"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type ActionItem = {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  status: "pending" | "success" | "error";
  result?: unknown;
  timestamp: string;
  relatedTranscriptId?: string;
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
  const [volume, setVolume] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // For monitoring audio levels
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const volumeRafRef = useRef<number | null>(null);

  const addAction = useCallback(
    (item: Omit<ActionItem, "id" | "timestamp">) => {
      const newItem: ActionItem = {
        ...item,
        id: `action_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
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
      const relatedId = args.__related_transcript_id as string | undefined;

      const actionId = addAction({
        tool: toolName,
        args,
        status: "pending",
        relatedTranscriptId: relatedId,
      });
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
      //   console.log("[realtime]", msg.type, msg);

      if (msg.type === "conversation.item.input_audio_transcription.delta") {
        const text = msg.delta ?? "";
        setTranscript((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "user" && !last.isFinal) {
            return [...prev.slice(0, -1), { ...last, text: last.text + text }];
          }
          return [
            ...prev,
            {
              id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              role: "user",
              text,
              isFinal: false,
            },
          ];
        });
      }

      if (
        msg.type === "conversation.item.input_audio_transcription.completed" ||
        msg.type === "conversation.item.input_audio_transcription.failed"
      ) {
        setTranscript((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "user" && !last.isFinal) {
            return [...prev.slice(0, -1), { ...last, isFinal: true }];
          }
          return prev;
        });
      }

      if (
        msg.type === "response.audio_transcript.delta" ||
        msg.type === "response.output_audio_transcript.delta"
      ) {
        const text = msg.delta ?? "";
        setTranscript((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "assistant" && !last.isFinal) {
            return [...prev.slice(0, -1), { ...last, text: last.text + text }];
          }
          return [
            ...prev,
            {
              id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              role: "assistant",
              text,
              isFinal: false,
            },
          ];
        });
      }

      if (
        msg.type === "response.audio_transcript.done" ||
        msg.type === "response.output_audio_transcript.done"
      ) {
        setTranscript((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "assistant") {
            return [...prev.slice(0, -1), { ...last, isFinal: true }];
          }
          return prev;
        });
      }

      if (msg.type === "response.done") {
        setTranscript((prev) =>
          prev.map((t) => (t.isFinal ? t : { ...t, isFinal: true })),
        );
      }

      if (msg.type === "response.function_call_arguments.done") {
        const args = JSON.parse(msg.arguments);
        setTranscript((prev) => {
          const lastUser = [...prev].reverse().find((t) => t.role === "user");
          handleToolCall(msg.name, {
            ...args,
            __call_id: msg.call_id,
            __related_transcript_id: lastUser?.id,
          });
          return prev;
        });
      }
    },
    [handleToolCall],
  );

  const connect = useCallback(async () => {
    // Clean up any existing connection
    if (pcRef.current) {
      //   console.log("[connect] cleaning up previous connection");
      pcRef.current.close();
      pcRef.current = null;
      dcRef.current = null;
    }

    // console.log("[connect] 1. fetching session");
    const sessionRes = await fetch("/api/session", { method: "POST" });
    const session = await sessionRes.json();
    // console.log("[connect] 2. session response:", session);

    const ephemeralKey = session.value;
    if (!ephemeralKey) {
      //   console.error("[connect] no ephemeral key!", session);
      return;
    }
    console.log("[connect] 3. got ephemeral key");

    // Create peer connection
    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    // CRITICAL ORDER: data channel FIRST, before anything else on pc
    const dc = pc.createDataChannel("oai-events");
    dcRef.current = dc;
    dc.addEventListener("open", () => {
      //   console.log("[connect] data channel OPEN");
    });
    dc.addEventListener("close", () => {
      //   console.log("[connect] data channel CLOSED");
    });
    dc.addEventListener("message", handleDataChannelMessage);

    // Set up audio output
    pc.ontrack = (e) => {
      console.log("[connect] ontrack fired");
      const audio = new Audio();
      audio.autoplay = true;
      audio.srcObject = e.streams[0];
      audioRef.current = audio;
    };

    // Get microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // console.log("[connect] 4. got mic stream");
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    setListening(true);

    // Set up audio analyser for real-time volume
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const updateVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const avg = sum / dataArray.length / 255;
      setVolume(avg);
      volumeRafRef.current = requestAnimationFrame(updateVolume);
    };
    updateVolume();

    // Monitor states
    pc.addEventListener("connectionstatechange", () => {
      //   console.log("[connect] pc state:", pc.connectionState);
    });
    pc.addEventListener("iceconnectionstatechange", () => {
      //   console.log("[connect] ice state:", pc.iceConnectionState);
    });

    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    // console.log("[connect] 5. offer created");

    const sdpRes = await fetch(
      `https://api.openai.com/v1/realtime/calls?model=gpt-realtime`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      },
    );

    if (!sdpRes.ok) {
      const errText = await sdpRes.text();
      //   console.error("[connect] sdp error:", sdpRes.status, errText);
      return;
    }

    const answerSdp = await sdpRes.text();
    // console.log("[connect] 6. got answer sdp");

    await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
    // console.log("[connect] 7. connection established");
    setConnected(true);
  }, [handleDataChannelMessage]);

  const disconnect = useCallback(() => {
    if (volumeRafRef.current) cancelAnimationFrame(volumeRafRef.current);
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    setVolume(0);

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

  return {
    connected,
    listening,
    transcript,
    actions,
    connect,
    disconnect,
    volume,
  };
}
