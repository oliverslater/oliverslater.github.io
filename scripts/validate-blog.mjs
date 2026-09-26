import fs from "node:fs";
import path from "node:path";

const BLOG_DIR = path.join(process.cwd(), "src", "content", "blog");

console.log("Validating blog posts and publication frontmatter...");

if (!fs.existsSync(BLOG_DIR)) {
  console.log("No blog directory found at", BLOG_DIR);
  process.exit(0);
}

const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));

if (files.length === 0) {
  console.log("No blog posts found.");
  process.exit(0);
}

let hasErrors = false;

for (const file of files) {
  const filePath = path.join(BLOG_DIR, file);
  const content = fs.readFileSync(filePath, "utf8");

  const lines = content.split("\n");
  if (lines[0].trim() !== "---") {
    console.error(`❌ [${file}]: Missing leading frontmatter '---' delimiter`);
    hasErrors = true;
    continue;
  }

  const closingIdx = lines.indexOf("---", 1);
  if (closingIdx === -1) {
    console.error(`❌ [${file}]: Missing closing frontmatter '---' delimiter`);
    hasErrors = true;
    continue;
  }

  const frontmatterLines = lines.slice(1, closingIdx);
  const rawText = frontmatterLines.join("\n");

  // Check required key fields using simple pattern matching
  const titleMatch = rawText.match(/title:\s*(.+)/i);
  const descMatch = rawText.match(/description:\s*(.+)/i);
  const pubDateMatch = rawText.match(/(pubDate|publishDate):\s*(.+)/i);
  const hasTags = /tags:/i.test(rawText);

  if (!titleMatch) {
    console.error(`❌ [${file}]: Missing required field 'title'`);
    hasErrors = true;
  }
  if (!descMatch) {
    console.error(`❌ [${file}]: Missing required field 'description'`);
    hasErrors = true;
  }
  if (!pubDateMatch) {
    console.error(
      `❌ [${file}]: Missing required field 'pubDate' (or 'publishDate')`,
    );
    hasErrors = true;
  } else {
    const dateStr = pubDateMatch[2].trim().replace(/^["']|["']$/g, "");
    if (isNaN(Date.parse(dateStr))) {
      console.error(`❌ [${file}]: Invalid date format '${dateStr}'`);
      hasErrors = true;
    }
  }
  if (!hasTags) {
    console.error(`❌ [${file}]: Missing required 'tags' section`);
    hasErrors = true;
  }

  // Description length check
  if (descMatch) {
    const desc = descMatch[1].trim().replace(/^["']|["']$/g, "");
    if (desc.length < 30) {
      console.warn(
        `⚠️ [${file}]: Description is too short (${desc.length} chars). Recommend 50-160 chars for SEO.`,
      );
    } else if (desc.length > 200) {
      console.warn(
        `⚠️ [${file}]: Description is quite long (${desc.length} chars). Google snippet may truncate.`,
      );
    }
  }

  // Hero image check
  const heroMatch = rawText.match(/heroImage:\s*(.+)/i);
  if (heroMatch) {
    const heroPath = heroMatch[1].trim().replace(/^["']|["']$/g, "");
    if (heroPath.startsWith("/")) {
      const fullPath = path.join(process.cwd(), "public", heroPath);
      if (!fs.existsSync(fullPath)) {
        console.error(
          `❌ [${file}]: heroImage '${heroPath}' not found in public/`,
        );
        hasErrors = true;
      }
    }
  }

  const titleVal = titleMatch
    ? titleMatch[1].trim().replace(/^["']|["']$/g, "")
    : file;
  console.log(`  ✓ ${file} (Title: "${titleVal}")`);
}

if (hasErrors) {
  console.error(
    "\n❌ Blog post validation failed. Fix errors above before publishing.",
  );
  process.exit(1);
} else {
  console.log("✓ All blog posts validated successfully.");
}
