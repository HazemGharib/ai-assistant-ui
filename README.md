# AI Assistant UI

Minimal conversational frontend for the TypeScript RAG + MCP agent platform.

## Ownership

| Owns | Does not own |
| ------ | -------------- |
| Chat presentation, client UX, adapters | Orchestration, RAG, MCP tools |

Outbound: `ui-backend-chat` via `@hazemgharib/ai-agent-contracts@0.1.0` (GitHub Packages; see `.npmrc`)  
Full map: [`ai-assistant-spec-hub/overall-context/ownership.md`](../ai-assistant-spec-hub/overall-context/ownership.md)

## Stack

- React 19 + TypeScript + Vite
- [assistant-ui](https://www.assistant-ui.com/)
- Local stub adapter when `VITE_BACKEND_BASE_URL` is unset; HTTP backend adapter when set

## Isolated run

```bash
# requires ~/.npmrc auth for GitHub Packages, or a local contracts link (see contracts README)
pnpm install
pnpm test
pnpm lint
pnpm typecheck
pnpm dev
```

Open the URL Vite prints (usually `http://127.0.0.1:5173`). With no `VITE_BACKEND_BASE_URL`, uses `localAgentAdapter` (no backend).

## Integrated mode

```bash
VITE_BACKEND_BASE_URL=http://127.0.0.1:3001 pnpm dev
```

See [quickstart](../ai-assistant-spec-hub/specs/001-platform-foundation/quickstart.md).

## Engineering standards

[`engineering-standards.md`](../ai-assistant-spec-hub/overall-context/engineering-standards.md)

## Security / cost

- **$0** local shell — no API keys, no AWS, no paid cloud required
- No secrets in the browser; no inter-service auth in Phase 1
