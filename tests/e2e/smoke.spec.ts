import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("homepage loads successfully without console errors", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    // Verify main landmarks and title
    await expect(page).toHaveTitle(/Oliver Slater/i);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("nav#main-nav")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();

    // Verify no unexpected JavaScript uncaught runtime errors occurred
    expect(consoleErrors).toHaveLength(0);
  });

  test("CV page loads and renders profile info", async ({ page }) => {
    const response = await page.goto("/cv");
    expect(response?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByText(/Oliver Slater/i).first()).toBeVisible();
  });

  test("Blog page loads and lists posts", async ({ page }) => {
    const response = await page.goto("/blog");
    expect(response?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
    const articles = page.locator("article");
    const count = await articles.count();
    expect(count).toBeGreaterThan(0);
  });
});
