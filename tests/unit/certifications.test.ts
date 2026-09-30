import { describe, it, expect } from "vitest";
import {
  findOverrideMatch,
  applyOverrideToBadge,
  sortCredentials,
} from "../../src/utils/certifications";
import type {
  CredentialItem,
  CertificationOverride,
} from "../../src/utils/credentialTypes";

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
});
