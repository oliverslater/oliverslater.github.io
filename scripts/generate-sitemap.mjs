import { readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const blogDir = resolve(rootDir, "src/content/blog");
const sitemapPath = resolve(rootDir, "public/sitemap.xml");
const profilePath = resolve(rootDir, "src/content/cv/profile.json");
const cvVersionPath = resolve(rootDir, "src/content/cv/cv-version.json");

function getGitLastMod(pathPattern, fallbackDate) {
  try {
    const gitDate = execSync(`git log -1 --format=%cs -- ${pathPattern}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (gitDate && /^\d{4}-\d{2}-\d{2}$/.test(gitDate)) {
      return gitDate;
    }
  } catch {}
  return fallbackDate;
}

async function getPublishedBlogPosts() {
  if (!existsSync(blogDir)) return [];
  const files = await readdir(blogDir);
  const posts = [];
  for (const file of files) {
    if (file.endsWith(".md") || file.endsWith(".mdx")) {
      const content = await readFile(resolve(blogDir, file), "utf8");
      // Check for draft: true
      if (!/draft:\s*true/i.test(content)) {
        const slug = file.replace(/\.(md|mdx)$/, "");
        const pubMatch = content.match(/pubDate:\s*["']?([^\r\n"']+)["']?/i);
        if (pubMatch) {
          const pubDate = new Date(pubMatch[1].trim());
          if (!isNaN(pubDate.getTime()) && pubDate.getTime() <= Date.now()) {
            const year = String(pubDate.getFullYear());
            const month = String(pubDate.getMonth() + 1).padStart(2, "0");
            const path = `${year}/${month}/${slug}/`;

            // Determine lastmod: latter of pubDate and lastUpdated/updatedDate
            let lastmod = pubDate.toISOString().split("T")[0];
            const updatedMatch = content.match(
              /(?:lastUpdated|updatedDate):\s*["']?([^\r\n"']+)["']?/i,
            );
            if (updatedMatch) {
              const updatedDate = new Date(updatedMatch[1].trim());
              if (!isNaN(updatedDate.getTime())) {
                if (updatedDate.getTime() < pubDate.getTime()) {
                  console.error(
                    `✗ In blog post '${file}': last updated date (${updatedMatch[1].trim()}) cannot be earlier than publication date (${pubMatch[1].trim()})`,
                  );
                  process.exit(1);
                }
                const updatedDateStr = updatedDate.toISOString().split("T")[0];
                if (updatedDateStr > lastmod) {
                  lastmod = updatedDateStr;
                }
              }
            }

            // Extract title, description, and heroImage for sitemaps and llms-full.txt
            const titleMatch = content.match(
              /^title:\s*["']?([^\r\n"']+)["']?/m,
            );
            const descMatch = content.match(
              /^description:\s*["']?([^\r\n"']+)["']?/m,
            );
            const heroMatch = content.match(
              /^heroImage:\s*["']?([^\r\n"']+)["']?/m,
            );

            const title = titleMatch ? titleMatch[1].trim() : slug;
            const description = descMatch ? descMatch[1].trim() : "";
            let heroImage = heroMatch ? heroMatch[1].trim() : "";

            // If heroImage is set to 'none', suppress images; otherwise look for inline diagram if missing
            if (
              heroImage &&
              ["none", "null", "false", "no"].includes(heroImage.toLowerCase())
            ) {
              heroImage = "";
            } else if (!heroImage) {
              const body = content.replace(/^---[\s\S]*?---/, "");
              const mdImgMatch = body.match(/!\[.*?\]\(([^)\s]+)\)/);
              const htmlImgMatch = body.match(/<img[^>]+src=["']([^"']+)["']/i);
              if (mdImgMatch) {
                heroImage = mdImgMatch[1].trim();
              } else if (htmlImgMatch) {
                heroImage = htmlImgMatch[1].trim();
              }
            }

            posts.push({ path, lastmod, title, description, heroImage });
          }
        }
      }
    }
  }
  return posts;
}

async function generateSitemap() {
  const profileRaw = await readFile(profilePath, "utf8");
  const profile = JSON.parse(profileRaw);
  if (!profile.website || typeof profile.website !== "string") {
    throw new Error(
      "Missing or invalid 'website' field in src/content/cv/profile.json",
    );
  }
  const siteUrl = profile.website.trim().replace(/\/+$/, "");
  const today = new Date().toISOString().split("T")[0];

  // Read CV version metadata if available
  let cvLastMod = null;
  if (existsSync(cvVersionPath)) {
    try {
      const cvVersion = JSON.parse(readFileSync(cvVersionPath, "utf8"));
      if (cvVersion.versionDate) cvLastMod = cvVersion.versionDate;
    } catch {}
  }
  if (!cvLastMod) {
    cvLastMod = getGitLastMod("src/content/cv src/pages/cv.astro", today);
  }

  const blogPosts = await getPublishedBlogPosts();

  // Derive latest blog update for /blog/ landing page
  let blogIndexLastMod = today;
  if (blogPosts.length > 0) {
    const dates = blogPosts.map((p) => p.lastmod).sort();
    blogIndexLastMod = dates[dates.length - 1];
  } else {
    blogIndexLastMod = getGitLastMod("src/pages/blog src/content/blog", today);
  }

  const staticRoutes = [
    {
      path: "",
      changefreq: "weekly",
      priority: "1.0",
      lastmod: getGitLastMod("src/pages/index.astro src/content", today),
    },
    {
      path: "cv/",
      changefreq: "weekly",
      priority: "0.9",
      lastmod: cvLastMod,
    },
    {
      path: "blog/",
      changefreq: "weekly",
      priority: "0.8",
      lastmod: blogIndexLastMod,
    },
    {
      path: "contact/",
      changefreq: "monthly",
      priority: "0.6",
      lastmod: getGitLastMod("src/pages/contact.astro", today),
    },
  ];

  function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, (c) => {
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

  const urls = [
    ...staticRoutes.map(
      (r) => `  <url>
    <loc>${siteUrl}/${r.path}</loc>
    <lastmod>${r.lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>${
      r.path === ""
        ? `\n    <image:image>\n      <image:loc>${siteUrl}/assets/oliver-slater-512.png</image:loc>\n      <image:title>${escapeXml(profile.name)} - ${escapeXml(profile.title)}</image:title>\n    </image:image>`
        : ""
    }
  </url>`,
    ),
    ...blogPosts.map((post) => {
      let imageXml = "";
      if (post.heroImage) {
        const imgUrl = post.heroImage.startsWith("http")
          ? post.heroImage
          : `${siteUrl}${post.heroImage.startsWith("/") ? "" : "/"}${post.heroImage}`;
        imageXml = `\n    <image:image>\n      <image:loc>${imgUrl}</image:loc>\n      <image:title>${escapeXml(post.title)}</image:title>\n    </image:image>`;
      }
      return `  <url>
    <loc>${siteUrl}/blog/${post.path}</loc>
    <lastmod>${post.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>${imageXml}
  </url>`;
    }),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>
`;

  await writeFile(sitemapPath, xml, "utf8");
  console.log(
    `Generated sitemap with ${urls.length} URLs (including image extensions) at public/sitemap.xml`,
  );

  const robotsPath = resolve(rootDir, "public/robots.txt");
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml

# LLM & AI Context Feeds (https://llmstxt.org/)
# Markdown Context: ${siteUrl}/llms.txt
# Full Plain-Text Context: ${siteUrl}/llms-full.txt
`;
  await writeFile(robotsPath, robotsTxt, "utf8");
  console.log(`Updated public/robots.txt with sitemap directive`);

  // Dynamically generate public/llms-full.txt from JSON content sources
  await generateLlmsFullTxt(siteUrl, profile, blogPosts);

  // Synchronize public/site.webmanifest dynamically from profile data
  const manifestPath = resolve(rootDir, "public/site.webmanifest");
  const manifest = {
    name: `${profile.name} | ${profile.title}`,
    short_name: profile.name,
    description: profile.metaDescription || profile.bio,
    start_url: "/",
    display: "standalone",
    background_color: "#101010",
    theme_color: "#a476ff",
    icons: [
      {
        src: "/favicon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/favicon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
  await writeFile(
    manifestPath,
    JSON.stringify(manifest, null, 2) + "\n",
    "utf8",
  );
  console.log(`Synchronized public/site.webmanifest with profile data`);

  // Synchronize public/humans.txt dynamically from profile data
  const humansPath = resolve(rootDir, "public/humans.txt");
  const extraAwards = (profile.awards || []).filter(
    (a) => !profile.headline?.toLowerCase().includes(a.toLowerCase()),
  );
  const distinctions = [profile.headline, ...extraAwards]
    .filter(Boolean)
    .join(", ");
  const humansTxt = `/* TEAM */
  Architect & Author: ${profile.name}
  Title: ${profile.title}
  Distinctions: ${distinctions}
  Contact: ${siteUrl}/contact
  GitHub: ${profile.github}
  LinkedIn: ${profile.linkedin}
  Location: ${profile.location}

/* SITE */
  Standards: HTML5, CSS3, ES2024, WebP
  Components: React 19 Islands
  Software: Astro 7 Static Site Generation (SSG)
  Styling: Tailwind CSS
  Typography: Montserrat Variable
  Hosting: GitHub Pages
  CI/CD: GitHub Actions
  Language: English
`;
  await writeFile(humansPath, humansTxt, "utf8");
  console.log(`Synchronized public/humans.txt with profile data`);
}

async function generateLlmsFullTxt(siteUrl, profile, blogPosts) {
  const experienceRaw = await readFile(
    resolve(rootDir, "src/content/cv/experience.json"),
    "utf8",
  );
  const educationRaw = await readFile(
    resolve(rootDir, "src/content/cv/education.json"),
    "utf8",
  );
  const deliverablesRaw = await readFile(
    resolve(rootDir, "src/content/cv/deliverables.json"),
    "utf8",
  );
  const skillsRaw = await readFile(
    resolve(rootDir, "src/content/cv/skills.json"),
    "utf8",
  );
  const certSettingsRaw = await readFile(
    resolve(rootDir, "src/content/cv/certification-settings.json"),
    "utf8",
  );

  const experience = JSON.parse(experienceRaw);
  const education = JSON.parse(educationRaw);
  const deliverables = JSON.parse(deliverablesRaw);
  const skills = JSON.parse(skillsRaw);
  const certSettings = JSON.parse(certSettingsRaw);

  const hiddenOverrides = new Set(
    (certSettings.overrides || [])
      .filter((o) => o.displayed === false)
      .map((o) => (o.title || "").toLowerCase().trim()),
  );

  const activeQualifications = (education.qualifications || []).filter((q) => {
    const titleLower = q.title.toLowerCase().trim();
    for (const hidden of hiddenOverrides) {
      if (titleLower.includes(hidden)) return false;
    }
    return true;
  });

  const lines = [
    `# ${profile.name} | ${profile.title} & Enterprise Technologist (Full Context)`,
    "",
    `> Senior Cloud Architect, AWS Golden Jacket holder (11x AWS Certified), Azure Solutions Architect Expert, and HashiCorp Certified Terraform Professional specializing in large-scale cloud migrations, serverless platforms, infrastructure as code, and DevSecOps.`,
    "",
    `This document serves as the comprehensive, uncompressed LLM context feed for Oliver Slater's professional profile, verified credentials, complete career history, architectural deliverables, and published technical articles.`,
    "",
    `## Contact & Authoritative Profiles`,
    "",
    `- **Website**: [${siteUrl}](${siteUrl})`,
    `- **LinkedIn**: [${profile.linkedin}](${profile.linkedin})`,
    `- **GitHub**: [${profile.github}](${profile.github})`,
    `- **Credly Badges**: [${profile.credly}](${profile.credly})`,
    `- **Microsoft Learn Transcript**: [${profile.mslearn}](${profile.mslearn})`,
    `- **Location**: ${profile.location}`,
    "",
    "---",
    "",
    "## Executive Professional Summary",
    "",
    profile.bio,
    "",
    "### Core Competencies",
    "",
    ...(profile.coreCompetencies || []).map((c) => `- ${c}`),
    "",
    "---",
    "",
    "## Verified Qualifications & Credentials",
    "",
    ...activeQualifications.map(
      (q) =>
        `- **${q.title}** (${q.issuer}) — Level: ${q.level || "Professional"} | Validity: ${q.validity || "Active"}`,
    ),
    "",
    "---",
    "",
    "## Architecture Capability Pillars & Deliverables",
    "",
    ...(deliverables.pillars || []).flatMap((p) => [
      `### ${p.category}`,
      "",
      ...(p.items || []).map((i) => `- ${i}`),
      "",
    ]),
    "---",
    "",
    "## Technical Capabilities & Tooling Matrix",
    "",
    ...(skills.categories || []).flatMap((c) => [
      `### ${c.category}`,
      "",
      c.skills.join(" · "),
      "",
    ]),
    "---",
    "",
    "## Complete Professional Career History",
    "",
    ...(experience.roles || []).flatMap((r) => [
      `### ${r.role} — ${r.company}`,
      `**Duration:** ${r.startDate} – ${r.endDate} (${r.location})`,
      "",
      r.description,
      "",
      "**Key Achievements & Impact:**",
      ...(r.highlights || []).map((h) => `- ${h}`),
      "",
      `**Technologies:** ${r.technologies.join(", ")}`,
      "",
      "---",
      "",
    ]),
    "## Technical Articles & Architecture Publications",
    "",
    ...blogPosts.map(
      (p) =>
        `### [${p.title}](${siteUrl}/blog/${p.path})\n**Published:** ${p.lastmod}\n\n${p.description || ""}\n`,
    ),
  ];

  const content = lines.join("\n");
  const fullPath = resolve(rootDir, "public/llms-full.txt");
  await writeFile(fullPath, content, "utf8");
  console.log(`Generated public/llms-full.txt with full context`);
}

generateSitemap().catch((err) => {
  console.error("Error generating sitemap:", err);
  process.exit(1);
});
