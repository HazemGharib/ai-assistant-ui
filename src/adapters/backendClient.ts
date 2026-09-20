import type {
  Conversation,
  ConversationListResponse,
  CreateConversationRequest,
  MessageListResponse,
  StreamEvent,
  StreamMessageRequest,
} from "@hazemgharib/ai-agent-contracts";

/**
 * Contract-shaped backend client used by UI adapters.
 * Implementations: HTTP (live backend) or in-memory mock.
 */
export type BackendClient = {
  listConversations(): Promise<ConversationListResponse>;
  createConversation(
    body?: CreateConversationRequest,
  ): Promise<Conversation>;
  getMessages(conversationId: string): Promise<MessageListResponse>;
  streamMessage(
    conversationId: string,
    body: StreamMessageRequest,
    options?: { signal?: AbortSignal },
  ): AsyncIterable<StreamEvent>;
};
