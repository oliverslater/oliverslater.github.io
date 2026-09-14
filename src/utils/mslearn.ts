import type { CredentialItem } from './credentialTypes';
import { formatDate } from './credentialTypes';

export const MS_LEARN_SHARE_ID = 'd5on2cqnl3lgknq';
export const MS_LEARN_PUBLIC_TRANSCRIPT_URL = `https://learn.microsoft.com/en-gb/users/oliverslater/transcript/${MS_LEARN_SHARE_ID}`;
export const MS_LEARN_API_URL = `https://learn.microsoft.com/api/profiles/transcript/share/${MS_LEARN_SHARE_ID}`;

/**
 * Dynamically fetches Oliver Slater's verified credentials from Microsoft Learn transcript API
 */
export async function fetchMicrosoftLearnBadges(): Promise<CredentialItem[]> {
  try {
    const res = await fetch(MS_LEARN_API_URL, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'OliverSlater-VirtualCV/1.0',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      console.warn(`Microsoft Learn API returned HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();
    const certs = data.certificationData?.activeCertifications || [];

    return certs.map((c: any, idx: number) => ({
      id: `ms-${c.certificationNumber || idx}`,
      title: c.name,
      issuer: 'Microsoft',
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
  } catch (err) {
    console.warn('Notice: Could not fetch live Microsoft Learn data:', err);
    return [];
  }
}

export function getDefaultMicrosoftBadgeIcon(title: string): string {
  const t = title.toLowerCase();

  if (t.includes('expert')) {
    return '/badges/microsoft/microsoft-certified-expert-badge.svg';
  }
  if (t.includes('associate')) {
    return '/badges/microsoft/microsoft-certified-associate-badge.svg';
  }
  if (t.includes('fundamentals')) {
    return '/badges/microsoft/microsoft-certified-fundamentals-badge.svg';
  }
  if (t.includes('specialty') || t.includes('specialist')) {
    return '/badges/microsoft/microsoft-certified-specialty-badge.svg';
  }
  return '/badges/microsoft/microsoft-certified-general-badge.svg';
}
