export interface CredentialItem {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  rawDate?: string;
  expiresDate?: string;
  rawExpiresDate?: string;
  imageUrl?: string;
  verifyUrl: string;
  displayed: boolean;
  includeInCount: boolean;
  priority: number;
}

// Backward-compatibility alias
export type CredlyBadge = CredentialItem;

export interface CertificationOverride {
  id?: string;
  title?: string;
  displayTitle?: string;
  displayed?: boolean;
  includeInCount?: boolean;
  priority?: number;
  order?: number;
  expiresDate?: string;
  expiryDate?: string;
  expires?: string;
  verifyUrl?: string;
  verificationUrl?: string;
  url?: string;
  imageUrl?: string;
  badgeUrl?: string;
  badgeImageUrl?: string;
  issueDate?: string;
  issuedDate?: string;
  issued?: string;
  issuer?: string;
}

import { formatMonthYear } from "./date";
import { issuerMappings } from "../data/siteData";

export const DEFAULT_ISSUER_MAPPINGS: Record<string, string> = {
  "Amazon Web Services": "AWS",
  AWS: "AWS",
  Microsoft: "Microsoft",
  HashiCorp: "HashiCorp",
  IBM: "IBM",
  "The Linux Foundation": "Linux Foundation",
  "Linux Foundation": "Linux Foundation",
  "Cloud Native Computing Foundation": "CNCF",
  CNCF: "CNCF",
  Google: "Google Cloud",
  "Red Hat": "Red Hat",
};

export function cleanIssuerName(
  raw?: string,
  customMappings?: Record<string, string>,
): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();

  const settingsMappings = issuerMappings || {};
  const mergedMappings: Record<string, string> = {
    ...DEFAULT_ISSUER_MAPPINGS,
    ...settingsMappings,
    ...customMappings,
  };

  for (const [pattern, normalized] of Object.entries(mergedMappings)) {
    if (lower.includes(pattern.toLowerCase())) {
      return normalized;
    }
  }

  return trimmed;
}

export function formatDate(dateStr?: string): string {
  return formatMonthYear(dateStr);
}

export function parseTime(str?: string): number {
  if (!str) return 0;
  try {
    const clean = str.split(/[–—]|\s+-\s+/)[0].trim();
    const t = new Date(clean).getTime();
    return isNaN(t) ? 0 : t;
  } catch {
    return 0;
  }
}

export function isCredentialExpired(
  rawExpiresDate?: string,
  formattedExpiresDate?: string,
): boolean {
  if (!rawExpiresDate && !formattedExpiresDate) return false;
  const target = rawExpiresDate || formattedExpiresDate;
  if (!target) return false;

  try {
    const clean =
      target
        .split(/[–—]|\s+-\s+/)
        .pop()
        ?.trim() || target;
    const expTime = new Date(clean).getTime();
    if (isNaN(expTime)) return false;

    // If only month and year (e.g. "Nov 2025"), give grace until end of month
    const isOnlyMonthYear = /^[A-Za-z]{3,}\s+\d{4}$/.test(clean);
    if (isOnlyMonthYear) {
      const d = new Date(clean);
      const endOfMonth = new Date(
        d.getFullYear(),
        d.getMonth() + 1,
        0,
        23,
        59,
        59,
      ).getTime();
      return endOfMonth < Date.now();
    }

    return expTime < Date.now();
  } catch {
    return false;
  }
}

export function resolvePriority(
  priority?: number,
  order?: number,
  defaultVal: number = 0,
): number {
  if (priority !== undefined && !isNaN(Number(priority))) {
    return Number(priority);
  }
  if (order !== undefined && !isNaN(Number(order))) {
    // 1st place -> 999, 2nd place -> 998, etc.
    return 1000 - Number(order);
  }
  return defaultVal;
}
