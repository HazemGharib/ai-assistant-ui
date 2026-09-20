import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ActivityStatus } from "./ActivityStatus";

describe("ActivityStatus", () => {
  it("renders nothing when label null", () => {
    expect(
      renderToStaticMarkup(createElement(ActivityStatus, { label: null })),
    ).toBe("");
  });

  it("renders started label", () => {
    const html = renderToStaticMarkup(
      createElement(ActivityStatus, { label: "Searching knowledge" }),
    );
    expect(html).toContain("Searching knowledge");
  });
});
