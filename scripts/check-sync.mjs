import fs from "node:fs";
import path from "node:path";

console.log("Checking page, LLM, and sitemap synchronization...");

const cwd = process.cwd();
let hasErrors = false;

// 1. Check llms.txt & llms-full.txt
const llmsTxtPath = path.join(cwd, "llms.txt");
const llmsFullTxtPath = path.join(cwd, "public", "llms-full.txt");

if (!fs.existsSync(llmsTxtPath)) {
  console.error("❌ Missing llms.txt at repository root");
  hasErrors = true;
}

if (!fs.existsSync(llmsFullTxtPath)) {
  console.error(
    "❌ Missing public/llms-full.txt. Run 'npm run sitemap' to generate.",
  );
  hasErrors = true;
} else {
  const statLlms = fs.statSync(llmsFullTxtPath);
  if (statLlms.size < 100) {
    console.error("❌ public/llms-full.txt seems empty or truncated");
    hasErrors = true;
  }
}

// 2. Check sitemap.xml
const sitemapPath = path.join(cwd, "public", "sitemap.xml");
if (!fs.existsSync(sitemapPath)) {
  console.error(
    "❌ Missing public/sitemap.xml. Run 'npm run sitemap' to generate.",
  );
  hasErrors = true;
}

// 3. Check cv-version.json
const versionPath = path.join(cwd, "src", "content", "cv", "cv-version.json");
if (!fs.existsSync(versionPath)) {
  console.error("❌ Missing src/content/cv/cv-version.json");
  hasErrors = true;
} else {
  try {
    const versionData = JSON.parse(fs.readFileSync(versionPath, "utf8"));
    if (!versionData.versionDate || !versionData.updatedAt) {
      console.error(
        "❌ src/content/cv/cv-version.json missing required fields 'versionDate' or 'updatedAt'",
      );
      hasErrors = true;
    }
  } catch (err) {
    console.error(
      "❌ Failed to parse src/content/cv/cv-version.json:",
      err.message,
    );
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error("\n❌ Synchronization check failed.");
  process.exit(1);
} else {
  console.log("✓ Page, LLM context, and sitemap files are fully in sync.");
}
