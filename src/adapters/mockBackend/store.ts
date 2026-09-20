import type {
  Citation,
  Conversation,
  StoredMessage,
  StreamEvent,
} from "@hazemgharib/ai-agent-contracts";

export type MockConversationRecord = Conversation & {
  messages: StoredMessage[];
};

function nowIso(): string {
  return new Date().toISOString();
}

/** Module-scoped persisting store for mock mode + Vitest. */
export function createMockStore() {
  const conversations = new Map<string, MockConversationRecord>();

  function list(): Conversation[] {
    return [...conversations.values()]
      .map(({ messages: _m, ...c }) => c)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  function create(title?: string | null): Conversation {
    const conversationId = crypto.randomUUID();
    const ts = nowIso();
    const record: MockConversationRecord = {
      conversationId,
      title: title ?? null,
      createdAt: ts,
      updatedAt: ts,
      messages: [],
    };
    conversations.set(conversationId, record);
    return {
      conversationId: record.conversationId,
      title: record.title,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  function get(conversationId: string): MockConversationRecord | undefined {
    return conversations.get(conversationId);
  }

  function appendMessages(
    conversationId: string,
    msgs: StoredMessage[],
  ): void {
    const record = conversations.get(conversationId);
    if (!record) throw new Error(`Unknown conversation ${conversationId}`);
    record.messages.push(...msgs);
    record.updatedAt = nowIso();
    if (!record.title) {
      const firstUser = record.messages.find((m) => m.role === "user");
      if (firstUser) {
        record.title = firstUser.content.slice(0, 48);
      }
    }
  }

  function reset(): void {
    conversations.clear();
  }

  return { list, create, get, appendMessages, reset };
}

export type MockStore = ReturnType<typeof createMockStore>;

/** Shared default store so reload in the same JS realm restores data. */
export const defaultMockStore: MockStore = createMockStore();

export type StreamFixtureOptions = {
  replyText?: string;
  citations?: Citation[];
  emitActivity?: boolean;
  chunkDelayMs?: number;
};

export async function* streamAssistantReply(
  conversationId: string,
  userContent: string,
  store: MockStore,
  options: StreamFixtureOptions = {},
  signal?: AbortSignal,
): AsyncGenerator<StreamEvent> {
  const record = store.get(conversationId);
  if (!record) {
    yield {
      type: "error",
      code: "NOT_FOUND",
      message: "Conversation not found",
      boundary: "backend",
    };
    return;
  }

  const userMessage: StoredMessage = {
    messageId: crypto.randomUUID(),
    role: "user",
    content: userContent,
    createdAt: nowIso(),
  };
  store.appendMessages(conversationId, [userMessage]);

  const messageId = crypto.randomUUID();
  const replyText =
    options.replyText ??
    `Mock reply to: “${userContent}”. (contract-faithful stream)`;
  const delay = options.chunkDelayMs ?? 12;

  if (options.emitActivity) {
    yield {
      type: "activity",
      messageId,
      activity: {
        activityId: crypto.randomUUID(),
        kind: "retrieval",
        label: "Searching knowledge",
        status: "started",
        at: nowIso(),
      },
    };
  }

  let accumulated = "";
  const words = replyText.split(/(\s+)/);
  for (const word of words) {
    if (signal?.aborted) {
      store.appendMessages(conversationId, [
        {
          messageId,
          role: "assistant",
          content: accumulated || "(stopped)",
          createdAt: nowIso(),
          citations: options.citations,
        },
      ]);
      return;
    }
    accumulated += word;
    yield { type: "message.delta", messageId, delta: word };
    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  if (options.emitActivity) {
    yield {
      type: "activity",
      messageId,
      activity: {
        activityId: crypto.randomUUID(),
        kind: "retrieval",
        label: "Searching knowledge",
        status: "completed",
        at: nowIso(),
      },
    };
  }

  const citations = options.citations;
  if (citations) {
    for (const citation of citations) {
      yield { type: "citation", messageId, citation };
    }
  }

  const assistant: StoredMessage = {
    messageId,
    role: "assistant",
    content: accumulated,
    createdAt: nowIso(),
    citations,
  };
  store.appendMessages(conversationId, [assistant]);

  yield {
    type: "message.completed",
    messageId,
    message: {
      messageId,
      role: "assistant",
      content: accumulated,
      createdAt: assistant.createdAt,
    },
    citations,
  };
}
