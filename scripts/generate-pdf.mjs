#!/usr/bin/env node
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  readdirSync,
  unlinkSync,
  statSync,
} from "node:fs";
import { resolve, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import { spawn, execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "..");
const publicDir = resolve(rootDir, "public");
const distDir = resolve(rootDir, "dist");
const astroCacheDir = resolve(rootDir, ".astro");
const cvDir = resolve(rootDir, "src/content/cv");
const cvVersionPath = resolve(cvDir, "cv-version.json");
const profilePath = resolve(cvDir, "profile.json");
const pdfCachePath = resolve(astroCacheDir, "cv-pdf-cache.json");

// Read profile data dynamically
let profileData = {
  name: "Oliver Slater",
  website: "https://www.oliver-slater.co.uk",
};
if (existsSync(profilePath)) {
  try {
    profileData = JSON.parse(readFileSync(profilePath, "utf8"));
  } catch {}
}

const safeName = (profileData.name || "CV").replace(/\s+/g, "_");

// Read CV version metadata (synchronized during prebuild)
let cvVersion = {
  versionDate: new Date().toISOString().split("T")[0],
  contentHash: "",
  filename: `${safeName}_CV_${new Date().toISOString().split("T")[0]}.pdf`,
};

if (existsSync(cvVersionPath)) {
  try {
    cvVersion = JSON.parse(readFileSync(cvVersionPath, "utf8"));
  } catch {}
}

const versionedPdfFilename = cvVersion.filename;
const targetVersionedPdf = resolve(publicDir, versionedPdfFilename);

/**
 * Searches for a system-installed Chrome or Chromium binary across macOS, Linux, and Windows.
 */
function findSystemChrome() {
  if (process.env.CHROME_BIN && existsSync(process.env.CHROME_BIN)) {
    return process.env.CHROME_BIN;
  }
  if (
    process.env.PUPPETEER_EXECUTABLE_PATH &&
    existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)
  ) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  // macOS candidates
  const macCandidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  ];
  for (const candidate of macCandidates) {
    if (existsSync(candidate)) return candidate;
  }

  // Linux candidates
  const linuxCandidates = [
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/snap/bin/chromium",
  ];
  for (const candidate of linuxCandidates) {
    if (existsSync(candidate)) return candidate;
  }

  // PATH lookup on Unix
  try {
    const whichResult = execSync(
      "which google-chrome-stable || which google-chrome || which chromium-browser || which chromium",
      { stdio: ["ignore", "pipe", "ignore"], encoding: "utf8" },
    ).trim();
    if (whichResult && existsSync(whichResult)) return whichResult;
  } catch {}

  // Windows candidates
  const winCandidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  for (const candidate of winCandidates) {
    if (existsSync(candidate)) return candidate;
  }

  return null;
}

/**
 * Prunes outdated versioned PDFs or legacy files from target directory.
 */
function pruneOutdatedPdfs(dir) {
  if (!existsSync(dir)) return;
  try {
    const files = readdirSync(dir);
    for (const f of files) {
      if (
        f === `${safeName}_CV.pdf` ||
        (f.startsWith(`${safeName}_CV_`) &&
          f.endsWith(".pdf") &&
          f !== versionedPdfFilename)
      ) {
        unlinkSync(join(dir, f));
        console.log(`Cleaned up outdated CV PDF: ${pathRelative(dir, f)}`);
      }
    }
  } catch {}
}

function pathRelative(dir, file) {
  return `${join(dir === publicDir ? "public" : "dist", file)}`;
}

/**
 * Starts a minimal zero-dependency static file server for dist/
 * to allow Chrome to render the exact local build and print CSS.
 */
function startDistServer(dir) {
  const mimeMap = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".pdf": "application/pdf",
    ".json": "application/json",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
  };

  const server = http.createServer((req, res) => {
    let reqPath = (req.url || "/").split("?")[0].split("#")[0];
    if (reqPath.endsWith("/")) reqPath += "index.html";

    let filePath = join(dir, reqPath);
    if (existsSync(filePath) && statSync(filePath).isDirectory()) {
      filePath = join(filePath, "index.html");
    }

    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Not Found");
    }

    const ext = extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeMap[ext] || "application/octet-stream",
    });
    import("node:fs").then((fs) => {
      fs.createReadStream(filePath).pipe(res);
    });
  });

  return new Promise((resServer) => {
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      resServer({ server, port });
    });
  });
}

/**
 * Generates the executive CV PDF only if content has changed or target is missing.
 */
