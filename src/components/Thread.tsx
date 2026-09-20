import {
  AuiIf,
  ComposerPrimitive,
  MessagePrimitive,
  SuggestionPrimitive,
  ThreadPrimitive,
  useAuiState,
} from "@assistant-ui/react";
import { ActivityStatus } from "./ActivityStatus";
import { CitationsPanel } from "./CitationsPanel";
import {
  useConversationStoreState,
  useRuntimeExtras,
} from "./RuntimeProvider";

function UserMessage() {
  return (
    <MessagePrimitive.Root className="message message--user">
      <div className="message__bubble">
        <MessagePrimitive.Parts />
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage() {
  const { citationsByMessage } = useRuntimeExtras();
  return (
    <MessagePrimitive.Root className="message message--assistant">
      <div className="message__bubble">
        <MessagePrimitive.Parts />
        <CitationsPanel citations={citationsByMessage.latest} />
      </div>
    </MessagePrimitive.Root>
  );
}

function Composer() {
  const { store } = useRuntimeExtras();
  const state = useConversationStoreState();
  const isRunning = useAuiState((s) => s.thread.isRunning);
  const composerText = useAuiState((s) => s.composer.text);

  const queueFollowUp = () => {
    const text = composerText?.trim() ?? "";
    if (!text) return;
    store.queueFollowUp(text);
  };

  return (
    <ComposerPrimitive.Root className="composer">
      <ComposerPrimitive.Input
        className="composer__input"
        placeholder="Ask anything…"
        rows={1}
      />
      {state.queuedFollowUp ? (
        <span className="composer__queued" title="Queued follow-up">
          Queued: {state.queuedFollowUp.slice(0, 40)}
          {state.queuedFollowUp.length > 40 ? "…" : ""}
        </span>
      ) : null}
      <AuiIf condition={(s) => !s.thread.isRunning}>
        <ComposerPrimitive.Send className="composer__button">
          Send
        </ComposerPrimitive.Send>
      </AuiIf>
      {isRunning ? (
        <>
          <button
            type="button"
            className="composer__button"
            onClick={queueFollowUp}
            disabled={!composerText?.trim()}
          >
            Queue
          </button>
          <ComposerPrimitive.Cancel
            className="composer__button composer__button--cancel"
            onClick={() => {
              const draft = store.cancelStream();
              if (draft) {
                store.queue.clear();
              }
            }}
          >
            Stop
          </ComposerPrimitive.Cancel>
        </>
      ) : null}
    </ComposerPrimitive.Root>
  );
}

function Welcome() {
  return (
    <div className="welcome">
      <p className="welcome__brand">AI Assistant</p>
      <h1 className="welcome__title">Ask anything</h1>
      <p className="welcome__lede">
        Conversational UI over the backend public contract — no direct RAG, MCP,
        or LLM clients in the browser.
      </p>
    </div>
  );
}

function SuggestionItem() {
  return (
    <SuggestionPrimitive.Trigger send className="suggestion">
      <span className="suggestion__title">
        <SuggestionPrimitive.Title />
      </span>
      <span className="suggestion__description">
        <SuggestionPrimitive.Description />
      </span>
    </SuggestionPrimitive.Trigger>
  );
}

export function Thread() {
  const state = useConversationStoreState();

  return (
    <ThreadPrimitive.Root className="thread">
      <ThreadPrimitive.Viewport className="thread__viewport">
        <AuiIf condition={(s) => s.thread.isEmpty}>
          <Welcome />
        </AuiIf>

        <ThreadPrimitive.Messages>
          {({ message }) =>
            message.role === "user" ? <UserMessage /> : <AssistantMessage />
          }
        </ThreadPrimitive.Messages>

        <ActivityStatus label={state.activityLabel} />

        <ThreadPrimitive.ViewportFooter className="thread__footer">
          <ThreadPrimitive.ScrollToBottom className="thread__scroll">
            ↓
          </ThreadPrimitive.ScrollToBottom>

          <AuiIf condition={(s) => s.thread.isEmpty && s.composer.isEmpty}>
            <div className="suggestions">
              <ThreadPrimitive.Suggestions>
                {() => <SuggestionItem />}
              </ThreadPrimitive.Suggestions>
            </div>
          </AuiIf>

          <Composer />
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
}
