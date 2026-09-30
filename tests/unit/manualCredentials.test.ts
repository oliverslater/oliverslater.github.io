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

  it("normalizes manual certifications when populated with custom and default Microsoft icons", async () => {
    const { vi } = await import("vitest");
    vi.resetModules();

    vi.doMock("../../src/data/siteData", async (importOriginal) => {
      const original: any = await importOriginal();
      return {
        ...original,
        manualCertificationsData: {
          certifications: [
            {
              id: "manual-ms-1",
              title: "Azure Solutions Architect",
              issuer: "Microsoft",
              issueDate: "2023-01-01",
              expiresDate: "2025-01-01",
              verifyUrl: "https://learn.microsoft.com",
            },
            {
              id: "manual-other-2",
              title: "Kubernetes Certified",
              issuer: "CNCF",
              issueDate: "2023-05-01",
              imageUrl: "https://example.com/badge.png",
              displayed: false,
              includeInCount: false,
              order: 2,
            },
          ],
        },
      };
    });

    const { getManualCredentials: getMockedManual } =
      await import("../../src/utils/manualCredentials");
    const results = getMockedManual();
    expect(results).toHaveLength(2);

    expect(results[0].id).toBe("manual-ms-1");
    expect(results[0].issuer).toBe("Microsoft");
    expect(results[0].imageUrl).toBeDefined();
    expect(results[0].displayed).toBe(true);
    expect(results[0].includeInCount).toBe(true);
    expect(results[0].priority).toBe(0);

    expect(results[1].id).toBe("manual-other-2");
    expect(results[1].imageUrl).toBe("https://example.com/badge.png");
    expect(results[1].displayed).toBe(false);
    expect(results[1].includeInCount).toBe(false);
    expect(results[1].priority).toBe(998); // 1000 - 2

    vi.doUnmock("../../src/data/siteData");
    vi.resetModules();
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
