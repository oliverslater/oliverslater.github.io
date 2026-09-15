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

let profileData = { name: "Oliver Slater" };
if (existsSync(profilePath)) {
  try {
    profileData = JSON.parse(readFileSync(profilePath, "utf8"));
  } catch {}
}

const safeName = (profileData.name || "CV").replace(/\s+/g, "_");

// 1. Determine version date
let versionDate = new Date().toISOString().split("T")[0];
try {
  const uncommitted = execSync(
    "git status --porcelain -- src/content/cv src/pages/cv.astro",
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    },
  ).trim();

  if (!uncommitted) {
    const lastCommitDate = execSync(
      "git log -1 --format=%cs -- src/content/cv src/pages/cv.astro",
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    ).trim();
    if (lastCommitDate) versionDate = lastCommitDate;
  }
} catch {}

// 2. Compute content hash across CV content and print template files
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

const contentHash = hash.digest("hex").slice(0, 16);
const filename = `${safeName}_CV_${versionDate}.pdf`;

const versionData = {
  versionDate,
  contentHash,
  filename,
  updatedAt: new Date().toISOString(),
};

// Only write if changed to avoid unnecessary mtime churn
let shouldWrite = true;
if (existsSync(cvVersionPath)) {
  try {
    const existing = JSON.parse(readFileSync(cvVersionPath, "utf8"));
    if (
      existing.contentHash === contentHash &&
      existing.filename === filename
    ) {
      shouldWrite = false;
    }
  } catch {}
}

if (shouldWrite) {
  writeFileSync(cvVersionPath, JSON.stringify(versionData, null, 2) + "\n");
  console.log(`✓ Synchronized CV version: ${filename} (hash: ${contentHash})`);
}
