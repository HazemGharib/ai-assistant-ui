import { describe, expect, it } from "vitest";
import { localAgentAdapter } from "./localAgentAdapter";

describe("localAgentAdapter", () => {
  it("streams a stub reply without a backend", async () => {
    const chunks: string[] = [];
    const messages = [
      {
        id: "m1",
        role: "user" as const,
        content: [{ type: "text" as const, text: "Hello stub" }],
        createdAt: new Date(),
      },
    ];

    const run = localAgentAdapter.run as (opts: {
      messages: unknown;
      abortSignal: AbortSignal;
    }) => AsyncGenerator<{ content?: Array<{ type: string; text?: string }> }>;

    for await (const part of run({
      messages,
      abortSignal: new AbortController().signal,
    })) {
      const text = part.content
        ?.filter((c) => c.type === "text")
        .map((c) => c.text ?? "")
        .join("");
      if (text) chunks.push(text);
    }

    const finalText = chunks.at(-1) ?? "";
    expect(finalText).toContain("local UI stub");
    expect(finalText).toContain("Hello stub");
  });
});
