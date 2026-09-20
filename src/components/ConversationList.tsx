import {
  useConversationStoreState,
  useRuntimeExtras,
} from "./RuntimeProvider";

export function ConversationList() {
  const { store } = useRuntimeExtras();
  const state = useConversationStoreState();

  return (
    <aside className="conv-list" aria-label="Conversations">
      <div className="conv-list__header">
        <span className="conv-list__title">Chats</span>
        <button
          type="button"
          className="conv-list__new"
          onClick={() => void store.createConversation()}
        >
          New
        </button>
      </div>
      {state.listError ? (
        <p className="conv-list__error">
          {state.listError}{" "}
          <button type="button" onClick={() => void store.refreshList()}>
            Retry
          </button>
        </p>
      ) : null}
      {state.loadingList && state.conversations.length === 0 ? (
        <p className="conv-list__hint">Loading…</p>
      ) : null}
      <ul className="conv-list__items">
        {state.conversations.map((c) => {
          const active = c.conversationId === state.activeConversationId;
          return (
            <li key={c.conversationId}>
              <button
                type="button"
                className={
                  active
                    ? "conv-list__item conv-list__item--active"
                    : "conv-list__item"
                }
                onClick={() => void store.selectConversation(c.conversationId)}
              >
                {c.title?.trim() || "New conversation"}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
