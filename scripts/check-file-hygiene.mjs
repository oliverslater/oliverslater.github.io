import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB limit (allows high-res full master assets)

// Signatures to detect private keys (split strings so the script itself doesn't trigger detection)
const KEY_MARKERS = [
  "BEGIN " + "PRIVATE KEY",
  "BEGIN RSA " + "PRIVATE KEY",
  "BEGIN DSA " + "PRIVATE KEY",
  "BEGIN EC " + "PRIVATE KEY",
  "BEGIN OPENSSH " + "PRIVATE KEY",
  "BEGIN PGP " + "PRIVATE KEY BLOCK",
];

function getFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".git" ||
      entry.name === "dist"
    ) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getFiles(fullPath, fileList);
    } else if (entry.isFile()) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const files = getFiles(rootDir);
let hasError = false;

console.log(`Checking file hygiene across ${files.length} files...`);

for (const filePath of files) {
  const relativePath = path.relative(rootDir, filePath);

  // Skip the checker script itself
  if (relativePath === "scripts/check-file-hygiene.mjs") continue;

  const stat = fs.statSync(filePath);

  // 1. Check for oversized files (> 5MB)
  if (stat.size > MAX_FILE_SIZE_BYTES) {
    console.error(
      `  ✗ Large file detected (${(stat.size / 1024 / 1024).toFixed(2)} MB): ${relativePath}`,
    );
    console.error(
      `    Files above 5MB should not be committed to this repository.`,
    );
    hasError = true;
  }

  // 2. Check for private keys in text files (skip binary extensions)
  const ext = path.extname(filePath).toLowerCase();
  const binaryExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".ico",
    ".pdf",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
  ];

  if (!binaryExtensions.includes(ext) && stat.size < 500 * 1024) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      for (const marker of KEY_MARKERS) {
        if (content.includes(marker)) {
          console.error(
            `  ✗ Potential PRIVATE KEY detected in: ${relativePath}`,
          );
          hasError = true;
          break;
        }
      }
    } catch {
      // Skip binary read errors
    }
  }
}

if (hasError) {
  console.error(
    "\nFile hygiene check failed! Resolve issues before committing.",
  );
  process.exit(1);
} else {
  console.log(
    "✓ File hygiene check passed (no private keys, no oversized files).",
  );
}
