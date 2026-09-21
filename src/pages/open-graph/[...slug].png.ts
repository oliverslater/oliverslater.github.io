import fs from "node:fs";
import path from "node:path";
import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import sharp from "sharp";
import {
  deliverablesData,
  pageSeoData,
  profileData,
} from "../../data/siteData";
import type { PageSeoItem } from "../../content.config";
import { isPostPublished } from "../../utils/blog";

function escapeXml(unsafe: string): string {
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

function wrapText(text: string, maxCharsPerLine = 34): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection("blog", (p) => isPostPublished(p));
  const postPaths = posts.map((post) => {
    const pubDate = new Date(post.data.pubDate);
    const year = pubDate.getFullYear();
    const month = String(pubDate.getMonth() + 1).padStart(2, "0");
    const categories: string[] =
      post.data.categories || (post.data.category ? [post.data.category] : []);
    const tags: string[] = post.data.tags || [];

    return {
      params: { slug: `blog/${year}/${month}/${post.id}` },
      props: {
        title: post.data.title,
        description: post.data.description,
        category:
          categories[0] ||
          deliverablesData.pillars[0]?.category ||
          profileData.title,
        tags: tags.slice(0, 3),
        image:
          post.data.heroImage ||
          (post.body
            ? post.body.match(/!\[.*?\]\(([^)\s]+)\)/)?.[1] ||
              post.body.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]
            : undefined),
        date: pubDate.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      },
    };
  });

  const staticPages = (
    Object.keys(pageSeoData) as Array<keyof typeof pageSeoData>
  ).map((slug) => {
    const page = pageSeoData[slug] as PageSeoItem;
    const fallbackCategory =
      slug === "home"
        ? deliverablesData.pillars[0]?.category || profileData.title
        : slug === "cv"
          ? "Curriculum Vitae"
          : slug === "blog"
            ? "Technical Blog"
            : "Professional Advisory";

    return {
      slug,
      title: page.title,
      description: page.description,
      category: page.category || fallbackCategory,
      tags: page.tags || [],
      image: page.image || (slug !== "blog" ? profileData.avatar : undefined),
    };
  });

  const pagePaths = staticPages.map((page) => ({
    params: { slug: page.slug },
    props: {
      title: page.title,
      description: page.description,
      category: page.category,
      tags: page.tags,
      image: page.image,
      date: profileData.name,
    },
  }));

  return [...postPaths, ...pagePaths];
};

