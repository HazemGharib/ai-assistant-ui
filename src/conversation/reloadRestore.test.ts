import { describe, expect, it, beforeEach } from "vitest";
import { createMockBackendClient } from "../adapters/mockBackend/client";
import { createMockStore } from "../adapters/mockBackend/store";
import { createConversationStore } from "./conversationStore";

describe("reload restore", () => {
  const store = createMockStore();
  const client = createMockBackendClient({
    store,
    streamOptions: { replyText: "restored", chunkDelayMs: 0 },
  });

  beforeEach(() => {
    store.reset();
    try {
      sessionStorage.clear();
    } catch {
      /* node */
    }
  });

  it("re-lists and re-fetches messages after simulated reload", async () => {
    const convStore1 = createConversationStore(client);
    const created = await convStore1.createConversation("Persist");
    for await (const _ of client.streamMessage(created.conversationId, {
      message: {
        messageId: crypto.randomUUID(),
        role: "user",
        content: "remember me",
        createdAt: new Date().toISOString(),
      },
    })) {
      /* drain */
    }

    // Simulate reload: new store instance, same underlying mock store
    const convStore2 = createConversationStore(client);
    await convStore2.refreshList();
    expect(convStore2.getState().conversations.length).toBeGreaterThanOrEqual(1);
    await convStore2.selectConversation(created.conversationId);
    const messages = convStore2.getState().messages;
    expect(messages.some((m) => m.content.includes("remember me"))).toBe(true);
  });
});
