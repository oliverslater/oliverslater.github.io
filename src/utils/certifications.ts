import type { CredentialItem, CertificationOverride } from './credentialTypes';
import { isCredentialExpired, parseTime, resolvePriority } from './credentialTypes';
import { fetchCredlyBadges } from './credly';
import { fetchMicrosoftLearnBadges } from './mslearn';
import { getManualCredentials, getLocalFallbackCredentials } from './manualCredentials';
import certSettings from '../content/cv/certification-settings.json';

/**
 * Main credentials orchestrator:
 * 1. Pulls from Microsoft Learn transcript API (mslearn.ts)
 * 2. Pulls from Credly badges API (credly.ts)
 * 3. Pulls from manual credentials (manualCredentials.ts)
 * 4. Falls back to local education.json if offline
 * 5. Automatically filters out expired certifications
 * 6. Applies overrides (displayed, includeInCount, priority/order) from certification-settings.json
 * 7. Sorts by priority (descending), then issue date (newest first), then title
 */
export async function getAllCredentials(): Promise<CredentialItem[]> {
  const overrides: CertificationOverride[] = (certSettings as any).overrides || [];

  const manualBadges = getManualCredentials();

  const [credlyBadges, msBadges] = await Promise.all([
    fetchCredlyBadges(),
    fetchMicrosoftLearnBadges(),
  ]);

  let allBadges: CredentialItem[] = [];

  // If both external APIs failed (e.g. offline build), fall back to local education.json
  if (credlyBadges.length === 0 && msBadges.length === 0) {
    const fallbackList = getLocalFallbackCredentials();
    const fallbackTitles = new Set(fallbackList.map((b) => b.title.toLowerCase().trim()));
    const nonDuplicatedManual = manualBadges.filter(
      (m) => !fallbackTitles.has(m.title.toLowerCase().trim())
    );

    allBadges = [...nonDuplicatedManual, ...fallbackList];
  } else {
    // Combine live feeds: Microsoft Learn + Credly + any non-duplicated manual entries
    const combinedLive = [...msBadges, ...credlyBadges];
    const liveTitles = new Set(combinedLive.map((b) => b.title.toLowerCase().trim()));

    const nonDuplicatedManual = manualBadges.filter(
      (m) => !liveTitles.has(m.title.toLowerCase().trim())
    );

    allBadges = [...combinedLive, ...nonDuplicatedManual];
  }

  // 1. Filter out expired certifications (unless an override explicitly re-enables displayed: true)
  const unexpiredBadges = allBadges.filter((b) => {
    const expired = isCredentialExpired(b.rawExpiresDate, b.expiresDate);
    if (!expired) return true;

    // Check if user explicitly overrode to display this expired credential
    const match = findOverrideMatch(b, overrides);
    return match?.displayed === true;
  });

  // 2. Apply visibility, count, and priority overrides, then sort
  return unexpiredBadges
    .map((badge) => applyOverrides(badge, overrides))
    .sort(sortCredentials);
}

// Backward compatibility alias
export const getCredlyBadges = getAllCredentials;

function findOverrideMatch(
  badge: CredentialItem,
  overrides: CertificationOverride[]
): CertificationOverride | undefined {
  const badgeTitle = badge.title.toLowerCase().trim();
  const badgeId = badge.id.toLowerCase().trim();

  return overrides.find((o) => {
    const oId = o.id?.toLowerCase().trim();
    const oTitle = o.title?.toLowerCase().trim();
    if (oId && oId === badgeId) return true;
    if (oTitle && (badgeTitle === oTitle || badgeTitle.includes(oTitle))) return true;
    return false;
  });
}

function applyOverrides(
  badge: CredentialItem,
  overrides: CertificationOverride[]
): CredentialItem {
  const match = findOverrideMatch(badge, overrides);

  if (match) {
    return {
      ...badge,
      displayed: match.displayed !== undefined ? match.displayed : badge.displayed,
      includeInCount: match.includeInCount !== undefined ? match.includeInCount : badge.includeInCount,
      priority: resolvePriority(match.priority, match.order, badge.priority),
    };
  }

  return badge;
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
