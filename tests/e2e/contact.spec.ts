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

  test("diverts bot submission to thank-you page when honeypot is checked", async ({
    page,
  }) => {
    await page.goto("/contact");

    // Fill in valid data
    await page.fill("#contact-name", "Automated Bot");
    await page.fill("#contact-email", "bot@automated-spam.com");
    await page.fill("#contact-message", "Buy cheap generic medication online");

    // Target honeypot input (checkbox named botcheck, visually hidden)
    const honeypot = page.locator("#contact-botcheck");
    await honeypot.evaluate((el: HTMLInputElement) => {
      el.checked = true;
    });

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Browser should be diverted directly to /thank-you
    await expect(page).toHaveURL(/\/thank-you\/?/);
    await expect(page.locator("main")).toBeVisible();
  });
});
