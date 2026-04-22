import { NextResponse } from "next/server";

const notes: unknown[] = [];
const tasks: unknown[] = [];

export async function POST(req: Request) {
  const { tool, args } = await req.json();

  if (tool === "save_note") {
    const note = {
      id: `note_${Date.now()}`,
      ...args,
      createdAt: new Date().toISOString(),
    };
    notes.push(note);
    return NextResponse.json({ success: true, noteId: note.id });
  }

  if (tool === "create_task") {
    const task = {
      id: `task_${Date.now()}`,
      ...args,
      createdAt: new Date().toISOString(),
    };
    tasks.push(task);
    return NextResponse.json({ success: true, taskId: task.id });
  }

  if (tool === "search_context") {
    return NextResponse.json({
      success: true,
      results: [
        { type: "deal", title: "Enterprise Q2 renewal", stage: "negotiation" },
        { type: "contact", name: args.query, lastContact: "2026-04-15" },
      ],
    });
  }

  return NextResponse.json({ error: "Unknown tool" }, { status: 400 });
}
