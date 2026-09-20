import type { StoredMessage } from "@hazemgharib/ai-agent-contracts";
import type { ThreadMessageLike } from "@assistant-ui/react";

/** Convert contract StoredMessage → assistant-ui ThreadMessageLike for thread.reset(). */
export function toThreadMessageLike(
  message: StoredMessage,
): ThreadMessageLike {
  return {
    id: message.messageId,
    role: message.role,
    content: message.content,
    createdAt: new Date(message.createdAt),
    status:
      message.role === "assistant"
        ? { type: "complete", reason: "stop" }
        : undefined,
  };
}

export function toThreadMessages(
  messages: readonly StoredMessage[],
): ThreadMessageLike[] {
  return messages.map(toThreadMessageLike);
}
