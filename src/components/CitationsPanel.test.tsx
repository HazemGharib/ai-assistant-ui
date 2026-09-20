import { describe, expect, it } from "vitest";
import { CitationsPanel } from "./CitationsPanel";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

describe("CitationsPanel", () => {
  it("renders nothing when citations absent", () => {
    const html = renderToStaticMarkup(
      createElement(CitationsPanel, { citations: undefined }),
    );
    expect(html).toBe("");
  });

  it("renders display-only details including plain URL text", () => {
    const html = renderToStaticMarkup(
      createElement(CitationsPanel, {
        citations: [
          {
            documentId: "d1",
            source: "handbook.pdf",
            title: "Refunds",
            snippet: "Within 30 days",
            url: "https://example.com/doc",
          },
        ],
      }),
    );
    expect(html).toContain("Refunds");
    expect(html).toContain("Within 30 days");
    expect(html).toContain("https://example.com/doc");
    expect(html).not.toContain("<a ");
  });
});
