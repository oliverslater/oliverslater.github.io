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

            posts.push({ path, lastmod });
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

  const urls = [
    ...staticRoutes.map(
      (r) => `  <url>
    <loc>${siteUrl}/${r.path}</loc>
    <lastmod>${r.lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
    ),
    ...blogPosts.map(
      (post) => `  <url>
    <loc>${siteUrl}/blog/${post.path}</loc>
    <lastmod>${post.lastmod}</lastmod>
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
