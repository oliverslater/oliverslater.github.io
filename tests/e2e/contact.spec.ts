import { test, expect } from "@playwright/test";

test.describe("Contact Form Interaction", () => {
  test("shows validation errors when submitting empty required fields", async ({
    page,
  }) => {
    await page.goto("/contact");

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();

    // Attempt to submit empty form
    await submitBtn.click();

    // Name and email error alerts should become visible
    const nameError = page.locator("#contact-name-error");
    const emailError = page.locator("#contact-email-error");
    const messageError = page.locator("#contact-message-error");

    await expect(nameError).toBeVisible();
    await expect(emailError).toBeVisible();
    await expect(messageError).toBeVisible();
  });
});
