/** Thrown when a conversation id is unknown to the backend (stale client hint). */
export class ConversationNotFoundError extends Error {
  readonly conversationId: string;

  constructor(conversationId: string, cause?: unknown) {
    super(`Conversation not found: ${conversationId}`);
    this.name = "ConversationNotFoundError";
    this.conversationId = conversationId;
    if (cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = cause;
    }
  }
}

export function isConversationNotFoundError(
  err: unknown,
): err is ConversationNotFoundError {
  return err instanceof ConversationNotFoundError;
}
