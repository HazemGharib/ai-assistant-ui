import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

describe("UI boundary", () => {
  it("has no RAG/MCP/LLM provider packages in package.json", () => {
    const root = join(dirname(fileURLToPath(import.meta.url)), "..");
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const forbidden = [
      /openai/i,
      /anthropic/i,
      /langchain/i,
      /@modelcontextprotocol/i,
      /chromadb/i,
      /pinecone/i,
      /weaviate/i,
      /bedrock/i,
    ];
    const offenders = Object.keys(deps).filter((name) =>
      forbidden.some((re) => re.test(name)),
    );
    expect(offenders).toEqual([]);
  });
});
