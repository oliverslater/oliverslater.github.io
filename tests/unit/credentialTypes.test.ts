import { describe, it, expect } from "vitest";
import {
  cleanIssuerName,
  parseTime,
  isCredentialExpired,
  resolvePriority,
} from "../../src/utils/credentialTypes";

describe("credentialTypes utils", () => {
  describe("cleanIssuerName", () => {
    it("returns empty string if empty input", () => {
      expect(cleanIssuerName("")).toBe("");
      expect(cleanIssuerName(undefined)).toBe("");
    });

    it("normalizes known issuer names according to default mappings", () => {
      expect(cleanIssuerName("Amazon Web Services")).toBe("AWS");
      expect(cleanIssuerName("The Linux Foundation")).toBe("Linux Foundation");
      expect(cleanIssuerName("Cloud Native Computing Foundation")).toBe("CNCF");
      expect(cleanIssuerName("Microsoft Corporation")).toBe("Microsoft");
    });

    it("preserves unmapped issuer names", () => {
      expect(cleanIssuerName("Coursera")).toBe("Coursera");
    });
  });

  describe("parseTime", () => {
    it("returns 0 for empty or invalid string", () => {
      expect(parseTime("")).toBe(0);
      expect(parseTime(undefined)).toBe(0);
      expect(parseTime("not-a-date")).toBe(0);
    });

    it("parses valid date string into epoch timestamp", () => {
      const ts = parseTime("2024-05-01");
      expect(ts).toBeGreaterThan(0);
    });

    it("handles date ranges by parsing the first date", () => {
      const ts = parseTime("Jan 2023 – Jan 2026");
      expect(ts).toBeGreaterThan(0);
    });
  });

  describe("isCredentialExpired", () => {
    it("returns false if no expiration date provided", () => {
      expect(isCredentialExpired(undefined, undefined)).toBe(false);
    });

    it("returns true for past expiration date", () => {
      expect(isCredentialExpired("2020-01-01")).toBe(true);
    });

    it("returns false for far future expiration date", () => {
      expect(isCredentialExpired("2099-12-31")).toBe(false);
    });

    it("handles month-year format with end-of-month grace", () => {
      expect(isCredentialExpired("Jan 2020")).toBe(true);
      expect(isCredentialExpired("Dec 2099")).toBe(false);
    });
  });

  describe("resolvePriority", () => {
    it("returns priority if provided", () => {
      expect(resolvePriority(50, undefined, 0)).toBe(50);
    });

    it("computes priority from 1-based order", () => {
      expect(resolvePriority(undefined, 1, 0)).toBe(999);
      expect(resolvePriority(undefined, 2, 0)).toBe(998);
    });

    it("falls back to default value if neither priority nor order provided", () => {
      expect(resolvePriority(undefined, undefined, 10)).toBe(10);
    });
  });
});
