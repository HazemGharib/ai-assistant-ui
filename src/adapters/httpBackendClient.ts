import {
  ConversationListResponseSchema,
  ConversationSchema,
  MessageListResponseSchema,
  StreamEventSchema,
  StreamMessageRequestSchema,
  type StreamEvent,
  type StreamMessageRequest,
} from "@hazemgharib/ai-agent-contracts";
import type { BackendClient } from "./backendClient";
import { ConversationNotFoundError } from "./errors";

export type HttpBackendClientOptions = {
  baseUrl: string;
};

async function readSseStream(
  res: Response,
  signal?: AbortSignal,
): Promise<AsyncIterable<StreamEvent>> {
  if (!res.body) {
    throw new Error("Stream response missing body");
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  return {
    async *[Symbol.asyncIterator]() {
      try {
        while (true) {
          if (signal?.aborted) break;
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const part of parts) {
            const dataLine = part
              .split("\n")
              .find((line) => line.startsWith("data:"));
            if (!dataLine) continue;
            const jsonText = dataLine.replace(/^data:\s?/, "").trim();
            if (!jsonText || jsonText === "[DONE]") continue;
            try {
              const parsed = StreamEventSchema.safeParse(JSON.parse(jsonText));
              if (parsed.success) yield parsed.data;
            } catch {
              /* skip malformed */
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    },
  };
}

export function createHttpBackendClient(
  options: HttpBackendClientOptions,
): BackendClient {
  const baseUrl = options.baseUrl.replace(/\/$/, "");

  return {
    async listConversations() {
      const res = await fetch(`${baseUrl}/v1/conversations`);
      const json: unknown = await res.json();
      if (!res.ok) throw new Error(`List conversations failed: ${res.status}`);
      return ConversationListResponseSchema.parse(json);
    },

    async createConversation(body) {
      const res = await fetch(`${baseUrl}/v1/conversations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const json: unknown = await res.json();
      if (!res.ok) throw new Error(`Create conversation failed: ${res.status}`);
      return ConversationSchema.parse(json);
    },

    async getMessages(conversationId) {
      const res = await fetch(
        `${baseUrl}/v1/conversations/${conversationId}/messages`,
      );
      const json: unknown = await res.json();
      if (res.status === 404) {
        throw new ConversationNotFoundError(conversationId, json);
      }
      if (!res.ok) throw new Error(`Get messages failed: ${res.status}`);
      return MessageListResponseSchema.parse(json);
    },

    async *streamMessage(
      conversationId: string,
      body: StreamMessageRequest,
      opts?: { signal?: AbortSignal },
    ): AsyncIterable<StreamEvent> {
      const request = StreamMessageRequestSchema.parse(body);
      const res = await fetch(
        `${baseUrl}/v1/conversations/${conversationId}/messages:stream`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "text/event-stream",
          },
          body: JSON.stringify(request),
          signal: opts?.signal,
        },
      );

      if (!res.ok) {
        let message = `Stream failed HTTP ${res.status}`;
        try {
          const errJson: unknown = await res.json();
          if (
            typeof errJson === "object" &&
            errJson &&
            "message" in errJson &&
            typeof (errJson as { message: unknown }).message === "string"
          ) {
            message = (errJson as { message: string }).message;
          }
        } catch {
          /* ignore */
        }
        yield {
          type: "error",
          code: res.status === 404 ? "NOT_FOUND" : "INTERNAL_ERROR",
          message,
          boundary: "backend",
        };
        return;
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("text/event-stream")) {
        yield* await readSseStream(res, opts?.signal);
        return;
      }

      // Fallback: non-SSE JSON ChatResponse-like (shouldn't happen on 0.2)
      const json: unknown = await res.json();
      yield {
        type: "error",
        code: "INTERNAL_ERROR",
        message: `Unexpected content-type: ${contentType}; body=${JSON.stringify(json).slice(0, 120)}`,
        boundary: "backend",
      };
    },
  };
}
