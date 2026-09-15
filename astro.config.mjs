import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://www.oliver-slater.co.uk',
  integrations: [
    react(),
  ],
});
