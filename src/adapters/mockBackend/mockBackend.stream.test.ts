import { describe, expect, it, beforeEach } from "vitest";
import { createMockStore, streamAssistantReply } from "./store";

describe("mockBackend stream", () => {
  const store = createMockStore();

  beforeEach(() => {
    store.reset();
  });

  it("streams deltas then completes", async () => {
    const conv = store.create("t");
    const events = [];
    for await (const e of streamAssistantReply(
      conv.conversationId,
      "Hello",
      store,
      { replyText: "Hi there", chunkDelayMs: 0 },
    )) {
      events.push(e.type);
    }
    expect(events[0]).toBe("message.delta");
    expect(events.at(-1)).toBe("message.completed");
    const msgs = store.get(conv.conversationId)?.messages ?? [];
    expect(msgs.some((m) => m.role === "user")).toBe(true);
    expect(msgs.some((m) => m.role === "assistant")).toBe(true);
  });

  it("stops early on abort and keeps partial", async () => {
    const conv = store.create();
    const ac = new AbortController();
    const gen = streamAssistantReply(
      conv.conversationId,
      "Long",
      store,
      { replyText: "one two three four five", chunkDelayMs: 5 },
      ac.signal,
    );
    const first = await gen.next();
    expect(first.value?.type).toBe("message.delta");
    ac.abort();
    // drain
    for await (const _ of gen) {
      /* empty */
    }
    const msgs = store.get(conv.conversationId)?.messages ?? [];
    expect(msgs.some((m) => m.role === "assistant")).toBe(true);
  });
});
