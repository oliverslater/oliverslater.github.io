import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://www.oliver-slater.co.uk',
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
  ],
});
