# Contributing to Oliver Slater's Portfolio & Engineering Platform

Thank you for your interest in contributing. This document outlines the branch architecture, code standards, and verification procedures enforced across this repository.

---

## Branch Strategy & Git Flow

This repository follows a strict Git Flow model:

- **`main`**: The immutable production branch. Direct pushes to `main` are restricted. All changes merged into `main` trigger automated deployment to GitHub Pages.
- **`develop`**: The primary integration and staging branch. All feature branches, content drafts, and Pages CMS commits target `develop`.
- **`feature/<name>` / `fix/<name>`**: Working branches branched from `develop` for specific changes.

### Branch Lifecycle:

1. Branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-feature
   ```
2. Commit changes following Conventional Commits (e.g. `feat(blog): ...`, `fix(cv): ...`, `chore(deps): ...`).
3. Push to origin and open a Pull Request targeting `develop`.
4. Ensure all CI status checks pass (`Verify PR Quality & Build`).
5. Periodic releases from `develop` to `main` are merged via Pull Request to deploy live to production.

---

## Local Development & Quality Gates

This repository uses **Node.js 24**, **Husky**, and **lint-staged** to ensure zero-defect commits.

### Key Validation Commands:

```bash
# Run unit tests
npm test

# Run full pre-flight verification (unit tests, schema validators, linting, spelling, hygiene, licenses, type check)
npm run validate

# Build static site locally
npm run build

# Validate HTML output and check for broken hyperlinks
npm run check:links

# Verify third-party license notices are up to date
npm run licenses:check
```

---

## Commit Guidelines

Commits must follow the [Conventional Commits specification](https://www.conventionalcommits.org/):

- `feat:` A new feature, component, or content addition
- `fix:` A bug fix or typo correction
- `refactor:` Code or markup restructuring without behavior change
- `chore:` Dependency bumps, tooling updates, or license maintenance
- `docs:` Documentation improvements
