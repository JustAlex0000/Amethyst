import { NextRequest, NextResponse } from "next/server";

const WEBHOOK_RE = /^https:\/\/(?:canary\.|ptb\.)?discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;

type Body = {
  action?: "send" | "edit" | "delete";
  url?: string;
  messageId?: string;
  payload?: unknown;
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!WEBHOOK_RE.test(url)) {
    return NextResponse.json(
      { error: "URL must be a Discord webhook: https://discord.com/api/webhooks/…" },
      { status: 400 }
    );
  }

  const action = body.action ?? "send";
  const messageId = typeof body.messageId === "string" ? body.messageId.trim() : "";
  if ((action === "edit" || action === "delete") && !/^\d{15,21}$/.test(messageId)) {
    return NextResponse.json({ error: "messageId must be the numeric ID of a sent message." }, { status: 400 });
  }
  if ((action === "send" || action === "edit") && (body.payload === undefined || typeof body.payload !== "object")) {
    return NextResponse.json({ error: "Missing JSON payload." }, { status: 400 });
  }

  let target: string;
  let method: string;
  if (action === "send") {
    target = `${url}?wait=true`;
    method = "POST";
  } else if (action === "edit") {
    target = `${url}/messages/${messageId}`;
    method = "PATCH";
  } else {
    target = `${url}/messages/${messageId}`;
    method = "DELETE";
  }

  try {
    const res = await fetch(target, {
      method,
      headers: action === "delete" ? undefined : { "Content-Type": "application/json" },
      body: action === "delete" ? undefined : JSON.stringify(body.payload),
    });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {}
    return NextResponse.json({ status: res.status, body: json ?? text.slice(0, 2000) });
  } catch {
    return NextResponse.json({ error: "Could not reach Discord. Check the URL and retry." }, { status: 502 });
  }
}
