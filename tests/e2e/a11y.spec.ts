import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility (A11y) Audits", () => {
  const routes = ["/", "/cv", "/blog", "/contact"];

  for (const route of routes) {
    test(`route ${route} should not have any automatically detectable accessibility violations`, async ({
      page,
    }) => {
      await page.goto(route);

      // Analyze page accessibility - focusing on structural, keyboard navigation, and ARIA landmarks
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        // colour-contrast is disabled: axe-core cannot reliably resolve CSS custom-
        // property colour values at runtime in a headless context, producing false
        // positives on the site's Tailwind-based theming. Colour contrast is verified
        // manually against the design system palette.
        .disableRules(["color-contrast"])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }
});
