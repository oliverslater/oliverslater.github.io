import fs from "node:fs";
import path from "node:path";

const summaryPath = path.resolve("coverage/coverage-summary.json");
const badgePath = path.resolve("public/badges/coverage.svg");

if (!fs.existsSync(summaryPath)) {
  console.error("No coverage summary found at " + summaryPath);
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, "utf-8"));
const linePct = Math.round(summary.total?.lines?.pct ?? 0);

// Color by threshold
let color = "#e05d44"; // red
if (linePct >= 80) {
  color = "#4c1"; // bright green
} else if (linePct >= 70) {
  color = "#97ca00"; // green
} else if (linePct >= 60) {
  color = "#dfb317"; // yellow
} else if (linePct >= 50) {
  color = "#fe7d37"; // orange
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="108" height="20" role="img" aria-label="coverage: ${linePct}%">
  <title>coverage: ${linePct}%</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="108" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="63" height="20" fill="#555"/>
    <rect x="63" width="45" height="20" fill="${color}"/>
    <rect width="108" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text aria-hidden="true" x="325" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="530">coverage</text>
    <text x="325" y="140" transform="scale(.1)" fill="#fff" textLength="530">coverage</text>
    <text aria-hidden="true" x="845" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="350">${linePct}%</text>
    <text x="845" y="140" transform="scale(.1)" fill="#fff" textLength="350">${linePct}%</text>
  </g>
</svg>
`;

fs.mkdirSync(path.dirname(badgePath), { recursive: true });
fs.writeFileSync(badgePath, svg.trim() + "\n", "utf-8");
console.log(`Generated coverage badge at ${badgePath} (${linePct}%, ${color})`);
