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

export function cleanIssuerName(raw: string): string {
  if (raw.includes("Amazon Web Services")) return "AWS";
  if (raw.includes("HashiCorp")) return "HashiCorp";
  if (raw.includes("Microsoft")) return "Microsoft";
  if (raw.includes("IBM")) return "IBM";
  return raw;
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-GB", {
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
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
