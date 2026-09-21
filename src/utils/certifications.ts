import type { CredentialItem, CertificationOverride } from "./credentialTypes";
import {
  cleanIssuerName,
  formatDate,
  isCredentialExpired,
  parseTime,
  resolvePriority,
} from "./credentialTypes";
import { fetchCredlyBadges } from "./credly";
import { fetchMicrosoftLearnBadges } from "./mslearn";
import {
  getManualCredentials,
  getLocalFallbackCredentials,
} from "./manualCredentials";
import { certificationOverrides } from "../data/siteData";

/**
 * Main credentials orchestrator:
 * 1. Pulls from Microsoft Learn transcript API (mslearn.ts)
 * 2. Pulls from Credly badges API (credly.ts)
 * 3. Pulls from manual credentials (manualCredentials.ts)
 * 4. Falls back to local education.json if offline
 * 5. Applies overrides from certification-settings.json (title, issuer, dates, URLs, visibility, count, priority)
 * 6. Automatically filters out expired certifications (unless explicitly kept with displayed: true)
 * 7. Sorts by priority (descending), then issue date (newest first), then title
 */
export async function getAllCredentials(): Promise<CredentialItem[]> {
  const overrides: CertificationOverride[] = certificationOverrides || [];

  const manualBadges = getManualCredentials();

  const [credlyBadges, msBadges] = await Promise.all([
    fetchCredlyBadges(),
    fetchMicrosoftLearnBadges(),
  ]);

  // Graceful per-provider fallback: if either API fails/times out, use local education.json for that provider
  let liveOrFallbackMs = msBadges;
  if (liveOrFallbackMs.length === 0) {
    const fallbackList = getLocalFallbackCredentials();
    liveOrFallbackMs = fallbackList.filter((b) => b.issuer === "Microsoft");
  }

  let liveOrFallbackCredly = credlyBadges;
  if (liveOrFallbackCredly.length === 0) {
    const fallbackList = getLocalFallbackCredentials();
    liveOrFallbackCredly = fallbackList.filter((b) => b.issuer !== "Microsoft");
  }

  const combinedFeeds = [...liveOrFallbackMs, ...liveOrFallbackCredly];
  const feedTitles = new Set(
    combinedFeeds.map((b) => b.title.toLowerCase().trim()),
  );

  const nonDuplicatedManual = manualBadges.filter(
    (m) => !feedTitles.has(m.title.toLowerCase().trim()),
  );

  const allBadges = [...combinedFeeds, ...nonDuplicatedManual];

  // 1. Map and apply overrides to all badges
  const processedBadges = allBadges.map((badge) => {
    const match = findOverrideMatch(badge, overrides);
    const updated = applyOverrideToBadge(badge, match);
    return {
      badge: updated,
      explicitlyDisplayed: match?.displayed === true,
      explicitlyHidden: match?.displayed === false,
    };
  });

  // 2. Filter out expired or hidden certifications
  const visibleBadges = processedBadges
    .filter(({ badge, explicitlyDisplayed, explicitlyHidden }) => {
      // If explicitly hidden via settings, omit
      if (explicitlyHidden) return false;

      // If explicitly kept via displayed: true, retain even if expired
      if (explicitlyDisplayed) return true;

      // Otherwise filter out if expired
      const expired = isCredentialExpired(
        badge.rawExpiresDate,
        badge.expiresDate,
      );
      return !expired;
    })
    .map(({ badge }) => badge);

  // 3. Sort by priority, then issue date, then title
  return visibleBadges.sort(sortCredentials);
}

// Backward compatibility alias
export const getCredlyBadges = getAllCredentials;

export function findOverrideMatch(
  badge: { id?: string; title: string },
  overrides: CertificationOverride[],
): CertificationOverride | undefined {
  const badgeTitle = badge.title.toLowerCase().trim();
  const badgeId = (badge.id || "").toLowerCase().trim();

  return overrides.find((o) => {
    const oId = o.id?.toLowerCase().trim();
    const oTitle = o.title?.toLowerCase().trim();
    if (oId && oId === badgeId) return true;
    if (oTitle && (badgeTitle === oTitle || badgeTitle.includes(oTitle)))
      return true;
    return false;
  });
}

export function applyOverrideToBadge(
  badge: CredentialItem,
  match?: CertificationOverride,
): CredentialItem {
  if (!match) return badge;

  const result: CredentialItem = { ...badge };

  // 1. Display Title override
  if (match.displayTitle) {
    result.title = match.displayTitle;
  } else if (match.id && match.title && match.id === badge.id) {
    result.title = match.title;
  }

  // 2. Issuer override
  if (match.issuer) {
    result.issuer = cleanIssuerName(match.issuer);
  }

  // 3. Verification URL override (supports verifyUrl, verificationUrl, url)
  const overrideVerifyUrl =
    match.verifyUrl || match.verificationUrl || match.url;
  if (overrideVerifyUrl) {
    result.verifyUrl = overrideVerifyUrl;
  }

  // 4. Badge Image URL override (supports imageUrl, badgeUrl, badgeImageUrl)
  const overrideImageUrl =
    match.imageUrl || match.badgeUrl || match.badgeImageUrl;
  if (overrideImageUrl) {
    result.imageUrl = overrideImageUrl;
  }

  // 5. Issue Date override (supports issueDate, issuedDate, issued)
  const overrideIssueDate = match.issueDate || match.issuedDate || match.issued;
  if (overrideIssueDate) {
    result.issueDate = formatDate(overrideIssueDate);
    result.rawDate = overrideIssueDate;
  }

  // 6. Expiration Date override (supports expiresDate, expiryDate, expires)
  const overrideExpires =
    match.expiresDate || match.expiryDate || match.expires;
  if (overrideExpires !== undefined) {
    const clean = String(overrideExpires).trim().toLowerCase();
    if (
      !overrideExpires ||
      clean === "never" ||
      clean === "none" ||
      clean === "no expiry"
    ) {
      result.expiresDate = undefined;
      result.rawExpiresDate = undefined;
    } else {
      result.expiresDate = formatDate(overrideExpires);
      result.rawExpiresDate = overrideExpires;
    }
  }

  // 7. Visibility override
  if (match.displayed !== undefined) {
    result.displayed = match.displayed;
  }

  // 8. Count inclusion override
  if (match.includeInCount !== undefined) {
    result.includeInCount = match.includeInCount;
  }

  // 9. Priority / Order ranking
  result.priority = resolvePriority(
    match.priority,
    match.order,
    badge.priority,
  );

  return result;
}

export function applyOverrides(
  badge: CredentialItem,
  overrides: CertificationOverride[],
): CredentialItem {
  const match = findOverrideMatch(badge, overrides);
  return applyOverrideToBadge(badge, match);
}

/**
 * Sorts credentials by:
 * 1. Priority (higher number first)
 * 2. Issue date descending (most recent first)
 * 3. Title alphabetical
 */
function sortCredentials(a: CredentialItem, b: CredentialItem): number {
  if (a.priority !== b.priority) {
    return b.priority - a.priority;
  }

  const timeA = parseTime(a.rawDate || a.issueDate);
  const timeB = parseTime(b.rawDate || b.issueDate);

  if (timeA !== timeB) {
    return timeB - timeA;
  }

  return a.title.localeCompare(b.title);
}
