import { beforeEach, describe, expect, it } from "vitest";
import { createMockBackendClient } from "../adapters/mockBackend/client";
import { createMockStore } from "../adapters/mockBackend/store";
import { createConversationStore } from "./conversationStore";

const ACTIVE_KEY = "ai-assistant-ui.activeConversationId";

function installSessionStorage() {
  const map = new Map<string, string>();
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => {
        map.set(key, String(value));
      },
      removeItem: (key: string) => {
        map.delete(key);
      },
      clear: () => {
        map.clear();
      },
    },
  });
}

describe("conversationStore bootstrap stale hint", () => {
  const mockStore = createMockStore();

  beforeEach(() => {
    mockStore.reset();
    installSessionStorage();
  });

  it("clears a session hint that the server no longer has and does not surface listError", async () => {
    const staleId = "00000000-0000-4000-8000-00000000aaaa";
    sessionStorage.setItem(ACTIVE_KEY, staleId);

    const client = createMockBackendClient({
      store: mockStore,
      streamOptions: { replyText: "ok", chunkDelayMs: 0 },
    });
    const live = mockStore.create("Live");

    const store = createConversationStore(client);
    expect(store.getState().activeConversationId).toBe(staleId);

    await store.bootstrap();

    const state = store.getState();
    expect(state.listError).toBeNull();
    expect(state.activeConversationId).toBe(live.conversationId);
    expect(sessionStorage.getItem(ACTIVE_KEY)).toBe(live.conversationId);
  });

  it("ends on empty welcome when hint is stale and list is empty", async () => {
    const staleId = "00000000-0000-4000-8000-00000000bbbb";
    sessionStorage.setItem(ACTIVE_KEY, staleId);

    const client = createMockBackendClient({ store: mockStore });
    const store = createConversationStore(client);
    await store.bootstrap();

    const state = store.getState();
    expect(state.listError).toBeNull();
    expect(state.activeConversationId).toBeNull();
    expect(state.conversations).toHaveLength(0);
    expect(sessionStorage.getItem(ACTIVE_KEY)).toBeNull();
  });
});
