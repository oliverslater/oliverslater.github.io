import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { promisify } from "node:util";

const gzip = promisify(zlib.gzip);
const brotli = promisify(zlib.brotliCompress);

const rootDir = process.cwd();
const distDir = path.resolve(rootDir, "dist");

if (!fs.existsSync(distDir)) {
  console.error("Error: dist/ directory does not exist. Run build first.");
  process.exit(1);
}

const COMPRESSIBLE_EXTENSIONS = new Set([
  ".html",
  ".css",
  ".js",
  ".mjs",
  ".svg",
  ".json",
  ".xml",
  ".txt",
  ".webmanifest",
]);

function getCompressibleFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getCompressibleFiles(fullPath, fileList);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (COMPRESSIBLE_EXTENSIONS.has(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

async function compressAll() {
  const files = getCompressibleFiles(distDir);
  console.log(
    `Pre-compressing ${files.length} static assets with Gzip (level 9) and Brotli (quality 11)...`,
  );

  let totalOriginal = 0;
  let totalGzip = 0;
  let totalBrotli = 0;

  for (const filePath of files) {
    const content = fs.readFileSync(filePath);
    totalOriginal += content.length;

    // Gzip compression (Level 9 - maximum compression)
    const gzBuffer = await gzip(content, { level: 9 });
    fs.writeFileSync(`${filePath}.gz`, gzBuffer);
    totalGzip += gzBuffer.length;

    // Brotli compression (Quality 11 - maximum compression for static assets)
    const brBuffer = await brotli(content, {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]:
          zlib.constants.BROTLI_MAX_QUALITY,
        [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
      },
    });
    fs.writeFileSync(`${filePath}.br`, brBuffer);
    totalBrotli += brBuffer.length;
  }

  const gzipSaving = ((1 - totalGzip / totalOriginal) * 100).toFixed(1);
  const brotliSaving = ((1 - totalBrotli / totalOriginal) * 100).toFixed(1);

  console.log(`✓ Compression complete across ${files.length} files:`);
  console.log(`  Original: ${(totalOriginal / 1024).toFixed(1)} KB`);
  console.log(
    `  Gzip (.gz): ${(totalGzip / 1024).toFixed(1)} KB (-${gzipSaving}%)`,
  );
  console.log(
    `  Brotli (.br): ${(totalBrotli / 1024).toFixed(1)} KB (-${brotliSaving}%)`,
  );
}

compressAll().catch((err) => {
  console.error("Compression failed:", err);
  process.exit(1);
});
