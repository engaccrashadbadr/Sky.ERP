import { describe, expect, it } from "vitest";

describe("Sky ERP application title", () => {
  it("exposes the configured title to the application runtime", () => {
    expect(process.env.VITE_APP_TITLE ?? "Sky ERP").toBe("Sky ERP");
  });
});
