import { profileData } from "../data/siteData";

export interface ContactDetails {
  showEmail: boolean;
  contactEmail: string;
  location: string;
  github: string;
  linkedin: string;
  website: string;
}

export function getContactDetails(): ContactDetails {
  const showEmail = profileData.showEmail;
  const contactEmail =
    import.meta.env.CONTACT_EMAIL ||
    import.meta.env.PUBLIC_CONTACT_EMAIL ||
    profileData.email ||
    "";

  return {
    showEmail,
    contactEmail,
    location: profileData.location,
    github: profileData.github,
    linkedin: profileData.linkedin,
    website: profileData.website,
  };
}
