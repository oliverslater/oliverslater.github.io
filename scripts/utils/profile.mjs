import { existsSync, readFileSync } from "node:fs";

/**
 * Reads and validates profile data from src/content/cv/profile.json.
 * Returns parsed profileData and sanitized safeName string.
 */
export function getProfileData(profilePath) {
  if (!existsSync(profilePath)) {
    console.error(`✗ Missing required profile data file at: ${profilePath}`);
    process.exit(1);
  }

  let profileData;
  try {
    profileData = JSON.parse(readFileSync(profilePath, "utf8"));
  } catch (err) {
    console.error(
      `✗ Failed to parse profile data from ${profilePath}:`,
      err.message,
    );
    process.exit(1);
  }

  if (!profileData.name || typeof profileData.name !== "string") {
    console.error(
      "✗ Missing or invalid 'name' field in src/content/cv/profile.json",
    );
    process.exit(1);
  }

  const safeName = profileData.name.trim().replace(/\s+/g, "_");

  return { profileData, safeName };
}
