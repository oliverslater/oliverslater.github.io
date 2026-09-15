#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "..");
const publicDir = resolve(rootDir, "public");
const targetPdf = resolve(publicDir, "Oliver_Slater_CV.pdf");

/**
 * Generates an executive CV PDF using headless Chromium.
 * Supports Playwright or Puppeteer if installed in the environment.
 */
async function generateCvPdf() {
  console.log("Checking environment for headless browser PDF generation...");

  let chromium;
  try {
    const pw = await import("playwright");
    chromium = pw.chromium;
  } catch {
    try {
      const pup = await import("puppeteer");
      chromium = pup.default || pup;
    } catch {
      // Neither installed
    }
  }

  if (!chromium) {
    console.log(
      "Note: Neither 'playwright' nor 'puppeteer' is installed. To enable automated PDF pre-rendering in CI/CD, add playwright to your pipeline.",
    );
    // If target PDF doesn't exist yet, write a minimal valid placeholder PDF so links remain valid
    if (!existsSync(targetPdf)) {
      console.log(
        "Ensuring target PDF endpoint exists for direct download link...",
      );
      const minimalPdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 84 >> stream
BT
/F1 14 Tf
50 780 Td
(Oliver Slater - Cloud Architect CV - Please use browser Print to PDF for the latest version) Tj
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
0000000378 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
449
%%EOF
`;
      if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });
      writeFileSync(targetPdf, minimalPdf);
      console.log(`✓ Initialized downloadable PDF at ${targetPdf}`);
    }
    return;
  }

  console.log("Launching headless browser to render CV PDF...");
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Point to local preview/dist or production CV
  const cvUrl =
    process.env.CV_RENDER_URL || "https://www.oliver-slater.co.uk/cv/";
  console.log(`Navigating to ${cvUrl}...`);
  await page.goto(cvUrl, { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });

  await page.pdf({
    path: targetPdf,
    format: "A4",
    printBackground: true,
    margin: {
      top: "12mm",
      bottom: "12mm",
      left: "14mm",
      right: "14mm",
    },
  });

  await browser.close();
  console.log(`✓ Successfully rendered CV PDF to ${targetPdf}`);
}

generateCvPdf().catch((err) => {
  console.warn("PDF generation warning:", err.message);
  process.exit(0); // non-blocking
});
