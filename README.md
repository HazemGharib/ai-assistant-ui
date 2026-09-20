# AI Assistant UI

Minimal conversational frontend for the TypeScript RAG + MCP agent platform.

## Stack

- React 19 + TypeScript + Vite
- [assistant-ui](https://www.assistant-ui.com/) with a **local stub runtime** (no API keys, $0)

## Run locally

```bash
pnpm install
pnpm dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Architecture notes

Per the platform constitution:

- UI stays independent of agent internals
- Adapter lives in `src/adapters/localAgentAdapter.ts` — swap this for the Node agent later
- No secrets in the browser; no paid cloud required for this shell

## Next

Wire `localAgentAdapter` to the agent backend chat endpoint once it exists.
