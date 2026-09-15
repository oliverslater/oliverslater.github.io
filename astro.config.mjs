import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import profileData from "./src/content/cv/profile.json";

// https://astro.build/config
export default defineConfig({
  output: "static",
  site: profileData.website,
  integrations: [react()],
  prefetch: {
    prefetchAll: false,
    defaultStrategy: "hover",
  },
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: "always",
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      defaultColor: false,
      langs: [
        "hcl",
        "terraform",
        "bash",
        "zsh",
        "yaml",
        "json",
        "python",
        "dockerfile",
      ],
      wrap: false,
    },
  },
  server: {
    host: true,
    port: 4321,
  },
});
