import fs from "node:fs";
import path from "node:path";

// Store credentials cache in node_modules/.cache/credentials
const CACHE_DIR = path.resolve(
  process.cwd(),
  "node_modules/.cache/credentials",
);
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour TTL

export function getCachedData<T>(
  key: string,
  maxAgeMs = DEFAULT_TTL_MS,
): T | null {
  if (process.env.FORCE_REFRESH_CERTS === "true") {
    return null;
  }
  try {
    const file = path.join(CACHE_DIR, `${key}.json`);
    if (!fs.existsSync(file)) return null;
    const stat = fs.statSync(file);
    if (Date.now() - stat.mtimeMs > maxAgeMs) {
      return null;
    }
    const data = JSON.parse(fs.readFileSync(file, "utf-8"));
    return data as T;
  } catch {
    return null;
  }
}

export function getStaleCacheData<T>(key: string): T | null {
  try {
    const file = path.join(CACHE_DIR, `${key}.json`);
    if (!fs.existsSync(file)) return null;
    const data = JSON.parse(fs.readFileSync(file, "utf-8"));
    return data as T;
  } catch {
    return null;
  }
}

export function setCachedData<T>(key: string, data: T): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    const file = path.join(CACHE_DIR, `${key}.json`);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // Ignore cache write errors
  }
}
