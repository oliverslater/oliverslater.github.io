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
  },
});
