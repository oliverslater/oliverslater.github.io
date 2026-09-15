import type { CredentialItem } from "./credentialTypes";
import { cleanIssuerName, resolvePriority } from "./credentialTypes";
import {
  getDefaultMicrosoftBadgeIcon,
  MS_LEARN_PUBLIC_TRANSCRIPT_URL,
} from "./mslearn";
import {
  educationData,
  manualCertificationsData as manualCertsData,
  profileData,
} from "../data/siteData";

/**
 * Loads and normalizes manual certifications from manual-certifications.json
 */
export function getManualCredentials(): CredentialItem[] {
  return (manualCertsData.certifications || []).map((c: any) => {
    const issuer = cleanIssuerName(c.issuer);
    return {
      id: c.id,
      title: c.title,
      issuer,
      issueDate: c.issueDate,
      rawDate: c.rawDate || c.issueDate,
      expiresDate: c.expiresDate,
      rawExpiresDate: c.expiresDate,
      imageUrl:
        c.badgeImageUrl ||
        c.imageUrl ||
        (issuer === "Microsoft"
          ? getDefaultMicrosoftBadgeIcon(c.title)
          : undefined),
      verifyUrl: c.verifyUrl,
      displayed: c.displayed !== undefined ? c.displayed : true,
      includeInCount: c.includeInCount !== undefined ? c.includeInCount : true,
      priority: resolvePriority(c.priority, c.order, 0),
    };
  });
}

/**
 * Loads and normalizes local fallback qualifications from education.json
 * Used if external network APIs are unavailable during offline builds.
 */
export function getLocalFallbackCredentials(): CredentialItem[] {
  return educationData.qualifications.map((q: any, idx: number) => {
    const expStr = q.validity?.includes("–")
      ? q.validity.split("–")[1]?.trim()
      : undefined;
    const issuer = cleanIssuerName(q.issuer);
    return {
      id: `local-fallback-${idx}`,
      title: q.title,
      issuer,
      issueDate: q.validity,
      rawDate: q.validity,
      expiresDate: expStr,
      rawExpiresDate: expStr,
      imageUrl:
        q.badgeImageUrl ||
        q.imageUrl ||
        (issuer === "Microsoft"
          ? getDefaultMicrosoftBadgeIcon(q.title)
          : undefined),
      verifyUrl:
        issuer === "Microsoft"
          ? MS_LEARN_PUBLIC_TRANSCRIPT_URL
          : profileData.credly,
      displayed: q.displayed !== undefined ? q.displayed : true,
      includeInCount: q.includeInCount !== undefined ? q.includeInCount : true,
      priority: resolvePriority(q.priority, q.order, 0),
    };
  });
}
