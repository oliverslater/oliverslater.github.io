import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatMonthYear,
  calculateTotalExperienceYears,
} from "../../src/utils/date";

describe("date utils", () => {
  describe("formatDate", () => {
    it("returns empty string for null or undefined or empty inputs", () => {
      expect(formatDate(null)).toBe("");
      expect(formatDate(undefined)).toBe("");
      expect(formatDate("")).toBe("");
    });

    it("formats a valid ISO string date", () => {
      const formatted = formatDate("2024-01-15T00:00:00Z");
      expect(formatted).toMatch(/15 Jan 2024/);
    });

    it("formats a Date object", () => {
      const d = new Date(Date.UTC(2023, 10, 20));
      expect(formatDate(d)).toMatch(/20 Nov 2023/);
    });

    it("returns raw string if invalid date string", () => {
      expect(formatDate("invalid-date")).toBe("invalid-date");
    });
  });

  describe("formatMonthYear", () => {
    it("formats date to Month Year", () => {
      const formatted = formatMonthYear("2025-05-01");
      expect(formatted).toMatch(/May 2025/);
    });
  });

  describe("calculateTotalExperienceYears", () => {
    it("returns 0 for empty roles array", () => {
      expect(calculateTotalExperienceYears([])).toBe(0);
    });

    it("calculates experience across sequential non-overlapping roles", () => {
      const roles = [
        { startDate: "Jan 2020", endDate: "Dec 2021" }, // 2 years
        { startDate: "Jan 2022", endDate: "Dec 2023" }, // 2 years
      ];
      const years = calculateTotalExperienceYears(roles);
      expect(years).toBeGreaterThanOrEqual(4);
    });

    it("correctly merges overlapping roles without double-counting", () => {
      const roles = [
        { startDate: "Jan 2020", endDate: "Dec 2022" }, // 3 years
        { startDate: "Jun 2021", endDate: "Jun 2022" }, // nested inside role 1
      ];
      const years = calculateTotalExperienceYears(roles);
      expect(years).toBe(3);
    });
  });
});
