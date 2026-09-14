import type { CredentialItem } from './credentialTypes';
import { cleanIssuerName, formatDate } from './credentialTypes';
import { getCachedData, getStaleCacheData, setCachedData } from './cache';

/**
 * Dynamically fetches Oliver Slater's verified credentials from Credly public API
 * Caches results locally to optimize build and dev times.
 */
export async function fetchCredlyBadges(username: string = 'oliver-slater'): Promise<CredentialItem[]> {
  const cacheKey = `credly-${username}`;
  const cached = getCachedData<CredentialItem[]>(cacheKey);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }

  const credlyEndpoint = `https://www.credly.com/users/${username}/badges.json`;

  try {
    const response = await fetch(credlyEndpoint, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'OliverSlater-VirtualCV/1.0',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      throw new Error(`Credly API returned HTTP ${response.status}`);
    }

    const payload = await response.json();
    const badges = payload.data || [];

    if (!Array.isArray(badges) || badges.length === 0) {
      throw new Error('No badges returned from Credly API');
    }

    const result: CredentialItem[] = badges.map((badge: any) => {
      const issuerName =
        badge.issuer?.entities?.[0]?.entity?.name ||
        badge.badge_template?.issuer?.entities?.[0]?.entity?.name ||
        'Amazon Web Services';

      const rawExp = badge.expires_at || badge.expires_at_date;

      return {
        id: badge.id,
        title: badge.badge_template?.name || badge.name,
        issuer: cleanIssuerName(issuerName),
        issueDate: formatDate(badge.issued_at_date),
        rawDate: badge.issued_at_date,
        expiresDate: rawExp ? formatDate(rawExp) : undefined,
        rawExpiresDate: rawExp,
        imageUrl: badge.image_url || badge.badge_template?.image_url,
        verifyUrl: `https://www.credly.com/badges/${badge.id}`,
        displayed: true,
        includeInCount: true,
        priority: 0,
      };
    });

    setCachedData(cacheKey, result);
    return result;
  } catch (err) {
    const stale = getStaleCacheData<CredentialItem[]>(cacheKey);
    if (stale && Array.isArray(stale) && stale.length > 0) {
      console.warn('Notice: Using stale cached credentials for Credly due to network/API error:', err);
      return stale;
    }
    console.warn('Notice: Using local credentials fallback for Credly:', err);
    return [];
  }
}

// Backward compatibility re-export
export { getAllCredentials as getCredlyBadges } from './certifications';
export type { CredentialItem, CredlyBadge } from './credentialTypes';
