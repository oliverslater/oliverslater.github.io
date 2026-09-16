import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  blog,
};

export interface PageSeoItem {
  title: string;
  description: string;
}

export interface PageSeoData {
  home: PageSeoItem;
  cv: PageSeoItem;
  contact: PageSeoItem;
  blog: PageSeoItem;
}

export interface ProfileData {
  name: string;
  title: string;
  avatar?: string;
  email: string;
  showEmail?: boolean;
  location?: string;
  metaDescription?: string;
  bio: string;
  website?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  headline?: string;
  credly?: string;
  mslearn?: string;
  coreCompetencies: string[];
}

export interface ExperienceRole {
  id: string;
  role: string;
  company: string;
  companyUrl?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description: string;
  highlights: string[];
  technologies: string[];
}

export interface ExperienceData {
  roles: ExperienceRole[];
}

export interface SkillCategory {
  category: string;
  skills: string[];
}

export interface SkillsData {
  categories: SkillCategory[];
}

export interface QualificationItem {
  title: string;
  issuer: string;
  level: string;
  validity: string;
}

export interface EducationData {
  qualifications: QualificationItem[];
}

export interface DeliverablePillar {
  category: string;
  icon?: string;
  items: string[];
}

export interface DeliverablesData {
  pillars: DeliverablePillar[];
}

export interface TechnologyItem {
  name: string;
  tag: string;
  logo?: string;
}

export interface TechnologiesData {
  technologies: TechnologyItem[];
}

export interface FeaturedCredentialItem {
  id: string;
  title: string;
  issuer: string;
  description: string;
  provider?: "aws" | "azure" | "terraform" | string;
  url?: string;
  badgeClass?: string;
  bgClass?: string;
  iconColor?: string;
  svgPath?: string;
}

export interface FeaturedCredentialsData {
  featured: FeaturedCredentialItem[];
}
