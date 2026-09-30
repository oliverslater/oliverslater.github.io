import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
// @ts-expect-error js-yaml lacks bundled TypeScript types
import yaml from "js-yaml";

describe("Pages CMS Configuration & Media Assets", () => {
  const rootDir = process.cwd();
  const pagesConfigPath = path.resolve(rootDir, ".pages.yml");

  it("defines a valid .pages.yml configuration", () => {
    expect(fs.existsSync(pagesConfigPath)).toBe(true);
    const content = fs.readFileSync(pagesConfigPath, "utf-8");
    const parsed = yaml.load(content) as any;
    expect(parsed).toBeDefined();
    expect(typeof parsed).toBe("object");
  });

  it("configures dedicated media input/output directories for blog assets", () => {
    const content = fs.readFileSync(pagesConfigPath, "utf-8");
    const parsed = yaml.load(content) as any;

    // Global media defaults
    expect(parsed.media).toBeDefined();
    expect(parsed.media.input).toBe("public/assets");
    expect(parsed.media.output).toBe("/assets");

    // Blog collection media scope
    const blogCollection = parsed.content?.find((c: any) => c.name === "blog");
    expect(blogCollection).toBeDefined();
    expect(blogCollection.media).toBeDefined();
    expect(blogCollection.media.input).toBe("public/assets/blog");
    expect(blogCollection.media.output).toBe("/assets/blog");
  });

  it("ensures public/assets/blog directory exists on disk for media uploads", () => {
    const blogAssetsDir = path.resolve(rootDir, "public/assets/blog");
    expect(fs.existsSync(blogAssetsDir)).toBe(true);
    const stat = fs.statSync(blogAssetsDir);
    expect(stat.isDirectory()).toBe(true);
  });
});
