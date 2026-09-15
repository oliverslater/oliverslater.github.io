import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const blogDir = resolve(rootDir, "src/content/blog");
const sitemapPath = resolve(rootDir, "public/sitemap.xml");
const profilePath = resolve(rootDir, "src/content/cv/profile.json");

// Static routes with changefreq & priority
const staticRoutes = [
  { path: "", changefreq: "weekly", priority: "1.0" },
  { path: "cv", changefreq: "weekly", priority: "0.9" },
  { path: "blog", changefreq: "weekly", priority: "0.8" },
  { path: "contact", changefreq: "monthly", priority: "0.6" },
];

async function getBlogSlugs() {
  try {
    const files = await readdir(blogDir);
    const slugs = [];
    for (const file of files) {
      if (file.endsWith(".md") || file.endsWith(".mdx")) {
        const content = await readFile(resolve(blogDir, file), "utf8");
        // Check for draft: true
        if (!/draft:\s*true/i.test(content)) {
          const slug = file.replace(/\.(md|mdx)$/, "");
          const dateMatch = content.match(/pubDate:\s*["']?([^\r\n"']+)["']?/i);
          if (dateMatch) {
            const pubDate = new Date(dateMatch[1].trim());
            if (!isNaN(pubDate.getTime()) && pubDate.getTime() <= Date.now()) {
              const year = String(pubDate.getFullYear());
              const month = String(pubDate.getMonth() + 1).padStart(2, "0");
              slugs.push(`${year}/${month}/${slug}`);
            }
          }
        }
      }
    }
    return slugs;
  } catch {
    return [];
  }
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

  const blogSlugs = await getBlogSlugs();

  const urls = [
    ...staticRoutes.map(
      (r) => `  <url>
    <loc>${siteUrl}/${r.path}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
    ),
    ...blogSlugs.map(
      (path) => `  <url>
    <loc>${siteUrl}/blog/${path}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`,
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

  await writeFile(sitemapPath, xml, "utf8");
  console.log(
    `Generated sitemap with ${urls.length} URLs at public/sitemap.xml`,
  );

  const robotsPath = resolve(rootDir, "public/robots.txt");
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;
  await writeFile(robotsPath, robotsTxt, "utf8");
  console.log(`Updated public/robots.txt with sitemap directive`);
}

generateSitemap().catch((err) => {
  console.error("Error generating sitemap:", err);
  process.exit(1);
});
