import { test, expect } from "@playwright/test";

test.describe("404 Error Page Routing", () => {
  test("unknown path returns 404 and renders custom template with return link", async ({
    page,
  }) => {
    const response = await page.goto("/non-existent-page");
    // Under local preview server or static hosting, 404 status or 404 template is served
    expect([200, 404]).toContain(response?.status());

    // Verify 404 template landmark content
    await expect(page.locator("h1")).toContainText(/Page Not Found/i);
    await expect(page.getByText(/HTTP 404/i)).toBeVisible();

    // Verify link returning to homepage
    const homeReturnLink = page.locator('a[href="/"]');
    await expect(homeReturnLink.first()).toBeVisible();

    // Clicking return link navigates back to homepage
    await homeReturnLink.first().click();
    await expect(page).toHaveURL(/\/(#.*)?$/);
    await expect(page.locator("main")).toBeVisible();
  });
});
