## Description

Provide a clear and concise summary of the changes made, the rationale behind them, and any relevant context.

## Type of Change

- [ ] `feat`: New feature or content addition (e.g. blog post, UI component)
- [ ] `fix`: Bug fix or content correction
- [ ] `refactor`: Code or content refactoring without behavior change
- [ ] `perf`: Performance enhancement or optimization
- [ ] `chore`: Tooling, dependency, or configuration update
- [ ] `docs`: Documentation update

## Quality & Pre-Flight Checklist

Before submitting, confirm that the changes pass all repository quality gates:

- [ ] **Tests**: `npm test` runs and all unit tests pass.
- [ ] **Formatting**: Code adheres to Prettier formatting (`npm run format:check`).
- [ ] **Validation**: `npm run validate` passes with zero errors:
  - [ ] YAML & JSON schema checks pass
  - [ ] Markdown linting (`npm run lint:md`) passes
  - [ ] Spelling audit (`npm run lint:spelling`) passes
  - [ ] File hygiene and secrets detection passes
  - [ ] License check (`npm run licenses:check`) passes
  - [ ] Astro type check (`npm run check`) passes
- [ ] **Build Integrity**: Static export builds cleanly (`npm run build`).
- [ ] **Link Verification**: HTML & broken link checker passes (`npm run check:links`).

## Additional Context / Visual Confirmation

Add any screenshots, Lighthouse scores, or references here if applicable.
