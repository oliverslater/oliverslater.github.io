# Oliver Slater — Virtual CV & Engineering Blog

A high-performance personal portfolio, scannable virtual CV, and technical blog built with **Astro**, **Tailwind CSS**, and **Pages CMS**. Designed with the **DarkMinimal** aesthetic: strict monochrome hierarchy, zero layout shift, system-native dark/light mode with zero flash of unstyled content (Zero FOUC), and static export for GitHub Pages.

---

## ⚡ Tech Stack & Architecture

- **Static Framework:** [Astro 5](https://astro.build/) (`output: 'static'`)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with custom DarkMinimal monochrome color scale
- **Typography:** JetBrains Mono accents, clean sans-serif body, `@tailwindcss/typography`
- **Theme Mode:**
  - System default via `prefers-color-scheme`
  - Manual toggle override persisted in `localStorage`
  - Zero FOUC via inline blocking script in `<head>`
- **Headless CMS:** [Pages CMS](https://pagescms.org/) (`.pages.yml`)
- **Hosting Target:** GitHub Pages (`.github/workflows/deploy-github-pages.yml`)
- **Contact Form:** Static client-side headless form supporting Web3Forms or Formspree

---

## 📁 Project Structure

```text
├── .github/workflows/
│   └── deploy-github-pages.yml  # GitHub Actions automated Pages deployment
├── .pages.yml                   # Pages CMS schema for blog & CV files
├── .env.example                 # Form endpoint environment template
├── public/
│   └── assets/                  # Images and media uploads
├── src/
│   ├── content/
│   │   ├── config.ts            # Content collections & TypeScript schemas
│   │   ├── blog/                # Markdown blog posts
│   │   └── cv/                  # Structured CV data files
│   │       ├── profile.json     # Bio, contact, competencies
│   │       ├── experience.json  # Work history, highlights, tech stacks
│   │       ├── skills.json      # Categorized skill matrices
│   │       └── education.json   # Degree and academic honors
│   ├── components/
│   │   ├── Header.astro         # Top navigation with active states & ThemeToggle
│   │   ├── Footer.astro         # Minimal copyright, socials, and legal links
│   │   ├── ThemeToggle.astro    # Accessible Dark/Light toggle with SVG icons
│   │   ├── CVSection.astro      # Scannable timeline cards and section containers
│   │   └── ContactForm.astro    # Client-side headless contact form
│   ├── layouts/
│   │   ├── BaseLayout.astro     # Zero-FOUC theme script, SEO metadata, layout
│   │   └── BlogPostLayout.astro # DarkMinimal prose typography container
│   ├── pages/
│   │   ├── index.astro          # Hero, specialization, highlights, recent articles
│   │   ├── cv.astro             # Printable & scannable full CV with PDF print button
│   │   ├── blog/
│   │   │   ├── index.astro      # Blog list with topic badges
│   │   │   └── [slug].astro     # Dynamic markdown post renderer
│   │   └── contact.astro        # Dedicated contact page
│   └── styles/
│       └── global.css           # Tailwind layers, print CSS, selection styles
├── astro.config.mjs             # Astro static configuration
├── tailwind.config.mjs          # DarkMinimal neutral palette & prose theme
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

### 3. Type Checking & Diagnostics
```bash
npm run check
```

### 4. Build Production Static Files
```bash
npm run build
```
Static production output will be generated into the `dist/` directory.

### 5. Preview Production Build
```bash
npm run preview
```

---

## 🌓 Dark/Light Mode (Zero FOUC)

1. **System Default:** The site automatically detects `(prefers-color-scheme: dark)` on first visit.
2. **Manual Toggle:** Clicking the accessible Sun/Moon button toggles `.dark` on `document.documentElement`.
3. **Persistence:** Changes are saved to `localStorage.getItem('theme')`.
4. **Zero FOUC:** An inline blocking script inside `<head>` in `src/layouts/BaseLayout.astro` resolves the theme before the first frame paints.
5. **OS Reactivity:** If no manual preference is saved, the theme automatically updates when the user's OS changes between light and dark mode.

---

## 📝 Managing Content with Pages CMS

This repository contains a ready-to-use `.pages.yml` file.

1. Connect your repository at [pagescms.org](https://pagescms.org).
2. Use the visual editor to:
   - Author, edit, and publish Markdown blog posts in `src/content/blog/`.
   - Update your profile, bio, and social links in `src/content/cv/profile.json`.
   - Add or edit work experience roles in `src/content/cv/experience.json`.
   - Update skill categories in `src/content/cv/skills.json`.
   - Add manual credentials in `src/content/cv/manual-certifications.json`.
   - Configure visibility, count, and display priority in `src/content/cv/certification-settings.json`.

---

## 🏅 Credentials & Certifications Engine

The `/cv` page dynamically synchronizes and renders verified certifications from:
- **Credly API**: 43 active credentials fetched at build time.
- **Microsoft Learn API**: 11 active certifications pulled from your public transcript (`d5on2cqnl3lgknq`).
- **Manual Credentials**: Configurable via `src/content/cv/manual-certifications.json`.

### Granular Controls & Toggles
In `src/content/cv/certification-settings.json`, you can customize ANY certification:
- **`displayed: false`**: Hides the card from the CV grid.
- **`includeInCount: false`**: Excludes the credential from the headline counter badge.
- **`priority: 10`**: Floats the credential to the top of the page (higher number = displayed first).
- **`order: 1`**: Friendly ranking alias (1st place, 2nd place).
- **Expiration Filtering**: Expired certifications are automatically filtered out.

> 📖 **Full Documentation & Copy-Pasteable Examples:** See [src/content/cv/CERTIFICATIONS_GUIDE.md](src/content/cv/CERTIFICATIONS_GUIDE.md).

---

## ✉️ Contact Form Setup

The contact form in `src/components/ContactForm.astro` sends data using client-side `fetch`.

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. For **Web3Forms** (free, no backend needed):
   - Get a free access key at [web3forms.com](https://web3forms.com).
   - Set `PUBLIC_WEB3FORMS_KEY="your_access_key"` in `.env`.
3. For **Formspree** or custom webhook:
   - Set `PUBLIC_FORM_ENDPOINT="https://formspree.io/f/your_form_id"` in `.env`.

---

## 🚢 Deployment

### GitHub Pages (Automated via GitHub Actions)
A workflow is configured in `.github/workflows/deploy-github-pages.yml`.

1. Push your code to the `main` branch:
   ```bash
   git add .
   git commit -m "feat: initial DarkMinimal Virtual CV & Blog setup"
   git push origin main
   ```
2. In your GitHub repository settings, go to **Settings > Pages**.
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. Every push to `main` will build and deploy the `dist/` folder automatically.

---

## 📄 CV Printing & PDF Export

The `/cv` page includes a dedicated **Print / PDF** button with specialized `@media print` rules:
- Hides headers, navigation, footers, and interactive action buttons (`no-print`).
- Enforces clean black text on white background.
- Prevents page breaks inside work experience and education cards (`page-break-inside: avoid`).