import { NextResponse } from "next/server";

export async function POST() {
  const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      model: "gpt-4o-realtime-preview-2024-12-17",
      voice: "alloy",
      instructions: `You are Lily, a voice assistant helping sales reps after customer calls. 
You help them: capture structured post-call notes, create follow-up tasks, and answer questions about the call.
Be concise since this is a voice interface. When the rep mentions notes or tasks, call the appropriate tool.`,

      input_audio_transcription: {
        model: "whisper-1",
      },
      //   turn_detection: {
      //     type: "server_vad",
      //     threshold: 0.5,
      //     prefix_padding_ms: 300,
      //     silence_duration_ms: 500,
      //   },

      tools: [
        {
          type: "function",
          name: "save_note",
          description: "Save a structured post-call note",
          parameters: {
            type: "object",
            properties: {
              summary: { type: "string", description: "Summary of the call" },
              customer: { type: "string", description: "Customer name" },
              sentiment: {
                type: "string",
                enum: ["positive", "neutral", "negative"],
              },
            },
            required: ["summary"],
          },
        },
        {
          type: "function",
          name: "create_task",
          description: "Create a follow-up task or reminder",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Task title" },
              due: {
                type: "string",
                description: "Due date/time in ISO format",
              },
            },
            required: ["title"],
          },
        },
        {
          type: "function",
          name: "search_context",
          description: "Search for customer or deal context",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query" },
            },
            required: ["query"],
          },
        },
      ],
      tool_choice: "auto",
    }),
  });

  const data = await r.json();
  return NextResponse.json(data);
}
