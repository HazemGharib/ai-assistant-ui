/**
 * Legacy offline stub — prefer `VITE_USE_MOCK_BACKEND=true` (contract-faithful mock)
 * or `VITE_BACKEND_BASE_URL` for integrated mode. Kept for emergency fallback only.
 */
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

export const localAgentAdapter: ChatModelAdapter = {
  async *run({ messages, abortSignal }) {
    const prompt = lastUserText(messages);
    const reply = [
      "Legacy local stub — switch to mock backend (`VITE_USE_MOCK_BACKEND=true`)",
      "or set `VITE_BACKEND_BASE_URL` for the public conversation/streaming API.",
      "",
      prompt ? `You asked: “${prompt}”` : "Send a message to exercise the chat surface.",
    ].join("\n");

    let accumulated = "";
    for (const word of reply.split(/(\s+)/)) {
      if (abortSignal.aborted) return;
      accumulated += word;
      yield {
        content: [{ type: "text", text: accumulated }],
      };
      await new Promise((resolve) => setTimeout(resolve, 12));
    }
  },
};
