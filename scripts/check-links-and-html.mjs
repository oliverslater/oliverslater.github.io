import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const distDir = path.resolve(rootDir, "dist");

if (!fs.existsSync(distDir)) {
  console.error(
    "Error: dist/ directory does not exist. Run 'npm run build' first.",
  );
  process.exit(1);
}

function getHtmlFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getHtmlFiles(fullPath, fileList);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const htmlFiles = getHtmlFiles(distDir);
console.log(
  `Auditing semantic HTML and links across ${htmlFiles.length} generated pages in dist/...`,
);

let errorCount = 0;
let linkCount = 0;

for (const filePath of htmlFiles) {
  const relativePagePath = path.relative(distDir, filePath);
  const content = fs.readFileSync(filePath, "utf8");

  // 1. Semantic HTML Structure Check
  if (!/<!doctype\s+html/i.test(content)) {
    console.error(
      `  ✗ [Semantic HTML] Missing <!DOCTYPE html> in: ${relativePagePath}`,
    );
    errorCount++;
  }
  if (!/<html[^>]*lang=["'][^"']+["']/i.test(content)) {
    console.error(
      `  ✗ [Semantic HTML] Missing <html lang="..."> in: ${relativePagePath}`,
    );
    errorCount++;
  }
  if (!/<title>[^<]+<\/title>/i.test(content)) {
    console.error(
      `  ✗ [Semantic HTML] Missing or empty <title> in: ${relativePagePath}`,
    );
    errorCount++;
  }
  if (!/<meta[^>]*name=["']viewport["']/i.test(content)) {
    console.error(
      `  ✗ [Semantic HTML] Missing viewport meta in: ${relativePagePath}`,
    );
    errorCount++;
  }

  // 2. Link & Asset Extraction
  // Match href="..." and src="..."
  const hrefMatches = content.matchAll(/href=["']([^"']+)["']/g);
  const srcMatches = content.matchAll(/src=["']([^"']+)["']/g);

  const checkTargets = [];
  for (const m of hrefMatches) checkTargets.push({ attr: "href", url: m[1] });
  for (const m of srcMatches) checkTargets.push({ attr: "src", url: m[1] });

  for (const { attr, url } of checkTargets) {
    linkCount++;

    // Ignore external URLs, protocols, empty anchors, or mailto/tel
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("//") ||
      url.startsWith("mailto:") ||
      url.startsWith("tel:") ||
      url.startsWith("javascript:") ||
      url.startsWith("data:") ||
      url === "#"
    ) {
      continue;
    }

    // Handle pure in-page hash anchors: #top or #heading-id
    if (url.startsWith("#")) {
      const anchorId = url.slice(1);
      if (anchorId !== "top" && anchorId !== "main-content") {
        const idRegex = new RegExp(`id=["']${anchorId}["']`, "i");
        if (!idRegex.test(content)) {
          // Warning rather than breaking error for dynamic client anchors
          console.warn(
            `  ⚠ [In-Page Anchor] Anchor #${anchorId} not found statically in ${relativePagePath}`,
          );
        }
      }
      continue;
    }

    // Separate pathname from search query and hash
    const cleanUrl = url.split("?")[0].split("#")[0];
    if (!cleanUrl) continue;

    let targetFilePath;
    if (cleanUrl.startsWith("/")) {
      // Root-relative URL
      const subPath = cleanUrl.slice(1);
      targetFilePath = path.join(distDir, subPath);
    } else {
      // Relative to current HTML file directory
      targetFilePath = path.resolve(path.dirname(filePath), cleanUrl);
    }

    // Check if target file exists, or if target is a directory with index.html, or if .html exists
    let exists = false;
    if (fs.existsSync(targetFilePath)) {
      const stat = fs.statSync(targetFilePath);
      if (stat.isDirectory()) {
        exists = fs.existsSync(path.join(targetFilePath, "index.html"));
      } else {
        exists = true;
      }
    } else if (fs.existsSync(`${targetFilePath}.html`)) {
      exists = true;
    } else if (
      cleanUrl.endsWith("/") &&
      fs.existsSync(path.join(targetFilePath, "index.html"))
    ) {
      exists = true;
    }

    if (!exists) {
      console.error(
        `  ✗ [Broken Link] ${attr}="${url}" in ${relativePagePath} does not resolve in dist/`,
      );
      errorCount++;
    }
  }
}

if (errorCount > 0) {
  console.error(
    `\nLink and HTML validation failed with ${errorCount} error(s) across ${linkCount} verified links/assets.`,
  );
  process.exit(1);
} else {
  console.log(
    `✓ All ${htmlFiles.length} HTML pages and ${linkCount} internal links/assets validated successfully.`,
  );
}
