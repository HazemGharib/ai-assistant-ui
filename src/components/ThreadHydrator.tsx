import { useEffect, useRef } from "react";
import type { AssistantRuntime } from "@assistant-ui/react";
import type { Citation } from "@hazemgharib/ai-agent-contracts";
import { toThreadMessages } from "../conversation/toThreadMessages";
import {
  useConversationStoreState,
} from "./RuntimeProvider";

type ThreadHydratorProps = {
  runtime: AssistantRuntime;
  onCitationsClear: () => void;
  onCitationsFromMessages: (citations: Citation[]) => void;
};

/**
 * Keeps assistant-ui's visible thread in sync with the selected backend conversation.
 * create/select update conversationStore; without reset() the Thread UI stays on the old session.
 */
export function ThreadHydrator({
  runtime,
  onCitationsClear,
  onCitationsFromMessages,
}: ThreadHydratorProps) {
  const state = useConversationStoreState();
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (state.loadingMessages) return;
    const conversationId = state.activeConversationId;
    if (!conversationId) return;

    // Include message ids so a finished load of the same conversation still hydrates once.
    const key = `${conversationId}:${state.messages.map((m) => m.messageId).join(",")}`;
    if (lastKey.current === key) return;
    lastKey.current = key;

    const threadMessages = toThreadMessages(state.messages);
    runtime.thread.reset(threadMessages);

    onCitationsClear();
    const lastAssistant = [...state.messages]
      .reverse()
      .find((m) => m.role === "assistant" && m.citations?.length);
    if (lastAssistant?.citations?.length) {
      onCitationsFromMessages(lastAssistant.citations);
    }
  }, [
    state.activeConversationId,
    state.loadingMessages,
    state.messages,
    runtime,
    onCitationsClear,
    onCitationsFromMessages,
  ]);

  return null;
}

/** Used when ConversationList needs to force-hydrate after create/select without waiting for effect races. */
export function hydrateThreadFromStore(
  runtime: AssistantRuntime,
  messages: Parameters<typeof toThreadMessages>[0],
): void {
  runtime.thread.reset(toThreadMessages(messages));
}
