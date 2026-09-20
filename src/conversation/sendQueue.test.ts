import { describe, expect, it } from "vitest";
import { createSendQueue } from "./sendQueue";

describe("createSendQueue", () => {
  it("holds at most one message and latest wins", () => {
    const q = createSendQueue();
    q.set("first");
    q.set("second");
    expect(q.get()).toBe("second");
    expect(q.take()).toBe("second");
    expect(q.get()).toBeNull();
  });

  it("clear discards pending", () => {
    const q = createSendQueue();
    q.set("x");
    q.clear();
    expect(q.take()).toBeNull();
  });

  it("ignores empty set", () => {
    const q = createSendQueue();
    q.set("   ");
    expect(q.get()).toBeNull();
  });
});
