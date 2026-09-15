# Repository Pre-Commit & Validation Strategy

This repository implements automated validation checks to protect against configuration errors, malformed content, and broken builds—both locally on your machine and remotely in GitHub Actions CI (catching commits made by external tools like Pages CMS).

---

## Active Setup: Option B (Pure Node.js Ecosystem)

The active validation system uses **Husky + lint-staged + Node.js validation scripts**. It requires zero external tools or Python dependencies—anyone with Node 24 will have the hooks initialized upon running `npm install`.

### What Runs on `git commit` (Local):

1. **`lint-staged` (Staged files only)**:
   - **Trailing Whitespace & End of File**: Automatically fixed via `prettier --write` on all staged code, Markdown, and CSS files.
   - **YAML Syntax Validation**: Validates staged `.yml` and `.yaml` files via `node scripts/validate-yaml.mjs`.
   - **JSON Syntax Validation**: Validates staged `.json` files via `node scripts/validate-json.mjs`.
   - **Hygiene Guard**: Runs `node scripts/check-file-hygiene.mjs` to block accidental private key commits and oversized binaries (> 5MB).
2. **`npm run validate` (Entire Repository)**:
   - Validates all YAML files in the repository (`.pages.yml`, GitHub Actions workflows).
   - Validates all JSON content files in `src/content/cv/`.
   - Runs `check:hygiene` to ensure no private keys or runaway binary files exist.
   - Runs `astro check` to validate Astro components and Content Collections Zod schemas.

### What Runs on GitHub Actions CI (Remote):

In `.github/workflows/deploy-github-pages.yml`, the workflow runs:

```bash
npm run validate
```

If an external tool (such as Pages CMS) creates a commit directly on GitHub that violates YAML syntax, breaks JSON formatting, or misses required frontmatter fields, **the CI build fails immediately and blocks deployment**, keeping your live site safe.

### Manual Commands:

```bash
# Validate everything (YAML, JSON, Astro/TypeScript)
npm run validate

# Validate only YAML files (.pages.yml, workflows)
npm run validate:yaml

# Validate only JSON data files
npm run validate:json

# Validate Astro components and collections schema
npm run check
```

---

## Alternative: Option A (Python `pre-commit` Framework)

If you ever wish to transition to the Python-based `pre-commit` framework (utilizing [pre-commit-hooks](https://github.com/pre-commit/pre-commit-hooks)), follow these steps:

### 1. Install `pre-commit` on your machine:

```bash
brew install pre-commit
# or: pip install pre-commit
```

### 2. Create `.pre-commit-config.yaml` in the repo root:

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: check-yaml
        args: ["--unsafe"]
      - id: check-json
      - id: check-case-conflict
      - id: check-merge-conflict
      - id: end-of-file-fixer
      - id: trailing-whitespace
      - id: check-symlinks
      - id: check-added-large-files
        args: ["--maxkb=1024"]
      - id: detect-private-key

  - repo: local
    hooks:
      - id: astro-check
        name: astro content & type check
        entry: npm run check
        language: system
        pass_filenames: false
      - id: yaml-lint
        name: yaml validator
        entry: node scripts/validate-yaml.mjs
        language: system
        pass_filenames: false
```

### 3. Install the hooks:

```bash
pre-commit install
```

### 4. Update GitHub Actions (`deploy-github-pages.yml`):

Replace `npm run validate` with:

```yaml
- name: Setup Python
  uses: actions/setup-python@v5
  with:
    python-version: "3.12"

- name: Run pre-commit hooks
  uses: pre-commit/action@v3.0.1
```
