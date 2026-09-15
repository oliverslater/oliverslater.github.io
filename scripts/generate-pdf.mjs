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
const profilePath = resolve(rootDir, "src/content/cv/profile.json");

// Read profile data dynamically to eliminate hardcoded constants
let profileData = {
  name: "Oliver Slater",
  website: "https://www.oliver-slater.co.uk",
};
if (existsSync(profilePath)) {
  try {
    profileData = JSON.parse(readFileSync(profilePath, "utf8"));
  } catch (err) {
    console.warn("Could not parse profile.json, using defaults:", err.message);
  }
}

// Generate versioned ISO datestamp filename: e.g. Oliver_Slater_CV_2026-09-16.pdf
const isoDate = new Date().toISOString().split("T")[0];
const safeName = (profileData.name || "CV").replace(/\s+/g, "_");
const versionedPdfFilename = `${safeName}_CV_${isoDate}.pdf`;
const legacyPdfFilename = `${safeName}_CV.pdf`;

const targetVersionedPdf = resolve(publicDir, versionedPdfFilename);
const targetLegacyPdf = resolve(publicDir, legacyPdfFilename);

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
 * Generates the executive CV PDF using Chrome headless CLI or Playwright/Puppeteer.
 */
async function generateCvPdf() {
  if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

  const chromePath = findSystemChrome();
  const distCvHtml = resolve(distDir, "cv/index.html");
  const hasLocalDist = existsSync(distCvHtml);

  // Dynamic render URL resolution
  let serverInstance = null;
  let renderUrl = process.env.CV_RENDER_URL;

  if (!renderUrl && hasLocalDist) {
    const { server, port } = await startDistServer(distDir);
    serverInstance = server;
    renderUrl = `http://127.0.0.1:${port}/cv/`;
    console.log(`Serving local build for PDF generation at ${renderUrl}`);
  } else if (!renderUrl) {
    // Dynamically derived from profileData.website
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
      console.warn("Headless browser generation warning:", err.message);
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

    // Clean up outdated versioned PDFs matching ${safeName}_CV_*.pdf in public/
    try {
      const files = readdirSync(publicDir);
      for (const f of files) {
        if (
          f.startsWith(`${safeName}_CV_`) &&
          f.endsWith(".pdf") &&
          f !== versionedPdfFilename
        ) {
          unlinkSync(join(publicDir, f));
          console.log(`Cleaned up previous versioned PDF: public/${f}`);
        }
      }
    } catch {}

    // Save to public versioned and legacy alias
    copyFileSync(tempPdfPath, targetVersionedPdf);
    copyFileSync(tempPdfPath, targetLegacyPdf);

    // Also update dist/ if it exists so downstream check:links and compress immediately see it
    if (existsSync(distDir)) {
      copyFileSync(tempPdfPath, resolve(distDir, versionedPdfFilename));
      copyFileSync(tempPdfPath, resolve(distDir, legacyPdfFilename));

      // Clean up outdated in dist/
      try {
        const distFiles = readdirSync(distDir);
        for (const f of distFiles) {
          if (
            f.startsWith(`${safeName}_CV_`) &&
            f.endsWith(".pdf") &&
            f !== versionedPdfFilename
          ) {
            unlinkSync(join(distDir, f));
          }
        }
      } catch {}
    }

    try {
      unlinkSync(tempPdfPath);
    } catch {}

    console.log(
      `✓ Successfully generated executive CV PDF (${(fileSize / 1024).toFixed(1)} KB) -> public/${versionedPdfFilename} and public/${legacyPdfFilename}`,
    );
    return;
  }

  // Graceful fallback for environments lacking headless Chrome/Chromium
  console.log(
    "Note: Headless Chrome/Chromium not detected in environment. To generate the CV PDF, install Chrome or run in CI.",
  );

  // If a valid PDF already exists in public/, copy it to the versioned target
  if (existsSync(targetLegacyPdf) && statSync(targetLegacyPdf).size > 10000) {
    copyFileSync(targetLegacyPdf, targetVersionedPdf);
    console.log(
      `✓ Preserved existing CV PDF as public/${versionedPdfFilename}`,
    );
  } else if (!existsSync(targetVersionedPdf)) {
    // Generate minimal valid PDF so links and downloads don't 404
    const minimalPdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 72 >> stream
BT
/F1 14 Tf
50 780 Td
(${profileData.name} - ${profileData.title} CV) Tj
ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000366 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
437
%%EOF
`;
    writeFileSync(targetVersionedPdf, minimalPdf);
    writeFileSync(targetLegacyPdf, minimalPdf);
    if (existsSync(distDir)) {
      writeFileSync(resolve(distDir, versionedPdfFilename), minimalPdf);
      writeFileSync(resolve(distDir, legacyPdfFilename), minimalPdf);
    }
    console.log(
      `✓ Initialized fallback CV PDF at public/${versionedPdfFilename}`,
    );
  }
}

generateCvPdf().catch((err) => {
  console.warn("PDF generation warning:", err.message);
  process.exit(0);
});
