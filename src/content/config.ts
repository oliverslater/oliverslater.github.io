import { defineCollection, z } from 'astro:content';

// Blog collection schema
const blog = defineCollection({
  type: 'content',
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

// CV data collection schema
const cv = defineCollection({
  type: 'data',
  schema: z.any(),
});

export const collections = {
  blog,
  cv,
};

// TypeScript definitions for CV data structures
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
