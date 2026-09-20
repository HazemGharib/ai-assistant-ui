import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  AssistantRuntimeProvider,
  Suggestions,
  AuiConfig,
  useAui,
  useLocalRuntime,
  type AssistantRuntime,
} from "@assistant-ui/react";
import type { Citation } from "@hazemgharib/ai-agent-contracts";
import { createMockBackendClient } from "../adapters/mockBackend/client";
import { createHttpBackendClient } from "../adapters/httpBackendClient";
import { createStreamingChatAdapter } from "../adapters/httpBackendAdapter";
import {
  createConversationStore,
  type ConversationStore,
} from "../conversation/conversationStore";
import type { BackendClient } from "../adapters/backendClient";
import { ThreadHydrator } from "./ThreadHydrator";

const auiConfig = AuiConfig({
  suggestions: Suggestions([
    {
      prompt: "What does our refund policy say?",
      title: "Refund policy",
      label: "Ask with citations",
    },
    {
      prompt: "Summarize the last thing we discussed",
      title: "Follow up",
      label: "Multi-turn",
    },
  ]),
});

type RuntimeContextValue = {
  store: ConversationStore;
  runtime: AssistantRuntime;
  citationsByMessage: Record<string, Citation[]>;
  mode: "mock" | "http";
};

const RuntimeExtrasContext = createContext<RuntimeContextValue | null>(null);

export function useRuntimeExtras(): RuntimeContextValue {
  const ctx = useContext(RuntimeExtrasContext);
  if (!ctx) {
    throw new Error("useRuntimeExtras must be used within RuntimeProvider");
  }
  return ctx;
}

function resolveClient(): { client: BackendClient; mode: "mock" | "http" } {
  const useMock = import.meta.env.VITE_USE_MOCK_BACKEND;
  const baseUrl = (import.meta.env.VITE_BACKEND_BASE_URL as string | undefined)
    ?.trim();

  if (useMock === "true" || !baseUrl) {
    return { client: createMockBackendClient(), mode: "mock" };
  }
  return {
    client: createHttpBackendClient({ baseUrl }),
    mode: "http",
  };
}

function QueueFlushListener() {
  const aui = useAui();
  useEffect(() => {
    const onFlush = (event: Event) => {
      const detail = (event as CustomEvent<{ text: string }>).detail;
      const text = detail?.text?.trim();
      if (!text) return;
      try {
        (
          aui as unknown as {
            thread: { append: (msg: string) => void };
          }
        ).thread.append(text);
      } catch {
        /* ignore if API shape differs */
      }
    };
    window.addEventListener("ai-assistant-queue-flush", onFlush);
    return () =>
      window.removeEventListener("ai-assistant-queue-flush", onFlush);
  }, [aui]);
  return null;
}

type RuntimeProviderProps = {
  children: ReactNode;
};

export function RuntimeProvider({ children }: RuntimeProviderProps) {
  const { client, mode } = useMemo(() => resolveClient(), []);
  const store = useMemo(() => createConversationStore(client), [client]);
  const [citationsByMessage, setCitationsByMessage] = useState<
    Record<string, Citation[]>
  >({});

  const clearCitations = useCallback(() => {
    setCitationsByMessage({});
  }, []);

  const setLatestCitations = useCallback((citations: Citation[]) => {
    setCitationsByMessage({ latest: citations });
  }, []);

  const adapter = useMemo(
    () =>
      createStreamingChatAdapter({
        client,
        store,
        onCitations: setLatestCitations,
      }),
    [client, store, setLatestCitations],
  );

  const runtime = useLocalRuntime(adapter);

  useEffect(() => {
    void store.bootstrap();
  }, [store]);

  const extras: RuntimeContextValue = useMemo(
    () => ({
      store,
      runtime,
      citationsByMessage,
      mode,
    }),
    [store, runtime, citationsByMessage, mode],
  );

  return (
    <RuntimeExtrasContext.Provider value={extras}>
      <AssistantRuntimeProvider runtime={runtime} config={auiConfig}>
        <QueueFlushListener />
        <ThreadHydrator
          runtime={runtime}
          onCitationsClear={clearCitations}
          onCitationsFromMessages={setLatestCitations}
        />
        {children}
      </AssistantRuntimeProvider>
    </RuntimeExtrasContext.Provider>
  );
}

export function useConversationStoreState() {
  const { store } = useRuntimeExtras();
  return useSyncExternalStore(
    store.subscribe,
    () => store.getState(),
    () => store.getState(),
  );
}
