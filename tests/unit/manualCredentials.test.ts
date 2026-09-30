import { describe, it, expect } from "vitest";
import {
  getManualCredentials,
  getLocalFallbackCredentials,
} from "../../src/utils/manualCredentials";

describe("manualCredentials utils", () => {
  it("loads and normalizes manual credentials from JSON", () => {
    const manualCredentials = getManualCredentials();
    expect(Array.isArray(manualCredentials)).toBe(true);

    if (manualCredentials.length > 0) {
      const first = manualCredentials[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("title");
      expect(first).toHaveProperty("issuer");
    }
  });

  it("loads and normalizes local fallback qualifications", () => {
    const fallbacks = getLocalFallbackCredentials();
    expect(Array.isArray(fallbacks)).toBe(true);
    expect(fallbacks.length).toBeGreaterThan(0);

    const first = fallbacks[0];
    expect(first.id).toMatch(/^local-fallback-/);
    expect(first.title).toBeDefined();
    expect(first.issuer).toBeDefined();
  });
});
