import type { Conversation, StoredMessage } from "@hazemgharib/ai-agent-contracts";
import type { BackendClient } from "../adapters/backendClient";
import { isConversationNotFoundError } from "../adapters/errors";
import { createSendQueue, type SendQueue } from "./sendQueue";

const ACTIVE_KEY = "ai-assistant-ui.activeConversationId";

export type ConversationStoreState = {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: StoredMessage[];
  listError: string | null;
  loadingList: boolean;
  loadingMessages: boolean;
  queuedFollowUp: string | null;
  activityLabel: string | null;
};

export type ConversationStore = {
  getState(): ConversationStoreState;
  subscribe(listener: () => void): () => void;
  refreshList(): Promise<void>;
  /** Startup: reconcile session hint with server list; recover from stale ids. */
  bootstrap(): Promise<void>;
  createConversation(title?: string | null): Promise<Conversation>;
  selectConversation(conversationId: string): Promise<void>;
  ensureActiveConversation(): Promise<string>;
  setActivityLabel(label: string | null): void;
  queueFollowUp(text: string): void;
  clearQueued(): void;
  queue: SendQueue;
  abortController: AbortController | null;
  beginStream(): AbortController;
  endStream(): void;
  cancelStream(): string | null;
};

export function createConversationStore(client: BackendClient): ConversationStore {
  let state: ConversationStoreState = {
    conversations: [],
    activeConversationId: readActiveHint(),
    messages: [],
    listError: null,
    loadingList: false,
    loadingMessages: false,
    queuedFollowUp: null,
    activityLabel: null,
  };
  const listeners = new Set<() => void>();
  const queue = createSendQueue();
  let abortController: AbortController | null = null;

  function emit() {
    for (const listener of listeners) listener();
  }

  function setState(patch: Partial<ConversationStoreState>) {
    let changed = false;
    for (const key of Object.keys(patch) as (keyof ConversationStoreState)[]) {
      if (state[key] !== patch[key]) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    state = { ...state, ...patch };
    emit();
  }

  function dropStaleConversation(conversationId: string) {
    clearActiveHint();
    setState({
      activeConversationId: null,
      messages: [],
      loadingMessages: false,
      listError: null,
      conversations: state.conversations.filter(
        (c) => c.conversationId !== conversationId,
      ),
      activityLabel: null,
      queuedFollowUp: null,
    });
  }

  async function selectKnownConversation(conversationId: string): Promise<boolean> {
    store.cancelStream();
    setState({
      activeConversationId: conversationId,
      loadingMessages: true,
      activityLabel: null,
      queuedFollowUp: null,
      listError: null,
    });
    try {
      const { messages } = await client.getMessages(conversationId);
      writeActiveHint(conversationId);
      setState({ messages, loadingMessages: false });
      return true;
    } catch (err) {
      if (isConversationNotFoundError(err)) {
        // Stale client hint or deleted conversation — recover silently.
        dropStaleConversation(conversationId);
        return false;
      }
      setState({
        loadingMessages: false,
        listError: err instanceof Error ? err.message : String(err),
      });
      return false;
    }
  }

  const store: ConversationStore = {
    getState() {
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    queue,
    get abortController() {
      return abortController;
    },
    beginStream() {
      abortController?.abort();
      abortController = new AbortController();
      return abortController;
    },
    endStream() {
      abortController = null;
      setState({ activityLabel: null });
    },
    cancelStream() {
      abortController?.abort();
      abortController = null;
      const draft = queue.take();
      setState({ activityLabel: null, queuedFollowUp: null });
      return draft;
    },
    queueFollowUp(text: string) {
      queue.set(text);
      setState({ queuedFollowUp: queue.get() });
    },
    clearQueued() {
      queue.clear();
      setState({ queuedFollowUp: null });
    },
    async refreshList() {
      setState({ loadingList: true, listError: null });
      try {
        const { conversations } = await client.listConversations();
        setState({ conversations, loadingList: false });
      } catch (err) {
        setState({
          loadingList: false,
          listError: err instanceof Error ? err.message : String(err),
        });
      }
    },
    async bootstrap() {
      await store.refreshList();
      if (state.listError) return;

      const hint = state.activeConversationId;
      const listed = state.conversations;

      if (hint) {
        const stillExists = listed.some((c) => c.conversationId === hint);
        if (stillExists) {
          const ok = await selectKnownConversation(hint);
          if (ok) return;
          // Fall through after silent drop
        } else {
          // Hint points at a conversation the server no longer has (e.g. restart).
          clearActiveHint();
          setState({
            activeConversationId: null,
            messages: [],
            listError: null,
          });
        }
      }

      const next = store.getState().conversations[0];
      if (next) {
        await selectKnownConversation(next.conversationId);
        return;
      }

      // Empty workspace — leave welcome empty; first send creates a conversation.
      setState({
        activeConversationId: null,
        messages: [],
        loadingMessages: false,
        listError: null,
      });
    },
    async createConversation(title?: string | null) {
      store.cancelStream();
      const created = await client.createConversation(
        title ? { title } : undefined,
      );
      writeActiveHint(created.conversationId);
      setState({
        activeConversationId: created.conversationId,
        messages: [],
        activityLabel: null,
        queuedFollowUp: null,
        listError: null,
        loadingMessages: false,
      });
      await store.refreshList();
      return created;
    },
    async selectConversation(conversationId: string) {
      const ok = await selectKnownConversation(conversationId);
      if (ok) return;

      // After NOT_FOUND recovery, land on another chat or empty welcome.
      const fallback = store.getState().conversations[0];
      if (fallback) {
        await selectKnownConversation(fallback.conversationId);
      }
    },
    async ensureActiveConversation() {
      if (state.activeConversationId) {
        const existing = state.conversations.find(
          (c) => c.conversationId === state.activeConversationId,
        );
        if (existing || state.messages.length > 0) {
          return state.activeConversationId;
        }
        const candidate = state.activeConversationId;
        const ok = await selectKnownConversation(candidate);
        if (ok) {
          const id = store.getState().activeConversationId;
          if (id) return id;
        }
      }
      const created = await store.createConversation();
      return created.conversationId;
    },
    setActivityLabel(label: string | null) {
      setState({ activityLabel: label });
    },
  };

  return store;
}

function readActiveHint(): string | null {
  try {
    return sessionStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

function writeActiveHint(id: string): void {
  try {
    sessionStorage.setItem(ACTIVE_KEY, id);
  } catch {
    /* ignore */
  }
}

function clearActiveHint(): void {
  try {
    sessionStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* ignore */
  }
}
