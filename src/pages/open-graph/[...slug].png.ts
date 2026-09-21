import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import sharp from "sharp";
import profileData from "../../content/cv/profile.json";
import pageSeoData from "../../content/page-seo.json";
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
        category: categories[0] || "Architecture Note",
        tags: tags.slice(0, 3),
        date: pubDate.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      },
    };
  });

  const staticPages = [
    {
      slug: "home",
      title: pageSeoData.home.title,
      description: pageSeoData.home.description,
      category: "Enterprise Cloud Architect",
      tags: ["AWS Golden Jacket", "Azure Architect", "Terraform Pro"],
    },
    {
      slug: "cv",
      title: pageSeoData.cv.title,
      description: pageSeoData.cv.description,
      category: "Curriculum Vitae",
      tags: ["11x AWS Certified", "Azure Expert", "Terraform Pro"],
    },
    {
      slug: "blog",
      title: pageSeoData.blog.title,
      description: pageSeoData.blog.description,
      category: "Technical Blog",
      tags: ["Cloud Architecture", "Serverless", "DevOps"],
    },
    {
      slug: "contact",
      title: pageSeoData.contact.title,
      description: pageSeoData.contact.description,
      category: "Professional Advisory",
      tags: ["Consulting", "Architecture Reviews", "Cloud Strategy"],
    },
  ];

  const pagePaths = staticPages.map((page) => ({
    params: { slug: page.slug },
    props: {
      title: page.title,
      description: page.description,
      category: page.category,
      tags: page.tags,
      date: "Oliver Slater",
    },
  }));

  return [...postPaths, ...pagePaths];
};

export const GET: APIRoute = async ({ props }) => {
  const {
    title,
    description = "",
    category = "Cloud Architecture",
    tags = [],
  } = props as {
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
    date?: string;
  };

  const titleLines = wrapText(title, 32).slice(0, 3);
  const descLines = wrapText(description, 58).slice(0, 2);

  const titleTspans = titleLines
    .map(
      (line, i) =>
        `<tspan x="90" dy="${i === 0 ? 0 : 58}">${escapeXml(line)}</tspan>`,
    )
    .join("");

  const descTspans = descLines
    .map(
      (line, i) =>
        `<tspan x="90" dy="${i === 0 ? 0 : 34}">${escapeXml(line)}</tspan>`,
    )
    .join("");

  const tagsFormatted = tags.map((t) => `#${escapeXml(t)}`).join("   ");
  const badgeWidth = Math.max(140, category.length * 10 + 36);

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
  <text x="90" y="210" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="46" font-weight="700" fill="#ffffff" letter-spacing="-0.8">
    ${titleTspans}
  </text>

  <!-- Description / Subtitle -->
  ${
    descLines.length > 0
      ? `<text x="90" y="${210 + titleLines.length * 58 + 22}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="400" fill="#9ca3af" letter-spacing="-0.2">
    ${descTspans}
  </text>`
      : ""
  }

  <!-- Bottom Authority Bar -->
  <g transform="translate(90, 525)">
    <!-- Thin divider -->
    <line x1="0" y1="0" x2="1020" y2="0" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1" />

    <!-- Authority credentials -->
    <text x="0" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#a476ff">
      AWS Golden Jacket · Azure Solutions Architect Expert · Terraform Pro
    </text>

    <!-- Site domain & tags (Right-aligned) -->
    <text x="1020" y="32" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="500" fill="#71717a">
      ${tagsFormatted ? `${tagsFormatted}   ·   ` : ""}www.oliver-slater.co.uk
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
