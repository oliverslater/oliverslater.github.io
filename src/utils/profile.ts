import profileData from "../content/cv/profile.json";

export interface ContactDetails {
  showEmail: boolean;
  contactEmail: string;
  location: string;
  github: string;
  linkedin: string;
  website: string;
}

export function getContactDetails(): ContactDetails {
  const showEmail =
    (profileData as any).showEmail ??
    (profileData as any).emailVisible ??
    false;
  const contactEmail =
    import.meta.env.CONTACT_EMAIL ||
    import.meta.env.PUBLIC_CONTACT_EMAIL ||
    (profileData as any).email ||
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
