/**
 * Single-slot follow-up queue while an assistant reply streams.
 * Latest submission replaces any existing queued text.
 */
export type SendQueue = {
  get(): string | null;
  set(text: string): void;
  take(): string | null;
  clear(): void;
};

export function createSendQueue(): SendQueue {
  let pending: string | null = null;

  return {
    get() {
      return pending;
    },
    set(text: string) {
      const trimmed = text.trim();
      if (!trimmed) return;
      pending = trimmed;
    },
    take() {
      const value = pending;
      pending = null;
      return value;
    },
    clear() {
      pending = null;
    },
  };
}
