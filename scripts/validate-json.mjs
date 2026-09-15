import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();

function findJsonFiles(dir, fileList = []) {
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
      findJsonFiles(fullPath, fileList);
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const jsonFiles = findJsonFiles(rootDir);
let hasError = false;

console.log(`Validating ${jsonFiles.length} JSON file(s)...`);

for (const filePath of jsonFiles) {
  const relativePath = path.relative(rootDir, filePath);
  try {
    const content = fs.readFileSync(filePath, "utf8");
    JSON.parse(content);
    console.log(`  ✓ ${relativePath}`);
  } catch (err) {
    console.error(`  ✗ Error in ${relativePath}:`);
    console.error(`    ${err.message}`);
    hasError = true;
  }
}

if (hasError) {
  console.error("\nJSON validation failed!");
  process.exit(1);
} else {
  console.log("\nAll JSON files validated successfully.");
}
