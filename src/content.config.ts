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

const cv = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/cv" }),
  schema: z.any(),
});

export const collections = {
  blog,
  cv,
};

export interface ProfileData {
  name: string;
  title: string;
  email: string;
  location?: string;
  bio: string;
  website?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
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
