import certificationSettingsData from "../content/cv/certification-settings.json";
import deliverablesData from "../content/cv/deliverables.json";
import educationData from "../content/cv/education.json";
import experienceData from "../content/cv/experience.json";
import manualCertificationsData from "../content/cv/manual-certifications.json";
import profileData from "../content/cv/profile.json";
import skillsData from "../content/cv/skills.json";
import technologiesData from "../content/technologies.json";

export {
  certificationSettingsData,
  deliverablesData,
  educationData,
  experienceData,
  manualCertificationsData,
  profileData,
  skillsData,
  technologiesData,
};

export const certificationOverrides = certificationSettingsData.overrides;
export const issuerMappings = certificationSettingsData.issuerMappings;

export const credentialSources = {
  credlyProfileUrl: profileData.credly,
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

export const siteConfig = {
  name: profileData.name,
  title: profileData.title,
  website: profileData.website,
  avatar: profileData.avatar,
  location: profileData.location,
  github: profileData.github,
  linkedin: profileData.linkedin,
  defaultOgImage: "/assets/og-image.png",
};

export const blogConfig = {
  title: `Engineering Notes & Architecture Blog | ${profileData.name}`,
  shortTitle: "Engineering Notes",
  feedTitle: `${profileData.name} | Engineering Notes & Architecture Blog`,
  description:
    "Articles on cloud architecture, serverless infrastructure, Infrastructure as Code, and platform reliability.",
  author: profileData.name,
  language: "en-gb",
  feedPath: "/blog/feed.xml",
  rssPath: "/blog/rss.xml",
};
