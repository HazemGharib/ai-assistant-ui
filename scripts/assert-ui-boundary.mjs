#!/usr/bin/env node
/**
 * Asserts ai-assistant-ui does not depend on RAG/MCP/LLM provider packages.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const deps = {
  ...pkg.dependencies,
  ...pkg.devDependencies,
};

const forbidden = [
  /openai/i,
  /anthropic/i,
  /@anthropic/i,
  /langchain/i,
  /@modelcontextprotocol/i,
  /chromadb/i,
  /pinecone/i,
  /weaviate/i,
  /@pinecone/i,
  /cohere/i,
  /@google\/generative-ai/i,
  /bedrock/i,
];

const offenders = Object.keys(deps).filter((name) =>
  forbidden.some((re) => re.test(name)),
);

if (offenders.length > 0) {
  console.error("Forbidden UI boundary dependencies:", offenders.join(", "));
  process.exit(1);
}

console.log("UI boundary assert OK (no RAG/MCP/LLM provider packages).");
