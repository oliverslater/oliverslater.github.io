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
  const articleUrl = options.url.endsWith("/")
    ? options.url
    : `${options.url}/`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${articleUrl}#article`,
        headline: options.title,
        description: options.description,
        url: articleUrl,
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
        name: `Engineering Notes & Architecture Blog | ${profileData.name}`,
        description:
          "Articles on cloud architecture, serverless infrastructure, Infrastructure as Code, and platform reliability.",
        isPartOf: {
          "@type": "WebSite",
          "@id": `${siteUrl}/#website`,
          url: `${siteUrl}/`,
          name: profileData.name,
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
        name: `Contact | ${profileData.name} – Cloud Architecture & Consulting`,
        description: `Get in touch with ${profileData.name} to discuss cloud architecture, ask technical questions, or exchange insights on platform engineering.`,
        isPartOf: {
          "@type": "WebSite",
          "@id": `${siteUrl}/#website`,
          url: `${siteUrl}/`,
          name: profileData.name,
        },
        mainEntity: {
          "@id": `${siteUrl}/#person`,
        },
      },
      getPersonSchema(siteUrl),
    ],
  };
}