async function generateCvPdf() {
  if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

  // 1. Check if cache is valid (content hash matches and PDF exists with valid size)
  let isCacheValid = false;
  if (
    existsSync(targetVersionedPdf) &&
    statSync(targetVersionedPdf).size > 10000 &&
    existsSync(pdfCachePath)
  ) {
    try {
      const cached = JSON.parse(readFileSync(pdfCachePath, "utf8"));
      if (
        cached.contentHash &&
        cached.contentHash === cvVersion.contentHash &&
        cached.filename === versionedPdfFilename
      ) {
        isCacheValid = true;
      }
    } catch {}
  }

  // If cache is valid and regeneration is not forced, skip browser render
  if (isCacheValid && !process.env.FORCE_REGEN_PDF) {
    console.log(
      `✓ CV content unchanged (${cvVersion.contentHash || "cached"}). Reusing: public/${versionedPdfFilename}`,
    );

    pruneOutdatedPdfs(publicDir);

    if (existsSync(distDir)) {
      copyFileSync(targetVersionedPdf, resolve(distDir, versionedPdfFilename));
      pruneOutdatedPdfs(distDir);
    }
    return;
  }

  console.log(
    `Rendering updated CV PDF for version: ${versionedPdfFilename}...`,
  );

  const chromePath = findSystemChrome();
  const distCvHtml = resolve(distDir, "cv/index.html");
  const hasLocalDist = existsSync(distCvHtml);

  let serverInstance = null;
  let renderUrl = process.env.CV_RENDER_URL;

  if (!renderUrl && hasLocalDist) {
    const { server, port } = await startDistServer(distDir);
    serverInstance = server;
    renderUrl = `http://127.0.0.1:${port}/cv/`;
    console.log(`Serving local build for PDF generation at ${renderUrl}`);
  } else if (!renderUrl) {
    renderUrl = new URL(
      "/cv/",
      profileData.website || "http://127.0.0.1:4321",
    ).toString();
    console.log(`Using configured CV URL: ${renderUrl}`);
  }

  const tempPdfPath = resolve(publicDir, `.temp_${versionedPdfFilename}`);
  let generationSuccess = false;

  if (chromePath) {
    console.log(
      `Found browser at ${chromePath}. Generating PDF via print engine...`,
    );
    try {
      await new Promise((resSpawn, rejSpawn) => {
        const chrome = spawn(
          chromePath,
          [
            "--headless=new",
            "--no-sandbox",
            "--disable-gpu",
            "--no-pdf-header-footer",
            "--run-all-compositor-stages-before-draw",
            `--print-to-pdf=${tempPdfPath}`,
            renderUrl,
          ],
          { stdio: ["ignore", "pipe", "pipe"] },
        );

        let stderr = "";
        chrome.stderr.on("data", (d) => (stderr += d.toString()));

        chrome.on("close", (code) => {
          if (
            code === 0 &&
            existsSync(tempPdfPath) &&
            statSync(tempPdfPath).size > 10000
          ) {
            resSpawn();
          } else {
            rejSpawn(
              new Error(
                `Browser exited with code ${code}. Stderr: ${stderr.slice(0, 200)}`,
              ),
            );
          }
        });
      });
      generationSuccess = true;
    } catch (err) {
      console.warn("Headless browser generation error:", err.message);
    }
  }

  // Try Playwright or Puppeteer if system binary invocation was unsuccessful
  if (!generationSuccess) {
    try {
      let chromium;
      try {
        const pw = await import("playwright");
        chromium = pw.chromium;
      } catch {
        const pup = await import("puppeteer");
        chromium = pup.default || pup;
      }

      if (chromium) {
        console.log(
          "Rendering PDF via installed browser automation package...",
        );
        const browser = await chromium.launch();
        const page = await browser.newPage();
        await page.goto(renderUrl, { waitUntil: "networkidle" });
        await page.emulateMedia?.({ media: "print" });
        await page.pdf({
          path: tempPdfPath,
          format: "A4",
          printBackground: true,
          margin: { top: "12mm", bottom: "12mm", left: "14mm", right: "14mm" },
        });
        await browser.close();
        if (existsSync(tempPdfPath) && statSync(tempPdfPath).size > 10000) {
          generationSuccess = true;
        }
      }
    } catch {}
  }

  if (serverInstance) {
    serverInstance.close();
  }

  if (generationSuccess && existsSync(tempPdfPath)) {
    const fileSize = statSync(tempPdfPath).size;

    pruneOutdatedPdfs(publicDir);
    copyFileSync(tempPdfPath, targetVersionedPdf);

    if (existsSync(distDir)) {
      copyFileSync(tempPdfPath, resolve(distDir, versionedPdfFilename));
      pruneOutdatedPdfs(distDir);
    }

    try {
      unlinkSync(tempPdfPath);
    } catch {}

    // Save build cache metadata
    if (!existsSync(astroCacheDir))
      mkdirSync(astroCacheDir, { recursive: true });
    writeFileSync(
      pdfCachePath,
      JSON.stringify(
        {
          contentHash: cvVersion.contentHash,
          filename: versionedPdfFilename,
          fileSize,
          renderedAt: new Date().toISOString(),
        },
        null,
        2,
      ) + "\n",
    );

    console.log(
      `✓ Successfully generated executive CV PDF (${(fileSize / 1024).toFixed(1)} KB) -> public/${versionedPdfFilename}`,
    );
    return;
  }

  // Fatal error if generation failed
  console.error("✗ Error: Headless browser failed to generate CV PDF.");
  if (!existsSync(targetVersionedPdf)) {
    console.error(`  Target file missing: ${targetVersionedPdf}`);
    process.exit(1);
  }
}

generateCvPdf().catch((err) => {
  console.error("Fatal PDF generation error:", err);
  process.exit(1);
});
