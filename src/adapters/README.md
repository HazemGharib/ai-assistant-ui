# UI adapters

The UI talks **only** to the backend public conversation/streaming contract
(`@hazemgharib/ai-agent-contracts` ≥ 0.2.0).

## Modes

| Mode | Env | Client |
|------|-----|--------|
| Mock (isolated) | `VITE_USE_MOCK_BACKEND=true` (default when no backend URL) | `mockBackend/` |
| HTTP (integrated) | `VITE_BACKEND_BASE_URL=http://127.0.0.1:3001` | `httpBackendAdapter` / HTTP `BackendClient` |

## Stream events

See [`stream-events.md`](../../../ai-assistant-spec-hub/specs/002-conversational-ui/contracts/stream-events.md):

- `message.delta` — append text
- `citation` — display-only citation
- `activity` — generic status
- `message.completed` — finalize; may flush send queue
- `error` — fail; do **not** auto-send queue

Malformed events are skipped. AbortSignal cancels the HTTP/mock stream (Stop).
