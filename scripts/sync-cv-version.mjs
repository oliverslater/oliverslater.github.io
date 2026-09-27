#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "..");
const cvDir = resolve(rootDir, "src/content/cv");
const profilePath = resolve(cvDir, "profile.json");
const cvVersionPath = resolve(cvDir, "cv-version.json");

if (!existsSync(profilePath)) {
  console.error(`✗ Missing required profile data file at: ${profilePath}`);
  process.exit(1);
}

let profileData;
try {
  profileData = JSON.parse(readFileSync(profilePath, "utf8"));
} catch (err) {
  console.error(
    `✗ Failed to parse profile data from ${profilePath}:`,
    err.message,
  );
  process.exit(1);
}

if (!profileData.name || typeof profileData.name !== "string") {
  console.error(
    "✗ Missing or invalid 'name' field in src/content/cv/profile.json",
  );
  process.exit(1);
}

const safeName = profileData.name.trim().replace(/\s+/g, "_");

// 1. Read existing CV version metadata if available
let existingVersion = null;
if (existsSync(cvVersionPath)) {
  try {
    existingVersion = JSON.parse(readFileSync(cvVersionPath, "utf8"));
  } catch {}
}

// 2. Compute content hash across CV content, template files, and credential cache
const hash = crypto.createHash("sha256");
const cvFiles = readdirSync(cvDir)
  .filter((f) => f.endsWith(".json") && f !== "cv-version.json")
  .sort();

for (const f of cvFiles) {
  hash.update(readFileSync(join(cvDir, f)));
}

const extraFiles = [
  "src/pages/cv.astro",
  "src/components/CVSection.astro",
  "src/content/technologies.json",
  "src/styles/global.css",
];

for (const rel of extraFiles) {
  const p = resolve(rootDir, rel);
  if (existsSync(p)) hash.update(readFileSync(p));
}

// Check local credentials cache (populated by src/utils/credly.ts and mslearn.ts)
let newestCredentialDate = "";
const credentialsCacheDir = resolve(rootDir, "node_modules/.cache/credentials");
if (existsSync(credentialsCacheDir)) {
  try {
    const cacheFiles = readdirSync(credentialsCacheDir)
      .filter((f) => f.endsWith(".json"))
      .sort();
    for (const file of cacheFiles) {
      const filePath = join(credentialsCacheDir, file);
      const content = readFileSync(filePath, "utf8");
      hash.update(content);
      const items = JSON.parse(content);
      if (Array.isArray(items)) {
        for (const item of items) {
          const rawDate = item.rawDate ? String(item.rawDate).slice(0, 10) : "";
          if (rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
            if (rawDate > newestCredentialDate) {
              newestCredentialDate = rawDate;
            }
          }
        }
      }
    }
  } catch {}
}

const contentHash = hash.digest("hex").slice(0, 16);
const today = new Date().toISOString().split("T")[0];

// 3. Determine version date
let versionDate = today;

if (existingVersion && existingVersion.contentHash) {
  if (
    existingVersion.contentHash === contentHash &&
    existingVersion.versionDate
  ) {
    // Content is completely unchanged; retain established version date
    versionDate = existingVersion.versionDate;
  } else {
    // Content or credential data (including expiry/renewal) has changed today!
    versionDate = today;
  }
} else {
  // Initial run without existing metadata: check Git history
  try {
    const uncommitted = execSync(
      'git status --porcelain -- src/content/cv src/pages/cv.astro ":(exclude)src/content/cv/cv-version.json"',
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();

    if (!uncommitted) {
      const gitDate = execSync(
        'git log -1 --format=%cs -- src/content/cv src/pages/cv.astro ":(exclude)src/content/cv/cv-version.json"',
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
      ).trim();
      if (gitDate && /^\d{4}-\d{2}-\d{2}$/.test(gitDate)) {
        versionDate = gitDate;
      }
    }
  } catch {}
}

if (newestCredentialDate && newestCredentialDate > versionDate) {
  versionDate = newestCredentialDate;
}

const filename = `${safeName}_CV_${versionDate}.pdf`;

const versionData = {
  versionDate,
  contentHash,
  filename,
  updatedAt: new Date().toISOString(),
};

// Only write if changed to avoid unnecessary mtime churn
let shouldWrite = true;
if (
  existingVersion &&
  existingVersion.contentHash === contentHash &&
  existingVersion.filename === filename
) {
  shouldWrite = false;
}

if (shouldWrite) {
  writeFileSync(cvVersionPath, JSON.stringify(versionData, null, 2) + "\n");
  console.log(`✓ Synchronized CV version: ${filename} (hash: ${contentHash})`);
}
