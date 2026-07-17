const WEBHOOK_RE = /^https:\/\/(?:canary\.|ptb\.)?discord\.com\/api\/webhooks\/\d+\/[\w-]+$/;

type Body = {
  action?: "send" | "edit" | "delete";
  url?: string;
  messageId?: string;
  payload?: unknown;
};

/**
 * Portable handler for a separately deployed Discord webhook proxy.
 * GitHub Pages cannot run API routes, so expose this from a serverless function
 * and set NEXT_PUBLIC_DISCORD_WEBHOOK_PROXY_URL to that function's URL.
 */
export async function handleDiscordWebhook(request: Request): Promise<Response> {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!WEBHOOK_RE.test(url)) {
    return Response.json(
      { error: "URL must be a Discord webhook: https://discord.com/api/webhooks/…" },
      { status: 400 },
    );
  }

  const action = body.action ?? "send";
  const messageId = typeof body.messageId === "string" ? body.messageId.trim() : "";
  if ((action === "edit" || action === "delete") && !/^\d{15,21}$/.test(messageId)) {
    return Response.json({ error: "messageId must be the numeric ID of a sent message." }, { status: 400 });
  }
  if ((action === "send" || action === "edit") && (body.payload === undefined || typeof body.payload !== "object")) {
    return Response.json({ error: "Missing JSON payload." }, { status: 400 });
  }

  const target = action === "send" ? `${url}?wait=true` : `${url}/messages/${messageId}`;
  const method = action === "send" ? "POST" : action === "edit" ? "PATCH" : "DELETE";

  try {
    const response = await fetch(target, {
      method,
      headers: action === "delete" ? undefined : { "Content-Type": "application/json" },
      body: action === "delete" ? undefined : JSON.stringify(body.payload),
    });
    const text = await response.text();
    let result: unknown = null;
    try {
      result = text ? JSON.parse(text) : null;
    } catch {}
    return Response.json({ status: response.status, body: result ?? text.slice(0, 2000) });
  } catch {
    return Response.json({ error: "Could not reach Discord. Check the URL and retry." }, { status: 502 });
  }
}
