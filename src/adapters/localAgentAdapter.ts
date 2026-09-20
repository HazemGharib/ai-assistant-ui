import type { ChatModelAdapter, ThreadMessage } from "@assistant-ui/react";

function lastUserText(messages: readonly ThreadMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message?.role !== "user") continue;

    const text = message.content
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n")
      .trim();

    if (text) return text;
  }

  return "";
}

/**
 * Local-first stub adapter. Swappable for the Node agent backend later
 * without changing Thread / App UI (constitution: UI ↔ agent separation).
 */
export const localAgentAdapter: ChatModelAdapter = {
  async *run({ messages, abortSignal }) {
    const prompt = lastUserText(messages);
    const reply = [
      "This is the local UI stub (no agent backend yet).",
      "",
      prompt
        ? `You asked: “${prompt}”`
        : "Send a message to exercise the chat surface.",
      "",
      "MVP agent capabilities (coming next):",
      "• search_documents() — RAG",
      "• fetch_url() — MCP",
      "• calculate() — MCP",
      "",
      "Point this adapter at the Node agent when it is ready.",
    ].join("\n");

    let accumulated = "";
    for (const word of reply.split(/(\s+)/)) {
      if (abortSignal.aborted) return;
      accumulated += word;
      yield {
        content: [{ type: "text", text: accumulated }],
      };
      await new Promise((resolve) => setTimeout(resolve, 18));
    }
  },
};
