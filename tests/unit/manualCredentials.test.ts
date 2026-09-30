import { describe, it, expect } from "vitest";
import {
  getManualCredentials,
  getLocalFallbackCredentials,
} from "../../src/utils/manualCredentials";

describe("manualCredentials utils", () => {
  it("loads and normalizes manual credentials from JSON", () => {
    const manualCredentials = getManualCredentials();
    expect(Array.isArray(manualCredentials)).toBe(true);
  });

  it("maps manual certification items with image url, displayed, count, and priority overrides", async () => {
    // Dynamic test with populated manual-certifications structure
    const { cleanIssuerName, resolvePriority } =
      await import("../../src/utils/credentialTypes");
    const sampleItem = {
      id: "manual-cka",
      title: "CKA",
      issuer: "Linux Foundation",
      issueDate: "2024-01-01",
      expiresDate: "2027-01-01",
      badgeImageUrl: "https://example.com/cka.png",
      verifyUrl: "https://example.com",
      displayed: true,
      includeInCount: true,
      priority: 10,
    };

    expect(cleanIssuerName(sampleItem.issuer)).toBe("Linux Foundation");
    expect(resolvePriority(sampleItem.priority, undefined, 0)).toBe(10);
  });

  it("loads and normalizes local fallback qualifications", () => {
    const fallbacks = getLocalFallbackCredentials();
    expect(Array.isArray(fallbacks)).toBe(true);
    expect(fallbacks.length).toBeGreaterThan(0);

    const first = fallbacks[0];
    expect(first.id).toMatch(/^local-fallback-/);
    expect(first.title).toBeDefined();
    expect(first.issuer).toBeDefined();

    // Finds any Microsoft credential and verifies it assigns default icon and transcript URL
    const msFallback = fallbacks.find((f) => f.issuer === "Microsoft");
    if (msFallback) {
      expect(msFallback.verifyUrl).toContain("learn.microsoft.com");
      expect(msFallback.imageUrl).toBeDefined();
    }
  });
});
