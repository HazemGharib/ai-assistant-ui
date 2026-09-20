import {
  AuiIf,
  ComposerPrimitive,
  MessagePrimitive,
  SuggestionPrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";

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
  return (
    <MessagePrimitive.Root className="message message--assistant">
      <div className="message__bubble">
        <MessagePrimitive.Parts />
      </div>
    </MessagePrimitive.Root>
  );
}

function Composer() {
  return (
    <ComposerPrimitive.Root className="composer">
      <ComposerPrimitive.Input
        className="composer__input"
        placeholder="Ask about documents, fetch a URL, or calculate…"
        rows={1}
      />
      <AuiIf condition={(s) => !s.thread.isRunning}>
        <ComposerPrimitive.Send className="composer__button">
          Send
        </ComposerPrimitive.Send>
      </AuiIf>
      <AuiIf condition={(s) => s.thread.isRunning}>
        <ComposerPrimitive.Cancel className="composer__button composer__button--cancel">
          Stop
        </ComposerPrimitive.Cancel>
      </AuiIf>
    </ComposerPrimitive.Root>
  );
}

function Welcome() {
  return (
    <div className="welcome">
      <p className="welcome__brand">AI Assistant</p>
      <h1 className="welcome__title">Ask anything</h1>
      <p className="welcome__lede">
        Local-first chat UI. The agent will combine RAG and MCP tools.
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
  return (
    <ThreadPrimitive.Root className="thread">
      <ThreadPrimitive.Viewport className="thread__viewport">
        <AuiIf condition={(s) => s.thread.isEmpty}>
          <Welcome />
        </AuiIf>

        <ThreadPrimitive.Messages>
          {({ message }) =>
            message.role === "user" ? (
              <UserMessage />
            ) : (
              <AssistantMessage />
            )
          }
        </ThreadPrimitive.Messages>

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
