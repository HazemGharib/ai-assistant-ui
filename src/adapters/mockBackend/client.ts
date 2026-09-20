import type {
  Conversation,
  ConversationListResponse,
  CreateConversationRequest,
  MessageListResponse,
  StreamEvent,
  StreamMessageRequest,
} from "@hazemgharib/ai-agent-contracts";
import type { BackendClient } from "../backendClient";
import { ConversationNotFoundError } from "../errors";
import { sampleCitations } from "./fixtures";
import {
  defaultMockStore,
  streamAssistantReply,
  type MockStore,
  type StreamFixtureOptions,
} from "./store";

export type CreateMockBackendClientOptions = {
  store?: MockStore;
  streamOptions?: StreamFixtureOptions;
};

export function createMockBackendClient(
  options: CreateMockBackendClientOptions = {},
): BackendClient {
  const store = options.store ?? defaultMockStore;
  const streamOptions = options.streamOptions ?? {
    emitActivity: true,
    citations: sampleCitations,
    chunkDelayMs: 8,
  };

  return {
    async listConversations(): Promise<ConversationListResponse> {
      return { conversations: store.list() };
    },

    async createConversation(
      body?: CreateConversationRequest,
    ): Promise<Conversation> {
      return store.create(body?.title);
    },

    async getMessages(conversationId: string): Promise<MessageListResponse> {
      const record = store.get(conversationId);
      if (!record) {
        throw new ConversationNotFoundError(conversationId);
      }
      return {
        conversationId,
        messages: [...record.messages],
      };
    },

    async *streamMessage(
      conversationId: string,
      body: StreamMessageRequest,
      opts?: { signal?: AbortSignal },
    ): AsyncIterable<StreamEvent> {
      yield* streamAssistantReply(
        conversationId,
        body.message.content,
        store,
        streamOptions,
        opts?.signal,
      );
    },
  };
}
