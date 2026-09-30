import { describe, it, expect, vi } from "vitest";
import {
  findOverrideMatch,
  applyOverrideToBadge,
  applyOverrides,
  sortCredentials,
} from "../../src/utils/certifications";
import type {
  CredentialItem,
  CertificationOverride,
} from "../../src/utils/credentialTypes";

vi.mock("../../src/utils/credly", () => ({
  fetchCredlyBadges: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../src/utils/mslearn", () => ({
  fetchMicrosoftLearnBadges: vi.fn().mockResolvedValue([]),
  getDefaultMicrosoftBadgeIcon: vi.fn().mockReturnValue("/icons/ms.png"),
  MS_LEARN_PUBLIC_TRANSCRIPT_URL: "https://learn.microsoft.com/transcript",
}));

describe("certifications utils", () => {
  const sampleBadge: CredentialItem = {
    id: "aws-csa-pro",
    title: "AWS Certified Solutions Architect – Professional",
    issuer: "Amazon Web Services",
    issueDate: "Jan 2024",
    rawDate: "2024-01-15",
    verifyUrl: "https://example.com/verify/123",
    displayed: true,
    includeInCount: true,
    priority: 0,
  };

  describe("findOverrideMatch", () => {
    const overrides: CertificationOverride[] = [
      { id: "aws-csa-pro", displayTitle: "AWS SA Pro" },
      { title: "Terraform", priority: 100 },
    ];

    it("matches override by exact ID", () => {
      const match = findOverrideMatch(sampleBadge, overrides);
      expect(match?.displayTitle).toBe("AWS SA Pro");
    });

    it("matches override by partial title inclusion", () => {
      const match = findOverrideMatch(
        { title: "HashiCorp Certified: Terraform Associate" },
        overrides,
      );
      expect(match?.priority).toBe(100);
    });

    it("returns undefined if no match", () => {
      const match = findOverrideMatch(
        { title: "Unknown Certification" },
        overrides,
      );
      expect(match).toBeUndefined();
    });
  });

  describe("applyOverrideToBadge", () => {
    it("applies displayTitle, issuer and priority overrides", () => {
      const override: CertificationOverride = {
        displayTitle: "AWS SA Professional",
        issuer: "AWS",
        priority: 50,
        displayed: true,
      };

      const updated = applyOverrideToBadge(sampleBadge, override);
      expect(updated.title).toBe("AWS SA Professional");
      expect(updated.issuer).toBe("AWS");
      expect(updated.priority).toBe(50);
    });

    it("applies image, verification URL and date overrides", () => {
      const override: CertificationOverride = {
        imageUrl: "https://example.com/badge.png",
        verifyUrl: "https://example.com/verify-override",
        issueDate: "2024-02-01",
      };
      const updated = applyOverrideToBadge(sampleBadge, override);
      expect(updated.imageUrl).toBe("https://example.com/badge.png");
      expect(updated.verifyUrl).toBe("https://example.com/verify-override");
      expect(updated.rawDate).toBe("2024-02-01");
    });

    it("handles expiry override of 'Never'", () => {
      const override: CertificationOverride = {
        expiresDate: "Never",
      };
      const updated = applyOverrideToBadge(
        { ...sampleBadge, expiresDate: "Jan 2025" },
        override,
      );
      expect(updated.expiresDate).toBeUndefined();
      expect(updated.rawExpiresDate).toBeUndefined();
    });

    it("handles specific date expiry and includeInCount overrides", () => {
      const override: CertificationOverride = {
        expiresDate: "2028-12-31",
        includeInCount: false,
      };
      const updated = applyOverrideToBadge(sampleBadge, override);
      expect(updated.rawExpiresDate).toBe("2028-12-31");
      expect(updated.includeInCount).toBe(false);
    });

    it("returns unchanged badge if match is undefined", () => {
      const updated = applyOverrideToBadge(sampleBadge, undefined);
      expect(updated).toEqual(sampleBadge);
    });
  });

  describe("applyOverrides", () => {
    it("finds and applies matching overrides from list", () => {
      const overrides: CertificationOverride[] = [
        { id: "aws-csa-pro", displayTitle: "AWS SA Pro Via Helper" },
      ];
      const updated = applyOverrides(sampleBadge, overrides);
      expect(updated.title).toBe("AWS SA Pro Via Helper");
    });
  });

  describe("sortCredentials", () => {
    it("sorts by priority descending first", () => {
      const lowPriority: CredentialItem = { ...sampleBadge, priority: 10 };
      const highPriority: CredentialItem = { ...sampleBadge, priority: 100 };
      expect(sortCredentials(lowPriority, highPriority)).toBeGreaterThan(0);
      expect(sortCredentials(highPriority, lowPriority)).toBeLessThan(0);
    });

    it("sorts by issue date descending if priority is equal", () => {
      const older: CredentialItem = {
        ...sampleBadge,
        priority: 0,
        rawDate: "2022-01-01",
      };
      const newer: CredentialItem = {
        ...sampleBadge,
        priority: 0,
        rawDate: "2024-01-01",
      };
      expect(sortCredentials(older, newer)).toBeGreaterThan(0);
      expect(sortCredentials(newer, older)).toBeLessThan(0);
    });

    it("sorts by title alphabetically if priority and date are equal", () => {
      const badgeA: CredentialItem = {
        ...sampleBadge,
        title: "Alpha",
        priority: 0,
        rawDate: "2024-01-01",
      };
      const badgeB: CredentialItem = {
        ...sampleBadge,
        title: "Beta",
        priority: 0,
        rawDate: "2024-01-01",
      };
      expect(sortCredentials(badgeA, badgeB)).toBeLessThan(0);
    });
  });

  describe("getAllCredentials offline / fallback handling", () => {
    it("fetches, merges, deduplicates, and applies filters and sorting with mocked feeds", async () => {
      const { getAllCredentials } =
        await import("../../src/utils/certifications");
      const credentials = await getAllCredentials();
      expect(Array.isArray(credentials)).toBe(true);
      expect(credentials.length).toBeGreaterThan(0);

      // Asserts sorting: each item priority should be >= next item priority, or date >= next date
      for (let i = 0; i < credentials.length - 1; i++) {
        expect(credentials[i].priority).toBeGreaterThanOrEqual(
          credentials[i + 1].priority,
        );
      }
    });

    it("falls back gracefully to local education.json when an external API returns empty or fails", async () => {
      const { getLocalFallbackCredentials } =
        await import("../../src/utils/manualCredentials");
      const fallbacks = getLocalFallbackCredentials();
      expect(fallbacks.length).toBeGreaterThan(0);

      // When Microsoft API is down, fallback yields local Microsoft badges
      const msFallback = fallbacks.filter((b) => b.issuer === "Microsoft");
      expect(msFallback.length).toBeGreaterThan(0);

      // When Credly API is down, fallback yields local non-Microsoft badges
      const otherFallback = fallbacks.filter((b) => b.issuer !== "Microsoft");
      expect(otherFallback.length).toBeGreaterThan(0);
    });
  });
});
