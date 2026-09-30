import { test, expect } from "@playwright/test";

test.describe("Search & Interactive Skills Filter Keyboard Accessibility", () => {
  test("allows keyboard navigation (Tab, Enter) through capability pillars", async ({
    page,
  }) => {
    await page.goto("/");

    // Locate the first pillar button and ensure it is scrolled into view for hydration
    const firstPillarBtn = page.locator('button[id^="pillar-btn-"]').first();
    await firstPillarBtn.scrollIntoViewIfNeeded();
    await expect(firstPillarBtn).toBeVisible();

    // Ensure the Astro island is fully hydrated before keyboard interaction
    await page
      .locator("astro-island:has(button[id^='pillar-btn-']):not([ssr])")
      .waitFor();

    // Focus first button via keyboard or direct focus
    await firstPillarBtn.focus();
    await expect(firstPillarBtn).toBeFocused();

    // Tab to next pillar button
    await page.keyboard.press("Tab");
    const secondPillarBtn = page.locator('button[id^="pillar-btn-"]').nth(1);
    await expect(secondPillarBtn).toBeFocused();

    // Toggle expansion via keyboard Enter and wait for the DOM to update
    await expect(secondPillarBtn).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Enter");

    await expect(secondPillarBtn).toHaveAttribute("aria-expanded", "true");

    // Verify associated panel exists and corresponds to aria-controls
    const controlsPanelId = await secondPillarBtn.getAttribute("aria-controls");
    expect(controlsPanelId).toBeTruthy();
    await expect(page.locator(`#${controlsPanelId}`)).toBeVisible();
  });

  test("allows keyboard navigation through blog search input", async ({
    page,
  }) => {
    await page.goto("/blog");

    const searchInput = page.locator(
      'input[type="search"], input[name="q"], #blog-search',
    );
    if ((await searchInput.count()) > 0) {
      await searchInput.focus();
      await expect(searchInput).toBeFocused();
      await page.keyboard.type("cloud");
      await page.keyboard.press("Enter");
      await expect(page.locator("main")).toBeVisible();
    }
  });
});
