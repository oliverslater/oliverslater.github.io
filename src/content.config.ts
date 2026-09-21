import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";

export const BLOG_CATEGORIES = [
  "Cloud Architecture",
  "Enterprise Strategy",
  "Platform Engineering",
  "DevSecOps",
  "Governance",
  "Homelab",
  "Edge Computing",
  "Self-Hosted",
  "IoT & Automation",
  "Experiments",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

const TITLE_CASE_MINOR_WORDS = new Set([
  "as",
  "in",
  "of",
  "for",
  "and",
  "the",
  "to",
  "on",
  "with",
  "&",
]);

const SPECIAL_TECH_CASES = new Set(["vLLM", "eBPF", "gRPC", "mTLS"]);

export function isTitleCaseTag(val: string): boolean {
  const words = val.trim().split(/[\s-]+/);
  if (words.length === 0) return false;
  return words.every((word, idx) => {
    if (!word) return true;
    if (idx === 0) {
      return (
        /^[A-Z0-9]/.test(word) ||
        /^[a-z][A-Z]{2,}/.test(word) ||
        SPECIAL_TECH_CASES.has(word)
      );
    }
    if (word === "&") return true;
    if (TITLE_CASE_MINOR_WORDS.has(word.toLowerCase())) return true;
    return (
      /^[A-Z0-9]/.test(word) ||
      /^[a-z][A-Z]{2,}/.test(word) ||
      SPECIAL_TECH_CASES.has(word)
    );
  });
}

const titleCaseTagSchema = z
  .string()
  .transform((v) => v.trim().replace(/^#/, ""))
  .refine((v) => v.length >= 2 && v.length <= 35, {
    message: "Tag must be between 2 and 35 characters.",
  })
  .refine(isTitleCaseTag, {
    message:
      "Tags must be in Title Case (e.g. 'AWS', 'Terraform', 'High Availability', 'Disaster Recovery').",
  });

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      lastUpdated: z.coerce.date().optional(),
      updatedDate: z.coerce.date().optional(),
      heroImage: z.string().optional(),
      categories: z.array(z.string()).default([]),
      category: z.string().optional(),
      tags: z.array(titleCaseTagSchema).default([]),
      draft: z.boolean().default(false),
    })
    .refine(
      (data) => {
        const updated = data.lastUpdated || data.updatedDate;
        if (updated && data.pubDate) {
          return (
            new Date(updated).getTime() >= new Date(data.pubDate).getTime()
          );
        }
        return true;
      },
      {
        message:
          "The 'lastUpdated' date cannot be earlier than the publication date ('pubDate').",
        path: ["lastUpdated"],
      },
    ),
});

export const collections = {
  blog,
};

export interface PageSeoItem {
  title: string;
  description: string;
  category?: string;
  tags?: string[];
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
  addressLocality?: string;
  addressCountry?: string;
  awards?: string[];
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
