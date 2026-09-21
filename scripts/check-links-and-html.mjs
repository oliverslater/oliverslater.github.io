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

// SERP Character pixel width map for standard Arial 20px (Google SERP Desktop Title)
const CHAR_PIXEL_WIDTHS = {
  " ": 5.56,
  "!": 6.67,
  '"': 7.1,
  "#": 11.12,
  $: 11.12,
  "%": 17.8,
  "&": 13.34,
  "'": 3.88,
  "(": 6.67,
  ")": 6.67,
  "*": 7.78,
  "+": 11.68,
  ",": 5.56,
  "-": 6.67,
  ".": 5.56,
  "/": 5.56,
  0: 11.12,
  1: 11.12,
  2: 11.12,
  3: 11.12,
  4: 11.12,
  5: 11.12,
  6: 11.12,
  7: 11.12,
  8: 11.12,
  9: 11.12,
  ":": 5.56,
  ";": 5.56,
  "<": 11.68,
  "=": 11.68,
  ">": 11.68,
  "?": 11.12,
  "@": 20.32,
  A: 13.34,
  B: 13.34,
  C: 14.44,
  D: 14.44,
  E: 13.34,
  F: 12.22,
  G: 15.56,
  H: 14.44,
  I: 5.56,
  J: 10.0,
  K: 13.34,
  L: 11.12,
  M: 16.68,
  N: 14.44,
  O: 15.56,
  P: 13.34,
  Q: 15.56,
  R: 14.44,
  S: 13.34,
  T: 12.22,
  U: 14.44,
  V: 13.34,
  W: 18.9,
  X: 13.34,
  Y: 13.34,
  Z: 12.22,
  "[": 5.56,
  "\\": 5.56,
  "]": 5.56,
  "^": 9.42,
  _: 11.12,
  "`": 6.67,
  a: 11.12,
  b: 11.12,
  c: 10.0,
  d: 11.12,
  e: 11.12,
  f: 5.56,
  g: 11.12,
  h: 11.12,
  i: 4.44,
  j: 4.44,
  k: 10.0,
  l: 4.44,
  m: 16.68,
  n: 11.12,
  o: 11.12,
  p: 11.12,
  q: 11.12,
  r: 6.67,
  s: 10.0,
  t: 5.56,
  u: 11.12,
  v: 10.0,
  w: 14.44,
  x: 10.0,
  y: 10.0,
  z: 10.0,
  "{": 6.67,
  "|": 5.18,
  "}": 6.67,
  "~": 11.68,
  "–": 11.12,
  "—": 18.9,
  "·": 5.56,
};

function estimateTitlePixelWidth(str) {
  let w = 0;
  for (const ch of str) {
    w += CHAR_PIXEL_WIDTHS[ch] || 11.12;
  }
  return Math.round(w);
}

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

  // 2. SERP SEO Checks (for indexed public pages)
  const isNoIndex =
    /<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(
      content,
    );
  if (!isNoIndex) {
    const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      const cleanTitle = titleMatch[1]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      const titleWidth = estimateTitlePixelWidth(cleanTitle);
      if (titleWidth > 600) {
        console.error(
          `  ✗ [SERP SEO] <title> exceeds 600px desktop SERP limit (${titleWidth}px, ${cleanTitle.length} chars) in: ${relativePagePath}`,
        );
        errorCount++;
      }
    }

    const descMatch = content.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i,
    );
    if (descMatch) {
      const cleanDesc = descMatch[1]
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"');
      if (cleanDesc.length > 158) {
        console.error(
          `  ✗ [SERP SEO] <meta name="description"> exceeds 158 chars (${cleanDesc.length} chars) in: ${relativePagePath}`,
        );
        errorCount++;
      }
    }
  }

  // 3. Link & Asset Extraction
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
