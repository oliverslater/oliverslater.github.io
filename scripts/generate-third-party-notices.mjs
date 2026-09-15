import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lockfilePath = resolve(rootDirectory, 'package-lock.json');
const noticesPath = resolve(rootDirectory, 'THIRD-PARTY-NOTICES.md');
const licensesDirectory = resolve(rootDirectory, 'third-party-licenses');
const checkOnly = process.argv.includes('--check');
const distributedPackageNames = new Set([
  '@fontsource-variable/montserrat',
  'react',
  'react-dom',
]);

const lockfile = JSON.parse(await readFile(lockfilePath, 'utf8'));
const packages = Object.entries(lockfile.packages)
  .filter(([path]) => path.startsWith('node_modules/'))
  .map(([path, metadata]) => ({
    path,
    name: getPackageName(path, metadata),
    version: metadata.version ?? 'unknown',
    license: getLicense(metadata),
    scope: 'distributed',
  }))
  .filter((packageInfo) => distributedPackageNames.has(packageInfo.name))
  .sort((left, right) => left.name.localeCompare(right.name) || left.version.localeCompare(right.version));

const licenseFiles = await collectLicenseFiles(packages);
const licenseLinks = await writeLicenseFiles(licenseFiles);

const licenseCounts = packages.reduce((counts, packageInfo) => {
  counts.set(packageInfo.license, (counts.get(packageInfo.license) ?? 0) + 1);
  return counts;
}, new Map());

const summary = [...licenseCounts.entries()]
  .sort(([left], [right]) => left.localeCompare(right))
  .map(([license, count]) => `- ${license}: ${count} package${count === 1 ? '' : 's'}`)
  .join('\n');

const rows = packages.map((packageInfo) => {
  const packageUrl = `https://www.npmjs.com/package/${packageInfo.name}`;
  return `| [${packageInfo.name}](${packageUrl}) | ${packageInfo.version} | ${packageInfo.license} | ${packageInfo.scope} | [full text](third-party-licenses/${licenseLinks.get(packageInfo.path)}) |`;
}).join('\n');

const content = `# Third-Party Notices

This file records npm packages bundled into the browser-facing static assets. It is generated from [package-lock.json](package-lock.json) and intentionally excludes Astro, Tailwind, Sharp, TypeScript, and other build-time dependencies that are not included in \`dist/\`.

Run \`npm run licenses\` after changing dependencies and review the result before committing. The package links below identify the corresponding license and source metadata published by each package. Full license and notice texts are preserved in [third-party-licenses/](third-party-licenses/).

## Project Attributions

- The visual structure and DarkMinimal styling are adapted from [Gothsec/dark-minimal](https://github.com/Gothsec/dark-minimal), which is released under the MIT License.
- The \`LetterGlitch\` component originates from the DarkMinimal template's ReactBits integration. See [ReactBits](https://www.reactbits.dev/) and the [DarkMinimal source](https://github.com/Gothsec/dark-minimal).
- Montserrat variable font files are provided through [Fontsource](https://fontsource.org/), under the SIL Open Font License 1.1. The package is listed below as \`@fontsource-variable/montserrat\`.
- The technology icons under \`public/svg\` were downloaded from [Devicon](https://github.com/devicons/devicon), which is released under the MIT License.
- Microsoft certification badges and technology logos are third-party brand assets. They are not relicensed by this repository's MIT license; retain their source and trademark terms when redistributing them.

## License Summary

${summary}

## Package Inventory

| Package | Version | License | Scope | Full text |
| --- | --- | --- | --- | --- |
${rows}

## Notes

- This inventory covers only packages bundled into the generated browser assets.
- A package's license applies to that package and its authors; the project's MIT license applies only to original project code that Oliver Slater can license.
- Every redistributed package entry links to a preserved full license or notice text collected from its installed package metadata.
- The distributed package set is maintained explicitly in \`distributedPackageNames\` above. Recheck it when generated browser assets change.
`;

if (checkOnly) {
  const currentContent = await readFile(noticesPath, 'utf8').catch(() => null);
  if (currentContent !== content) {
    console.error(`${noticesPath} is out of date. Run npm run licenses.`);
    process.exitCode = 1;
  } else {
    console.log(`${noticesPath} is up to date.`);
  }
} else {
  await writeFile(noticesPath, content);
  console.log(`Wrote ${packages.length} package notices and ${licenseLinks.size} full-text notices.`);
}

async function collectLicenseFiles(packageInfos) {
  const filesByHash = new Map();
  const filesByLicense = new Map();

  for (const packageInfo of packageInfos) {
    const packageDirectory = resolve(rootDirectory, packageInfo.path);
    const candidates = await findNoticeFiles(packageDirectory);
    for (const candidate of candidates) {
      const content = await readFile(candidate);
      const hash = createHash('sha256').update(content).digest('hex');
      const notice = { content, hash, source: candidate };
      filesByHash.set(hash, notice);
      filesByLicense.set(packageInfo.license, notice);
      filesByLicense.set(`${packageInfo.name}@${packageInfo.version}`, notice);
    }
  }

  const result = new Map();
  for (const packageInfo of packageInfos) {
    const notice = filesByLicense.get(`${packageInfo.name}@${packageInfo.version}`)
      ?? filesByLicense.get(packageInfo.license);
    if (notice) {
      result.set(packageInfo.path, notice);
    }
  }

  return result;
}

async function findNoticeFiles(packageDirectory) {
  const entries = await readdir(packageDirectory, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isFile() && /^(license|licence|copying|notice|copyright)([-_.].*)?$/i.test(entry.name))
    .map((entry) => resolve(packageDirectory, entry.name));
}

async function writeLicenseFiles(licenseFiles) {
  await rm(licensesDirectory, { recursive: true, force: true });
  await mkdir(licensesDirectory, { recursive: true });

  const linksByPackage = new Map();
  const pathsByHash = new Map();
  for (const [packagePath, notice] of licenseFiles) {
    let relativePath = pathsByHash.get(notice.hash);
    if (!relativePath) {
      const packageInfo = packages.find(({ path }) => path === packagePath);
      const safeName = packageInfo.name.replace(/[^a-zA-Z0-9@._-]/g, '-').replace(/^@/, 'at-');
      relativePath = `${safeName}-${notice.hash.slice(0, 12)}.txt`;
      await writeFile(resolve(licensesDirectory, relativePath), notice.content);
      pathsByHash.set(notice.hash, relativePath);
    }
    linksByPackage.set(packagePath, relativePath);
  }

  return linksByPackage;
}

function getPackageName(packagePath, metadata) {
  if (metadata.name) {
    return metadata.name;
  }

  const packagePathParts = packagePath.split('node_modules/').at(-1).split('/');
  return packagePathParts[0].startsWith('@')
    ? packagePathParts.slice(0, 2).join('/')
    : packagePathParts[0];
}

function getLicense(metadata) {
  if (typeof metadata.license === 'string') {
    return metadata.license;
  }

  if (Array.isArray(metadata.licenses)) {
    return metadata.licenses.map((license) => license.type ?? license).join(' OR ');
  }

  return 'UNKNOWN';
}