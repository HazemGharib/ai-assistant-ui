# AI Assistant UI

Minimal conversational frontend for the TypeScript RAG + MCP agent platform (Phase 2).

## Ownership

| Owns | Does not own |
| ------ | -------------- |
| Chat presentation, multi-conversation UX, adapters | Orchestration, RAG, MCP tools, LLM providers |

Outbound: UI↔backend conversation + SSE stream via `@hazemgharib/ai-agent-contracts@0.2.0`  
**Non-goals**: no direct RAG, MCP, vector DB, or LLM client dependencies in this repo.

Full map: [`ai-assistant-spec-hub/overall-context/ownership.md`](../ai-assistant-spec-hub/overall-context/ownership.md)

## Stack

- React 19 + TypeScript + Vite
- [assistant-ui](https://www.assistant-ui.com/)
- Contract-faithful **mock backend** (isolated) or HTTP backend (integrated)

## Environment

See `.env.example`:

| Variable | Purpose |
|----------|---------|
| `VITE_USE_MOCK_BACKEND=true` | Isolated persisting mock (default when backend URL unset) |
| `VITE_BACKEND_BASE_URL` | Integrated mode — public backend origin only |

Never put LLM/RAG/MCP secrets in UI env files.

## Isolated run (mock)

```bash
pnpm install
pnpm test
pnpm test:boundary
pnpm lint
pnpm typecheck
VITE_USE_MOCK_BACKEND=true pnpm dev
```

Open the URL Vite prints (usually `http://127.0.0.1:5173`).

## Integrated mode

```bash
# Terminal A: backend with conversation + stream stubs
cd ../ai-assistant-backend && pnpm dev

# Terminal B: UI
VITE_USE_MOCK_BACKEND=false VITE_BACKEND_BASE_URL=http://127.0.0.1:3001 pnpm dev
```

Smoke checklist: [`specs/002-conversational-ui/quickstart.md`](../ai-assistant-spec-hub/specs/002-conversational-ui/quickstart.md)

## Engineering standards

[`engineering-standards.md`](../ai-assistant-spec-hub/overall-context/engineering-standards.md)

## Security / cost

- **$0** local shell — no API keys, no AWS, no paid cloud required for UI
- No secrets in the browser; no inter-service auth in local Phase 2
- Citations are display-only (no external navigation required)
