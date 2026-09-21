import {
  profileData,
  educationData,
  experienceData,
  pageSeoData,
  certificationOverrides,
} from "../data/siteData";
import { findOverrideMatch } from "./certifications";

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

  // Dynamically extract active qualifications adhering to certification settings overrides
  const activeCredentials = educationData.qualifications.filter((q) => {
    const match = findOverrideMatch({ title: q.title }, certificationOverrides);
    return match?.displayed !== false;
  });
  const credentialNames = activeCredentials.map((q) => q.title);

  // Dynamically extract active roles from experience data
  const activeRoles = (experienceData.roles || []).filter(
    (r) => r.current === true || r.endDate?.toLowerCase() === "present",
  );
  const worksFor =
    activeRoles.length > 0
      ? activeRoles.length === 1
        ? {
            "@type": "Organization",
            name: activeRoles[0].company,
          }
        : activeRoles.map((r) => ({
            "@type": "Organization",
            name: r.company,
          }))
      : undefined;
  // Dynamically extract address details from profile data
  const addressLocality =
    profileData.addressLocality ||
    profileData.location?.split(",")[0]?.trim() ||
    profileData.location;

  const addressCountry =
    profileData.addressCountry ||
    (profileData.location?.toLowerCase().includes("united kingdom") ||
    profileData.location?.toLowerCase().includes("uk")
      ? "GB"
      : undefined);

  const postalAddress =
    addressLocality || addressCountry
      ? {
          "@type": "PostalAddress",
          ...(addressLocality ? { addressLocality } : {}),
          ...(addressCountry ? { addressCountry } : {}),
        }
      : undefined;

  const homeLocation = profileData.location
    ? {
        "@type": "Place",
        name: profileData.location,
      }
    : undefined;

  return {
    "@type": "Person",
    "@id": `${siteUrl}/#person`,
    name: profileData.name,
    jobTitle: profileData.title,
    description: profileData.metaDescription || profileData.bio,
    image: personImage,
    url: `${siteUrl}/`,
    sameAs: getPersonSameAs(),
    ...(postalAddress ? { address: postalAddress } : {}),
    ...(homeLocation ? { homeLocation } : {}),
    ...(worksFor ? { worksFor } : {}),
    ...(profileData.awards && profileData.awards.length > 0
      ? { award: profileData.awards }
      : {}),
    hasCredential: activeCredentials.map((q) => ({
      "@type": "EducationalOccupationalCredential",
      name: q.title,
      credentialCategory: "Professional Certification",
      recognizedBy: {
        "@type": "Organization",
        name: q.issuer,
      },
    })),
    knowsAbout: [...credentialNames, ...(profileData.coreCompetencies || [])],
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
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${siteUrl}/blog?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        },
        mainEntity: {
          "@id": `${siteUrl}/#person`,
        },
      },
      ...(normalizedPath !== "/"
        ? [
            {
              "@type": "BreadcrumbList",
              "@id": `${pageUrl}#breadcrumb`,
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: `${siteUrl}/`,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: options.name,
                  item: pageUrl,
                },
              ],
            },
          ]
        : []),
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
  categories?: string[];
  tags?: string[];
  siteUrl?: URL | string;
}

/**
 * Schema.org TechArticle graph linking article, publisher, and author Person entity.
 */
export function getTechArticleSchema(options: TechArticleSchemaOptions) {
  const siteUrl = getCanonicalSiteUrl(options.siteUrl);
  const articleUrl = options.url.endsWith("/")
    ? options.url
    : `${options.url}/`;
  const headshotImage = new URL(SEO_CONFIG.headshotImage, siteUrl).toString();
  const allKeywords = [...(options.categories || []), ...(options.tags || [])];
  const primaryCategory = (options.categories || [])[0];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Article", "TechArticle"],
        "@id": `${articleUrl}#article`,
        headline: options.title,
        description: options.description,
        url: articleUrl,
        image: [options.image],
        datePublished: new Date(options.pubDate).toISOString(),
        dateModified: options.updatedDate
          ? new Date(options.updatedDate).toISOString()
          : new Date(options.pubDate).toISOString(),
        author: {
          "@type": "Person",
          "@id": `${siteUrl}/#person`,
          name: profileData.name,
          url: `${siteUrl}/`,
        },
        publisher: {
          "@type": "Person",
          "@id": `${siteUrl}/#person`,
          name: profileData.name,
          url: `${siteUrl}/`,
          logo: {
            "@type": "ImageObject",
            url: headshotImage,
          },
        },
        inLanguage: "en-GB",
        keywords: allKeywords.join(", "),
        ...(primaryCategory ? { articleSection: primaryCategory } : {}),
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": articleUrl,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${articleUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${siteUrl}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: `${siteUrl}/blog/`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: options.title,
            item: articleUrl,
          },
        ],
      },
      getPersonSchema(siteUrl),
    ],
  };
}

export interface BlogIndexSchemaOptions {
  siteUrl?: URL | string;
  posts?: { title: string; url: string; date: string | Date }[];
}

/**
 * Schema.org Blog graph linking the blog, its posts, and the publisher Person entity.
 */
export function getBlogIndexSchema(options: BlogIndexSchemaOptions = {}) {
  const siteUrl = getCanonicalSiteUrl(options.siteUrl);
  const blogUrl = `${siteUrl}/blog/`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        "@id": `${blogUrl}#blog`,
        url: blogUrl,
        name:
          pageSeoData.blog.title ||
          `Engineering Notes & Architecture Blog | ${profileData.name}`,
        description: pageSeoData.blog.description,
        isPartOf: {
          "@type": "WebSite",
          "@id": `${siteUrl}/#website`,
          url: `${siteUrl}/`,
          name: profileData.name,
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${siteUrl}/blog?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        },
        publisher: {
          "@id": `${siteUrl}/#person`,
        },
        inLanguage: "en-GB",
        blogPost: (options.posts || []).map((p) => ({
          "@type": "BlogPosting",
          headline: p.title,
          url: p.url,
          datePublished: new Date(p.date).toISOString(),
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${blogUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${siteUrl}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: blogUrl,
          },
        ],
      },
      getPersonSchema(siteUrl),
    ],
  };
}

export interface ContactPageSchemaOptions {
  siteUrl?: URL | string;
}

/**
 * Schema.org ContactPage graph linking contact page and the Person entity.
 */
export function getContactPageSchema(options: ContactPageSchemaOptions = {}) {
  const siteUrl = getCanonicalSiteUrl(options.siteUrl);
  const contactUrl = `${siteUrl}/contact/`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        "@id": `${contactUrl}#webpage`,
        url: contactUrl,
        name:
          pageSeoData.contact.title ||
          `Contact | ${profileData.name} – ${profileData.title}`,
        description: pageSeoData.contact.description,
        isPartOf: {
          "@type": "WebSite",
          "@id": `${siteUrl}/#website`,
          url: `${siteUrl}/`,
          name: profileData.name,
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${siteUrl}/blog?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        },
        mainEntity: {
          "@id": `${siteUrl}/#person`,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${contactUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${siteUrl}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Contact",
            item: contactUrl,
          },
        ],
      },
      getPersonSchema(siteUrl),
    ],
  };
}
