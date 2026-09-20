import { describe, expect, it, beforeEach } from "vitest";
import { createMockBackendClient } from "./client";
import { createMockStore } from "./store";

describe("mockBackend conversations", () => {
  const store = createMockStore();
  const client = createMockBackendClient({
    store,
    streamOptions: { replyText: "ok", chunkDelayMs: 0 },
  });

  beforeEach(() => {
    store.reset();
  });

  it("list/create/switch without message bleed", async () => {
    const a = await client.createConversation({ title: "A" });
    const b = await client.createConversation({ title: "B" });

    for await (const _ of client.streamMessage(a.conversationId, {
      message: {
        messageId: crypto.randomUUID(),
        role: "user",
        content: "msg-a",
        createdAt: new Date().toISOString(),
      },
    })) {
      /* drain */
    }
    for await (const _ of client.streamMessage(b.conversationId, {
      message: {
        messageId: crypto.randomUUID(),
        role: "user",
        content: "msg-b",
        createdAt: new Date().toISOString(),
      },
    })) {
      /* drain */
    }

    const msgsA = await client.getMessages(a.conversationId);
    const msgsB = await client.getMessages(b.conversationId);
    expect(msgsA.messages.some((m) => m.content.includes("msg-a"))).toBe(true);
    expect(msgsA.messages.some((m) => m.content.includes("msg-b"))).toBe(false);
    expect(msgsB.messages.some((m) => m.content.includes("msg-b"))).toBe(true);

    const list = await client.listConversations();
    expect(list.conversations.length).toBe(2);
  });
});
