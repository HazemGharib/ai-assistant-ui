import { describe, expect, it } from "vitest";
import { toThreadMessages } from "./toThreadMessages";

describe("toThreadMessages", () => {
  it("maps stored messages to thread message likes", () => {
    const mapped = toThreadMessages([
      {
        messageId: "00000000-0000-4000-8000-000000000001",
        role: "user",
        content: "Hi",
        createdAt: "2026-09-20T00:00:00.000Z",
      },
      {
        messageId: "00000000-0000-4000-8000-000000000002",
        role: "assistant",
        content: "Hello",
        createdAt: "2026-09-20T00:00:01.000Z",
      },
    ]);
    expect(mapped).toHaveLength(2);
    expect(mapped[0]?.role).toBe("user");
    expect(mapped[0]?.content).toBe("Hi");
    expect(mapped[1]?.role).toBe("assistant");
    expect(mapped[1]?.status).toEqual({ type: "complete", reason: "stop" });
  });
});
