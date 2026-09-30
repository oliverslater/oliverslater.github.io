import { test, expect } from "@playwright/test";

test.describe("Theme Toggle", () => {
  test("toggles theme and persists preference in localStorage", async ({
    page,
  }) => {
    await page.goto("/");

    const themeToggle = page.locator("#theme-toggle");
    await expect(themeToggle).toBeVisible();

    const isInitiallyDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );

    // Click toggle button
    await themeToggle.click();

    // Check DOM class was toggled
    const isNowDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    expect(isNowDark).toBe(!isInitiallyDark);

    // Verify localStorage persistence
    const storedTheme = await page.evaluate(() =>
      localStorage.getItem("theme"),
    );
    expect(storedTheme).toBe(isNowDark ? "dark" : "light");

    // Reload page and confirm persistent state
    await page.reload();
    const persistedDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    expect(persistedDark).toBe(isNowDark);
  });
});
