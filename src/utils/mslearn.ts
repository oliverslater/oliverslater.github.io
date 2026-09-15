import type { CredentialItem } from "./credentialTypes";
import { formatDate } from "./credentialTypes";
import { getCachedData, getStaleCacheData, setCachedData } from "./cache";
import { credentialProviderConfig } from "../data/siteData";
import { fetchCredentialJson } from "./credentialApi";

export const MS_LEARN_SHARE_ID = credentialProviderConfig.microsoftLearnShareId;
export const MS_LEARN_PUBLIC_TRANSCRIPT_URL =
  credentialProviderConfig.microsoftLearnTranscriptUrl;
export const MS_LEARN_API_URL = `https://learn.microsoft.com/api/profiles/transcript/share/${MS_LEARN_SHARE_ID}`;

/**
 * Dynamically fetches Oliver Slater's verified credentials from Microsoft Learn transcript API
 * Caches results locally to optimize build and dev times.
 */
export async function fetchMicrosoftLearnBadges(): Promise<CredentialItem[]> {
  const cacheKey = `mslearn-${MS_LEARN_SHARE_ID}`;
  const cached = getCachedData<CredentialItem[]>(cacheKey);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }

  try {
    const data = await fetchCredentialJson<{
      certificationData?: { activeCertifications?: unknown[] };
    }>(MS_LEARN_API_URL, 12000, "Microsoft Learn");
    const certs = data.certificationData?.activeCertifications || [];

    const result: CredentialItem[] = certs.map((c: any, idx: number) => ({
      id: `ms-${c.certificationNumber || idx}`,
      title: c.name,
      issuer: "Microsoft",
      issueDate: formatDate(c.dateEarned),
      rawDate: c.dateEarned,
      expiresDate: c.expiration ? formatDate(c.expiration) : undefined,
      rawExpiresDate: c.expiration,
      imageUrl: getDefaultMicrosoftBadgeIcon(c.name),
      verifyUrl: MS_LEARN_PUBLIC_TRANSCRIPT_URL,
      displayed: true,
      includeInCount: true,
      priority: 0,
    }));

    setCachedData(cacheKey, result);
    return result;
  } catch (err) {
    const stale = getStaleCacheData<CredentialItem[]>(cacheKey);
    if (stale && Array.isArray(stale) && stale.length > 0) {
      console.warn(
        "Notice: Using stale cached credentials for Microsoft Learn due to network/API error:",
        err,
      );
      return stale;
    }
    console.warn("Notice: Could not fetch live Microsoft Learn data:", err);
    return [];
  }
}

export function getDefaultMicrosoftBadgeIcon(title: string): string {
  const t = title.toLowerCase();

  if (t.includes("expert")) {
    return "/badges/microsoft/microsoft-certified-expert-badge.svg";
  }
  if (t.includes("associate")) {
    return "/badges/microsoft/microsoft-certified-associate-badge.svg";
  }
  if (t.includes("fundamentals")) {
    return "/badges/microsoft/microsoft-certified-fundamentals-badge.svg";
  }
  if (t.includes("specialty") || t.includes("specialist")) {
    return "/badges/microsoft/microsoft-certified-specialty-badge.svg";
  }
  return "/badges/microsoft/microsoft-certified-general-badge.svg";
}
