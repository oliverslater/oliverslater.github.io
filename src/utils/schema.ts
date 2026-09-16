import { profileData } from "../data/siteData";

export const SEO_CONFIG = {
  defaultOgImage: "/assets/og-image.png",
  headshotImage: "/assets/oliver-slater-512.png",
  robots: {
    default:
      "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    noindex: "noindex, nofollow",
  },
} as const;

/**
 * Normalizes a site URL or fallback to ensure no trailing slash.
 */
export function getCanonicalSiteUrl(site?: URL | string): string {
  const url = site ? site.toString() : profileData.website;
  return url.replace(/\/+$/, "");
}

/**
 * Disambiguation social profiles and authoritative links for Google Knowledge Graph.
 */
export function getPersonSameAs(): string[] {
  return [
    profileData.linkedin,
    profileData.github,
    profileData.credly,
    profileData.mslearn,
  ].filter(Boolean);
}

/**
 * Canonical Schema.org Person entity for Oliver Slater.
 */
export function getPersonSchema(siteUrlInput?: URL | string) {
  const siteUrl = getCanonicalSiteUrl(siteUrlInput);
  const personImage = new URL(SEO_CONFIG.headshotImage, siteUrl).toString();

  return {
    "@type": "Person",
    "@id": `${siteUrl}/#person`,
    name: profileData.name,
    jobTitle: profileData.title,
    description: profileData.metaDescription || profileData.bio,
    image: personImage,
    url: `${siteUrl}/`,
    sameAs: getPersonSameAs(),
    knowsAbout: profileData.coreCompetencies || [],
  };
}

export interface ProfilePageSchemaOptions {
  path: string;
  name: string;
  description?: string;
  siteUrl?: URL | string;
}

/**
 * Schema.org ProfilePage graph linking WebSite, ProfilePage, and the Person entity.
 */
export function getProfilePageSchema(options: ProfilePageSchemaOptions) {
  const siteUrl = getCanonicalSiteUrl(options.siteUrl);
  const normalizedPath = options.path.startsWith("/")
    ? options.path
    : `/${options.path}`;
  const pageUrl =
    normalizedPath === "/"
      ? `${siteUrl}/`
      : `${siteUrl}${normalizedPath.endsWith("/") ? normalizedPath : `${normalizedPath}/`}`;
  const pageId =
    normalizedPath === "/" ? `${siteUrl}/#webpage` : `${pageUrl}#webpage`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": pageId,
        url: pageUrl,
        name: options.name,
        isPartOf: {
          "@type": "WebSite",
          "@id": `${siteUrl}/#website`,
          url: `${siteUrl}/`,
          name: profileData.name,
          description:
            options.description ||
            profileData.metaDescription ||
            profileData.bio,
        },
        mainEntity: {
          "@id": `${siteUrl}/#person`,
        },
      },
      getPersonSchema(siteUrl),
    ],
  };
}

export interface TechArticleSchemaOptions {
  title: string;
  description: string;
  url: string;
  image: string;
  pubDate: string | Date;
  updatedDate?: string | Date;
  tags?: string[];
  siteUrl?: URL | string;
}

/**
 * Schema.org TechArticle graph linking article, publisher, and author Person entity.
 */
export function getTechArticleSchema(options: TechArticleSchemaOptions) {
  const siteUrl = getCanonicalSiteUrl(options.siteUrl);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${options.url}#article`,
        headline: options.title,
        description: options.description,
        url: options.url,
        image: options.image,
        datePublished: new Date(options.pubDate).toISOString(),
        dateModified: options.updatedDate
          ? new Date(options.updatedDate).toISOString()
          : new Date(options.pubDate).toISOString(),
        author: {
          "@id": `${siteUrl}/#person`,
        },
        publisher: {
          "@id": `${siteUrl}/#person`,
        },
        inLanguage: "en-GB",
        keywords: (options.tags || []).join(", "),
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": options.url,
        },
      },
      getPersonSchema(siteUrl),
    ],
  };
}
