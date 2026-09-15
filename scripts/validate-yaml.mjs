import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const rootDir = process.cwd();

// Find all YAML files in root, .github, and src
function findYamlFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findYamlFiles(fullPath, fileList);
    } else if (entry.isFile() && (entry.name.endsWith('.yml') || entry.name.endsWith('.yaml'))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const yamlFiles = findYamlFiles(rootDir);
let hasError = false;

console.log(`Validating ${yamlFiles.length} YAML file(s)...`);

for (const filePath of yamlFiles) {
  const relativePath = path.relative(rootDir, filePath);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    yaml.load(content);
    console.log(`  ✓ ${relativePath}`);
  } catch (err) {
    console.error(`  ✗ Error in ${relativePath}:`);
    console.error(`    ${err.message}`);
    hasError = true;
  }
}

if (hasError) {
  console.error('\nYAML validation failed!');
  process.exit(1);
} else {
  console.log('\nAll YAML files validated successfully.');
}
