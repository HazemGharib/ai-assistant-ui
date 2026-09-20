import type { ChatModelAdapter, ThreadMessage } from "@assistant-ui/react";
import {
  ChatRequestSchema,
  ChatResponseSchema,
  type ChatRequest,
  type ChatResponse,
} from "@hazemgharib/ai-agent-contracts";

function lastUserText(messages: readonly ThreadMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message?.role !== "user") continue;

    const text = message.content
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n")
      .trim();

    if (text) return text;
  }

  return "";
}

function conversationIdFrom(messages: readonly ThreadMessage[]): string {
  const first = messages[0];
  if (first && "id" in first && typeof first.id === "string" && first.id.length > 0) {
    // Prefer a stable uuid-looking id when available; otherwise fixed smoke uuid.
    const uuidLike =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidLike.test(first.id)) return first.id;
  }
  return "00000000-0000-4000-8000-000000000010";
}

export type HttpBackendAdapterOptions = {
  baseUrl: string;
};

/**
 * Posts to backend `POST /v1/chat` using @hazemgharib/ai-agent-contracts types.
 * Selected when `VITE_BACKEND_BASE_URL` is set.
 */
export function createHttpBackendAdapter(
  options: HttpBackendAdapterOptions,
): ChatModelAdapter {
  const baseUrl = options.baseUrl.replace(/\/$/, "");

  return {
    async *run({ messages, abortSignal }) {
      const prompt = lastUserText(messages);
      const request: ChatRequest = ChatRequestSchema.parse({
        conversationId: conversationIdFrom(messages),
        message: {
          messageId: crypto.randomUUID(),
          role: "user",
          content: prompt || "(empty)",
          createdAt: new Date().toISOString(),
        },
      });

      const res = await fetch(`${baseUrl}/v1/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
        signal: abortSignal,
      });

      const json: unknown = await res.json();
      if (!res.ok) {
        const message =
          typeof json === "object" &&
          json !== null &&
          "message" in json &&
          typeof (json as { message: unknown }).message === "string"
            ? (json as { message: string }).message
            : `Backend error HTTP ${res.status}`;
        yield { content: [{ type: "text", text: `Error: ${message}` }] };
        return;
      }

      const parsed: ChatResponse = ChatResponseSchema.parse(json);
      yield {
        content: [{ type: "text", text: parsed.message.content }],
      };
    },
  };
}
