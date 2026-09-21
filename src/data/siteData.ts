import type { FeaturedCredentialItem, PageSeoData } from "../content.config";
import certificationSettingsData from "../content/cv/certification-settings.json";
import cvVersionData from "../content/cv/cv-version.json";
import deliverablesData from "../content/cv/deliverables.json";
import educationData from "../content/cv/education.json";
import experienceData from "../content/cv/experience.json";
import featuredCredentialsData from "../content/cv/featured-credentials.json";
import manualCertificationsData from "../content/cv/manual-certifications.json";
import profileData from "../content/cv/profile.json";
import pageSeoDataRaw from "../content/page-seo.json";
import skillsData from "../content/cv/skills.json";
import technologiesData from "../content/technologies.json";

export const pageSeoData: PageSeoData = pageSeoDataRaw;

export {
  certificationSettingsData,
  cvVersionData,
  deliverablesData,
  educationData,
  experienceData,
  featuredCredentialsData,
  manualCertificationsData,
  profileData,
  skillsData,
  technologiesData,
};

export const PAGE_SEO = pageSeoData;

export const certificationOverrides = certificationSettingsData.overrides;
export const issuerMappings = certificationSettingsData.issuerMappings;

export const credentialSources = {
  credlyProfileUrl: profileData.credly,
  credlyBadgesUrl: profileData.credly ? `${profileData.credly}/badges` : "",
  microsoftLearnTranscriptUrl: profileData.mslearn,
};

export const credentialProviderConfig = {
  credlyProfileUrl: credentialSources.credlyProfileUrl,
  credlyBadgeUrl: (badgeId: string) =>
    new URL(
      `/badges/${badgeId}`,
      new URL(credentialSources.credlyProfileUrl).origin,
    ).toString(),
  microsoftLearnTranscriptUrl: credentialSources.microsoftLearnTranscriptUrl,
  microsoftLearnShareId: credentialSources.microsoftLearnTranscriptUrl
    ? new URL(credentialSources.microsoftLearnTranscriptUrl).pathname
        .split("/")
        .filter(Boolean)
        .at(-1)
    : "",
};

const DEFAULT_PROVIDER_THEMES: Record<
  string,
  {
    badgeClass: string;
    bgClass: string;
    iconColor: string;
    svgPath: string;
  }
> = {
  aws: {
    badgeClass: "bg-orange-500/10 text-[#FF9900] border-orange-500/20",
    bgClass: "bg-[#FF9900]/10",
    iconColor: "text-[#FF9900]",
    svgPath:
      "M18.75 14.25C17.5 15.2 15.2 16.1 12 16.1c-4.4 0-6.9-1.9-7.2-2.1-.3-.2-.5 0-.5.3 0 .1.1.3.3.4.4.4 2.8 2.3 7.4 2.3 3.5 0 6.1-1 7.4-2.1.3-.2.2-.6-.2-.6h-.45zM19.9 15.8c-.2-.3-1.4-.7-2.7-.7-.4 0-.4.3 0 .5 1.1.5 2.4.5 2.6.4.2 0 .3-.1.1-.2z",
  },
  azure: {
    badgeClass: "bg-blue-500/10 text-[#0089D6] border-blue-500/20",
    bgClass: "bg-[#0089D6]/10",
    iconColor: "text-[#0089D6]",
    svgPath:
      "M13.05 4.24l-5.69 9.87 4.7 3.32 6.54-11.23L13.05 4.24zm-6.6 11.45l-3.95 4.07h13.9l-2.73-4.07H6.45z",
  },
  terraform: {
    badgeClass: "bg-purple-500/10 text-[#844FBA] border-purple-500/20",
    bgClass: "bg-[#844FBA]/10",
    iconColor: "text-[#844FBA]",
    svgPath:
      "M1.44 0v7.575l6.561 3.79V3.788L1.44 0zm7.2 4.212v7.575L15.2 8V.424L8.64 4.212zm7.2 0v7.575l6.56-3.789V.424L15.84 4.212zM8.64 12.213v7.575l6.56-3.79V8.423l-6.56 3.79z",
  },
};

export const featuredCredentials = (
  featuredCredentialsData.featured as FeaturedCredentialItem[]
).map((item) => {
  const providerKey = (item.provider || "").toLowerCase();
  const defaults = DEFAULT_PROVIDER_THEMES[providerKey] || {
    badgeClass:
      "bg-neutral-100 dark:bg-neutral-800 text-[var(--sec)] border-neutral-300 dark:border-neutral-700",
    bgClass: "bg-[var(--sec)]/10",
    iconColor: "text-[var(--sec)]",
    svgPath: "",
  };

  return {
    ...item,
    badgeClass: item.badgeClass || defaults.badgeClass,
    bgClass: item.bgClass || defaults.bgClass,
    iconColor: item.iconColor || defaults.iconColor,
    svgPath: item.svgPath || defaults.svgPath,
    url:
      item.url ||
      (providerKey === "azure"
        ? credentialSources.microsoftLearnTranscriptUrl
        : credentialSources.credlyBadgesUrl),
  };
});

export const siteConfig = {
  name: profileData.name,
  title: profileData.title,
  website: profileData.website,
  avatar: profileData.avatar,
  location: profileData.location,
  github: profileData.github,
  linkedin: profileData.linkedin,
  defaultOgImage: "/assets/og-image.png",
  description: profileData.metaDescription || profileData.bio,
};

export const blogConfig = {
  title:
    pageSeoData.blog.title ||
    `Engineering Notes & Architecture Blog | ${profileData.name}`,
  shortTitle: "Engineering Notes",
  feedTitle: `${profileData.name} | Engineering Notes & Architecture Blog`,
  description: pageSeoData.blog.description,
  author: profileData.name,
  language: "en-gb",
  feedPath: "/blog/feed.xml",
  rssPath: "/blog/rss.xml",
};

export const cvPdfFilename = cvVersionData.filename;
export const cvPdfPath = `/${cvPdfFilename}`;
