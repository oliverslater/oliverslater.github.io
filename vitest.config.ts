import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", "dist/**"],
    reporters: [
      "default",
      [
        "html",
        {
          outputFile: "test-results/html/index.html",
        },
      ],
      [
        "junit",
        {
          outputFile: "test-results/junit.xml",
        },
      ],
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "./coverage",
      include: ["src/utils/**", "src/components/**/*.tsx"],
      exclude: [
        "src/utils/credly.ts", // External HTTP API network calls
        "src/utils/mslearn.ts", // External HTTP API network calls
        "src/utils/cache.ts", // Build-time filesystem caching
        "src/utils/feed.ts", // Astro build-time XML feed serialization
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 75,
        branches: 70,
      },
    },
  },
});
