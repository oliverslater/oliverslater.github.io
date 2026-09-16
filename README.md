# Oliver Slater — Virtual CV & Engineering Blog

A high-performance personal portfolio, scannable virtual CV, and technical engineering blog built with **Astro 7**, **Tailwind CSS v4**, and **Pages CMS**. Designed with the **DarkMinimal** aesthetic: strict monochrome hierarchy, zero layout shift, system-native dark/light mode with zero flash of unstyled content (Zero FOUC), dynamic multi-provider credential synchronization, and static export for GitHub Pages.

---

## ⚡ Tech Stack & Architecture

- **Static Framework:** [Astro 7](https://astro.build/) (`output: 'static'`)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) via `@tailwindcss/vite`
  - CSS-first `@theme` and custom utility variables in `src/styles/global.css`
  - Zero-runtime stylesheet inlining (`inlineStylesheets: 'always'`)
- **Single Source of Truth Configuration:**
  - `src/content/cv/profile.json` defines core profile, social channels, and authoritative canonical domain (`website`).
  - Loaded dynamically across `astro.config.mjs`, `Layout.astro`, and build scripts (`generate-sitemap.mjs`).
- **Typography:** Montserrat Variable body font (`@fontsource-variable/montserrat`), JetBrains Mono accents, `@tailwindcss/typography`.
- **Theme Mode:**
  - System default via `prefers-color-scheme`
  - Manual toggle override persisted in `localStorage`
  - Zero FOUC via inline blocking script in `<head>`
- **Headless CMS:** [Pages CMS](https://pagescms.org/) (`.pages.yml`)
- **Automated Sitemaps & Search Directives:** Prebuild generator (`scripts/generate-sitemap.mjs`) builds `public/sitemap.xml` and synchronizes `public/robots.txt`.
- **Hosting Target:** GitHub Pages (`.github/workflows/deploy-github-pages.yml`)
- **Automated Publishing:** GitHub Actions cron schedule (`0 6 * * *`) automatically rebuilds and releases future-scheduled blog posts daily.
- **Contact Form:** Static client-side headless form supporting Web3Forms or Formspree with hCaptcha spam protection.

---

## 📁 Project Structure

```text
├── .github/
│   ├── dependabot.yml           # Dependabot automated dependency scanning
│   └── workflows/
│       ├── deploy-github-pages.yml # Daily cron + push automated Pages deployment
│       └── dependabot-build.yml    # Build verification on automated PRs
├── .pages.yml                   # Pages CMS schema for blog, CV, and settings
├── .env.example                 # Form endpoint environment template
├── public/
│   ├── assets/                  # Responsive headshot assets, icons, and media
│   ├── badges/                  # Local and Microsoft certification badge icons
│   ├── svg/                     # Curated tech stack vector logos
│   ├── CNAME                    # GitHub Pages custom apex domain binding
│   ├── humans.txt               # Authorship and technical stack credits
│   ├── robots.txt               # Automated crawler directives (synced at build)
│   ├── site.webmanifest         # PWA web manifest
│   ├── sitemap.xml              # Dynamic XML sitemap with frequency and priorities
│   └── .well-known/security.txt # RFC 9116 security disclosure contact
├── scripts/
│   ├── check-file-hygiene.mjs   # Checks file sizes (<5MB) and private key leakage
│   ├── generate-sitemap.mjs     # Generates sitemap.xml & syncs robots.txt from profile.json
│   ├── generate-third-party-notices.mjs # Collects licenses into THIRD-PARTY-NOTICES.md
│   ├── validate-json.mjs        # Strict JSON syntax verification
│   └── validate-yaml.mjs        # Strict YAML syntax verification
├── src/
│   ├── components/
│   │   ├── ContactForm.astro    # Client-side headless contact form with hCaptcha
│   │   ├── CVSection.astro      # Scannable timeline cards and section containers
│   │   ├── Footer.astro         # Minimal copyright, socials, and legal links
│   │   ├── Header.astro         # Top navigation with active indicator & ThemeToggle
│   │   ├── Headshot.astro       # Responsive picture element (WebP/PNG srcset)
│   │   ├── LetterGlitch.tsx     # Interactive canvas matrix glitch animation
│   │   ├── LogoWall.astro       # Infinite scrolling technology logo wall
│   │   ├── SkillsList.tsx       # Interactive categorized skills accordion island
│   │   ├── SocialLinks.astro    # Accessible SVG social channel icons
│   │   └── ThemeToggle.astro    # Accessible Dark/Light toggle with SVG icons
│   ├── content.config.ts        # Content collections & TypeScript schemas
│   ├── content/
│   │   ├── blog/                # Markdown blog posts
│   │   ├── cv/                  # Structured CV data files
│   │   │   ├── profile.json     # Bio, canonical website, contact, competencies
│   │   │   ├── experience.json  # Work history, roles, highlights, tech stacks
│   │   │   ├── skills.json      # Categorized skill matrices
│   │   │   ├── education.json   # Academic degrees & offline credential fallback
│   │   │   ├── deliverables.json # Architecture capability pillars & deliverables
│   │   │   ├── manual-certifications.json # Credentials not available via public API
│   │   │   ├── certification-settings.json # Overrides, priority, order, and issuer mappings
│   │   │   └── CERTIFICATIONS_GUIDE.md     # In-depth guide for credentials configuration
│   │   └── technologies.json    # Technology logos and category tags
│   ├── data/
│   │   └── siteData.ts          # Central data exports and provider configs
│   ├── layouts/
│   │   ├── Layout.astro         # Zero-FOUC theme script, SEO metadata, base shell
│   │   └── BlogPostLayout.astro # DarkMinimal prose typography container
│   ├── pages/
│   │   ├── index.astro          # Hero, specialization pillars, highlights, recent articles
│   │   ├── cv.astro             # Scannable full CV with live credentials & print export
│   │   ├── contact.astro        # Dedicated contact page & inquiries channel
│   │   ├── thank-you.astro      # Form submission confirmation with auto-redirect
│   │   └── blog/
│   │       ├── index.astro      # Chronological blog list with instant search & topic filter
│   │       ├── [slug].astro     # Legacy flat slug redirect to nested URL
│   │       └── [year]/[month]/[slug].astro # Nested chronological article renderer
│   ├── styles/
│   │   └── global.css           # Tailwind 4 CSS-first theme, print rules, animations
│   └── utils/
│       ├── blog.ts              # Canonical nested URL generator & scheduling logic
│       ├── cache.ts             # Local JSON cache for external API responses
│       ├── certifications.ts    # Multi-provider certification orchestrator
│       ├── credentialApi.ts     # Resilient fetch utility with timeout handling
│       ├── credentialTypes.ts   # Unified credential interfaces and issuer normalizer
│       ├── credly.ts            # Dynamic Credly public badge API client
│       ├── date.ts              # Date formatting and total experience calculation
│       ├── manualCredentials.ts # Normalizer for manual & fallback qualifications
│       ├── mslearn.ts           # Dynamic Microsoft Learn public transcript API client
│       └── profile.ts           # Contact details and profile helpers
├── third-party-licenses/        # Harvested full-text third-party licenses
├── THIRD-PARTY-NOTICES.md       # Bundled open-source attribution report
├── astro.config.mjs             # Astro static configuration & @tailwindcss/vite
├── tsconfig.json                # TypeScript strict configuration
└── package.json
```

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Local Development Server

```bash
npm run dev
```

Visit `http://localhost:4321` in your browser.

### 3. Comprehensive Validation Suite

Validate YAML files, JSON files, repository file hygiene (<5MB limit, no accidental private key commitments), and Astro/TypeScript types:

```bash
npm run validate
```

Individual checks can be run independently:

```bash
npm run validate:yaml   # Validates .pages.yml and GitHub Actions workflows
npm run validate:json   # Validates all JSON data files and configs
npm run check:hygiene   # Verifies file sizes and security hygiene
npm run check           # Astro TypeScript and template diagnostics
```

### 4. Build Production Static Files

```bash
npm run build
```

This runs `npm run prebuild` (generating `public/sitemap.xml` and synchronizing `public/robots.txt`) before compiling static HTML into `dist/`.

### 5. Preview Production Build

```bash
npm run preview
```

### 6. Third-Party Notices & Licenses

Harvest licenses for client-bundled production assets:

```bash
npm run licenses        # Regenerate THIRD-PARTY-NOTICES.md and license files
npm run licenses:check  # CI check verifying notices are up-to-date
```

---

## ✍️ Engineering Blog & Content Scheduling

The blog includes nested routing, instant client-side filtering, and automated publishing.

### Nested Chronological Routing

Articles follow a canonical hierarchical route structure:

```text
/blog/YYYY/MM/slug
```

For example: `/blog/2026/09/architecting-a-modern-cloud-portfolio-with-astro-github-and-gemini`

### Instant Client-Side Search & Topic Filtering

- **Instant Search:** Interactive client-side filtering searches article titles and descriptions in real time.
- **Topic Filtering:** Clickable topic tags isolate articles by specialization.
- **Deep-Linkable URL Parameters:** Search query and tag filters are synchronized to URL query parameters (e.g., `/blog?tag=Cloud+Architecture&q=Astro`), allowing filtered views to be bookmarked and shared.
- **Chronological Hierarchy:** Articles are grouped by Year (`<h2>`) and Month (`<h3>`).

### Scheduling Posts (Future `pubDate`)

You can draft or schedule future posts directly using frontmatter:

```markdown
---
title: "Upcoming Architecture Deep Dive"
description: "An architectural exploration of enterprise event streaming."
pubDate: "2026-10-01T09:00:00Z"
tags: ["AWS", "Architecture"]
draft: false
---
```

1. **Automatic Visibility Control:** Any post with a `pubDate` set to a future timestamp is automatically excluded from:
   - Static route generation (`/blog/YYYY/MM/slug`)
   - The blog listing index (`/blog`)
   - Recent articles on the home page (`/`)
   - `public/sitemap.xml`
2. **Automated Daily Deployment Cron:**
   - The GitHub Actions workflow (`.github/workflows/deploy-github-pages.yml`) runs on a daily schedule (`0 6 * * *` at 06:00 UTC) in addition to code pushes.
   - When a post's `pubDate` is reached, the automated daily build seamlessly compiles the article into production without manual commits.

---

## 🌓 Dark/Light Mode (Zero FOUC)

1. **System Default:** The site automatically detects `(prefers-color-scheme: dark)` on first visit.
2. **Manual Toggle:** Clicking the accessible Sun/Moon button toggles `.dark` on `document.documentElement`.
3. **Persistence:** Changes are saved to `localStorage.getItem('theme')`.
4. **Zero FOUC:** An inline blocking script inside `<head>` in `src/layouts/Layout.astro` resolves the theme before the first frame paints.
5. **OS Reactivity:** If no manual preference is saved, the theme automatically updates when the user's OS changes between light and dark mode.

---

## 📝 Managing Content with Pages CMS

This repository contains a ready-to-use `.pages.yml` file.

1. Connect your repository at [pagescms.org](https://pagescms.org).
2. Use the visual editor to:
   - Author, edit, and schedule Markdown blog posts in `src/content/blog/`.
   - Update your profile, bio, and social links in `src/content/cv/profile.json`.
   - Add or edit work experience roles in `src/content/cv/experience.json`.
   - Update skill categories in `src/content/cv/skills.json`.
   - Add manual credentials in `src/content/cv/manual-certifications.json`.
   - Configure visibility, count, and display priority in `src/content/cv/certification-settings.json`.

---

## 🏅 Credentials & Certifications Engine

The `/cv` page dynamically synchronizes and renders verified certifications from:

- **Credly API**: Verified credentials fetched at build time.
- **Microsoft Learn API**: Active certifications pulled dynamically from your public transcript share ID.
- **Manual Credentials**: Configurable via `src/content/cv/manual-certifications.json`.
- **Local Fallback**: Graceful offline fallback from `education.json` if external APIs are unreachable during build.

### Granular Controls & Toggles

In `src/content/cv/certification-settings.json`, you can customize any certification:

- **`displayed: false`**: Hides the card from the CV grid.
- **`includeInCount: false`**: Excludes the credential from the headline counter badge.
- **`priority: 10`**: Floats the credential to the top of the page (higher number = displayed first).
- **`order: 1`**: Friendly ranking alias (1st place, 2nd place).
- **`issuerMappings`**: Normalizes issuer names (e.g., mapping "Amazon Web Services" to "AWS").
- **Expiration Filtering**: Expired certifications are automatically filtered out unless explicitly retained.

> 📖 **Full Documentation & Copy-Pasteable Examples:** See [src/content/cv/CERTIFICATIONS_GUIDE.md](src/content/cv/CERTIFICATIONS_GUIDE.md).

---

## ✉️ Contact & Networking Setup

The contact form in `src/components/ContactForm.astro` sends data using client-side `fetch` and redirects to `/thank-you` upon submission.

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. For **Web3Forms** (free, no backend needed):
   - Get an access key at [web3forms.com](https://web3forms.com).
   - Set `PUBLIC_WEB3FORMS_KEY="your_access_key"` in `.env`.
3. **hCaptcha Spam Protection**:
   - Zero-config integration is enabled by default with dark theme styling.
   - Activate hCaptcha for your form in your Web3Forms dashboard under spam settings.
   - _(Optional)_ If using your own custom hCaptcha site key, configure `PUBLIC_HCAPTCHA_SITEKEY` in `.env` or GitHub Secrets.
4. For **Formspree** or custom webhook:
   - Set `PUBLIC_FORM_ENDPOINT="https://formspree.io/f/your_form_id"` in `.env`.

---

## 🚢 Deployment

### GitHub Pages (Automated via GitHub Actions)

A workflow is configured in `.github/workflows/deploy-github-pages.yml`.

1. Push your code to the `main` branch:
   ```bash
   git add .
   git commit -m "feat: update documentation and architecture"
   git push origin main
   ```
2. In your GitHub repository settings, navigate to **Settings > Pages**.
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. Every push to `main`—and the daily cron trigger—will build and deploy the `dist/` folder automatically.

---

## 📄 CV Printing & PDF Export

The `/cv` page includes a dedicated **Print / PDF** button with specialized `@media print` rules:

- Hides headers, navigation, footers, and interactive action buttons (`no-print`).
- Enforces clean black text on white background.
- Converts links into clean, printed URL strings.
- Prevents awkward page breaks inside work experience and education cards (`page-break-inside: avoid`).
