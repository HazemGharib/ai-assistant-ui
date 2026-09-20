import type { ChatModelAdapter, ThreadMessage } from "@assistant-ui/react";
import type { Citation, StreamEvent } from "@hazemgharib/ai-agent-contracts";
import type { BackendClient } from "./backendClient";
import type { ConversationStore } from "../conversation/conversationStore";
import { createHttpBackendClient } from "./httpBackendClient";
import { createConversationStore } from "../conversation/conversationStore";

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

export type CreateStreamingAdapterOptions = {
  client: BackendClient;
  store: ConversationStore;
  onCitations?: (citations: Citation[]) => void;
};

/**
 * assistant-ui ChatModelAdapter that streams via BackendClient.
 * Stop maps to abortSignal from assistant-ui Cancel.
 */
export function createStreamingChatAdapter(
  options: CreateStreamingAdapterOptions,
): ChatModelAdapter {
  const { client, store, onCitations } = options;

  return {
    async *run({ messages, abortSignal }) {
      const prompt = lastUserText(messages);
      if (!prompt) {
        yield { content: [{ type: "text", text: "" }] };
        return;
      }

      let conversationId: string;
      try {
        conversationId = await store.ensureActiveConversation();
      } catch (err) {
        yield {
          content: [
            {
              type: "text",
              text: `Error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
        };
        return;
      }

      const controller = store.beginStream();
      const onAbort = () => controller.abort();
      abortSignal.addEventListener("abort", onAbort);

      const citations: Citation[] = [];
      let accumulated = "";
      let failed = false;

      try {
        const stream = client.streamMessage(
          conversationId,
          {
            message: {
              messageId: crypto.randomUUID(),
              role: "user",
              content: prompt,
              createdAt: new Date().toISOString(),
            },
          },
          { signal: controller.signal },
        );

        for await (const event of stream) {
          applyStreamEvent(event, {
            onDelta: (delta) => {
              accumulated += delta;
            },
            onCitation: (c) => citations.push(c),
            onActivity: (label) => store.setActivityLabel(label),
            onError: (message) => {
              failed = true;
              accumulated = accumulated
                ? `${accumulated}\n\nError: ${message}`
                : `Error: ${message}`;
            },
            onCompleted: (full) => {
              accumulated = full;
            },
          });

          if (accumulated) {
            yield {
              content: [{ type: "text", text: accumulated }],
            };
          }

          if (event.type === "error" || event.type === "message.completed") {
            break;
          }
          if (controller.signal.aborted || abortSignal.aborted) {
            break;
          }
        }

        if (citations.length > 0) {
          onCitations?.(citations);
        }

        if (
          !failed &&
          !controller.signal.aborted &&
          !abortSignal.aborted &&
          accumulated
        ) {
          const queued = store.queue.take();
          store.clearQueued();
          if (queued) {
            queueMicrotask(() => {
              window.dispatchEvent(
                new CustomEvent("ai-assistant-queue-flush", {
                  detail: { text: queued },
                }),
              );
            });
          }
        }
      } catch (err) {
        if (abortSignal.aborted || controller.signal.aborted) {
          if (accumulated) {
            yield { content: [{ type: "text", text: accumulated }] };
          }
          return;
        }
        const message = err instanceof Error ? err.message : String(err);
        yield {
          content: [
            {
              type: "text",
              text: accumulated
                ? `${accumulated}\n\nError: ${message}`
                : `Error: ${message}`,
            },
          ],
        };
      } finally {
        abortSignal.removeEventListener("abort", onAbort);
        store.endStream();
        void store.refreshList();
      }
    },
  };
}

type StreamHandlers = {
  onDelta: (delta: string) => void;
  onCitation: (c: Citation) => void;
  onActivity: (label: string | null) => void;
  onError: (message: string) => void;
  onCompleted: (full: string) => void;
};

function applyStreamEvent(event: StreamEvent, handlers: StreamHandlers): void {
  switch (event.type) {
    case "message.delta":
      handlers.onDelta(event.delta);
      break;
    case "citation":
      handlers.onCitation(event.citation);
      break;
    case "activity":
      handlers.onActivity(
        event.activity.status === "completed" ||
          event.activity.status === "failed"
          ? null
          : event.activity.label,
      );
      break;
    case "message.completed":
      handlers.onCompleted(event.message.content);
      handlers.onActivity(null);
      break;
    case "error":
      handlers.onError(event.message);
      handlers.onActivity(null);
      break;
    default:
      break;
  }
}

/** Phase 1 compatibility helper — prefer RuntimeProvider wiring. */
export function createHttpBackendAdapter(options: {
  baseUrl: string;
}): ChatModelAdapter {
  const client = createHttpBackendClient(options);
  const store = createConversationStore(client);
  return createStreamingChatAdapter({ client, store });
}