export const GET: APIRoute = async ({ props }) => {
  const {
    title,
    description = "",
    category = deliverablesData.pillars[0]?.category || profileData.title,
    tags = [],
    image,
  } = props as {
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
    image?: string;
    date?: string;
  };

  const publicDir = path.resolve(process.cwd(), "public");
  let base64Image = "";
  let hasImage = false;

  if (image) {
    const cleanPath = image.replace(/^\//, "");
    const fullPath = path.resolve(publicDir, cleanPath);
    if (fullPath.startsWith(publicDir) && fs.existsSync(fullPath)) {
      try {
        const fileBuffer = fs.readFileSync(fullPath);
        const ext = path.extname(fullPath).toLowerCase().replace(".", "");
        const mime =
          ext === "svg"
            ? "image/svg+xml"
            : ext === "webp"
              ? "image/webp"
              : ext === "jpg" || ext === "jpeg"
                ? "image/jpeg"
                : "image/png";
        base64Image = `data:${mime};base64,${fileBuffer.toString("base64")}`;
        hasImage = true;
      } catch {
        hasImage = false;
      }
    }
  }

  const maxTitleChars = hasImage ? 23 : 32;
  const maxDescChars = hasImage ? 42 : 58;

  const titleLines = wrapText(title, maxTitleChars).slice(0, 3);
  const descLines = wrapText(description, maxDescChars).slice(0, 2);

  const titleTspans = titleLines
    .map(
      (line, i) =>
        `<tspan x="90" dy="${i === 0 ? 0 : 56}">${escapeXml(line)}</tspan>`,
    )
    .join("");

  const descTspans = descLines
    .map(
      (line, i) =>
        `<tspan x="90" dy="${i === 0 ? 0 : 32}">${escapeXml(line)}</tspan>`,
    )
    .join("");

  const tagsFormatted = tags.map((t) => `#${escapeXml(t)}`).join("   ");
  const badgeWidth = Math.max(140, category.length * 10 + 36);
  const siteDomain = profileData.website
    ? new URL(profileData.website).hostname
    : "";
  const authorityCredentials =
    profileData.headline ||
    [...(profileData.awards || []), profileData.title].join(" · ");

  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0e0f14" />
      <stop offset="50%" stop-color="#12131a" />
      <stop offset="100%" stop-color="#181724" />
    </linearGradient>
    <radialGradient id="topGlow" cx="85%" cy="15%" r="65%">
      <stop offset="0%" stop-color="#a476ff" stop-opacity="0.25" />
      <stop offset="50%" stop-color="#7c3aed" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#7c3aed" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="bottomGlow" cx="15%" cy="85%" r="55%">
      <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#22d3ee" stop-opacity="0" />
    </radialGradient>
    <clipPath id="avatarClip">
      <rect x="800" y="150" width="240" height="240" rx="36" />
    </clipPath>
    <linearGradient id="avatarBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a476ff" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#22d3ee" stop-opacity="0.4" />
    </linearGradient>
  </defs>

  <!-- Base Background -->
  <rect width="1200" height="630" fill="url(#cardBg)" />
  <rect width="1200" height="630" fill="url(#topGlow)" />
  <rect width="1200" height="630" fill="url(#bottomGlow)" />

  <!-- Outer Border Frame -->
  <rect x="36" y="36" width="1128" height="558" rx="28" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="2" />

  <!-- Top Header Bar -->
  <g transform="translate(90, 80)">
    <!-- Pill: Category / Pillar -->
    <rect x="0" y="0" width="${badgeWidth}" height="36" rx="18" fill="#a476ff" fill-opacity="0.15" stroke="#a476ff" stroke-opacity="0.4" stroke-width="1.5" />
    <text x="${badgeWidth / 2}" y="23" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#c4b5fd" letter-spacing="0.8">
      ${escapeXml(category.toUpperCase())}
    </text>

    <!-- Author Badge (Right-aligned) -->
    <text x="1020" y="24" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="500" fill="#a1a1aa">
      ${escapeXml(profileData.name)} · ${escapeXml(profileData.title)}
    </text>
  </g>

  <!-- Main Article / Page Title -->
  <text x="90" y="200" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="700" fill="#ffffff" letter-spacing="-0.8">
    ${titleTspans}
  </text>

  <!-- Description / Subtitle -->
  ${
    descLines.length > 0
      ? `<text x="90" y="${200 + titleLines.length * 56 + 18}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="400" fill="#9ca3af" letter-spacing="-0.2">
    ${descTspans}
  </text>`
      : ""
  }

  ${
    hasImage
      ? `
  <!-- Side Image Container (Squircle framed with gradient border) -->
  <g>
    <rect x="796" y="146" width="248" height="248" rx="40" fill="none" stroke="url(#avatarBorder)" stroke-width="2.5" />
    <image href="${base64Image}" x="800" y="150" width="240" height="240" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarClip)" />
  </g>`
      : ""
  }

  <!-- Tags Row (above divider) -->
  ${
    tagsFormatted
      ? `<text x="90" y="495" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="500" fill="#818cf8">
    ${tagsFormatted}
  </text>`
      : ""
  }

  <!-- Bottom Authority Bar -->
  <g transform="translate(90, 525)">
    <!-- Thin divider -->
    <line x1="0" y1="0" x2="1020" y2="0" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1" />

    <!-- Authority credentials (dynamic from profileData.headline) -->
    <text x="0" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#a476ff">
      ${escapeXml(authorityCredentials)}
    </text>

    <!-- Site domain (Right-aligned from profileData.website) -->
    <text x="1020" y="32" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="500" fill="#71717a">
      ${escapeXml(siteDomain)}
    </text>
  </g>
</svg>`;

  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(pngBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
