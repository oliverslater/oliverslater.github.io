import { test, expect } from "@playwright/test";

test.describe("CV Download & Asset Verification", () => {
  test("direct CV PDF download link returns 200 OK and valid application/pdf MIME type", async ({
    page,
    request,
  }) => {
    await page.goto("/cv");

    // Locate the direct download link
    const downloadLink = page.locator('a[download][href*=".pdf"]');
    await expect(downloadLink).toBeVisible();

    const pdfHref = await downloadLink.getAttribute("href");
    expect(pdfHref).toBeTruthy();

    // Verify endpoint returns HTTP 200 with application/pdf header
    const response = await request.get(pdfHref!);
    expect(response.status()).toBe(200);

    const contentType = response.headers()["content-type"];
    expect(contentType).toMatch(/application\/pdf/i);
  });
});
