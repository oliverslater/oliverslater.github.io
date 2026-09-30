import { test, expect } from "@playwright/test";

test.describe("Responsive Viewport & Navigation Tests", () => {
  const viewports = [
    { name: "iPhone SE (375x667)", width: 375, height: 667 },
    { name: "iPhone XR / 11 (414x896)", width: 414, height: 896 },
    { name: "iPad Mini (768x1024)", width: 768, height: 1024 },
  ];

  for (const vp of viewports) {
    test(`renders floating navigation menu properly on ${vp.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");

      const nav = page.locator("nav#main-nav");
      await expect(nav).toBeVisible();

      // Navigation links remain visible and accessible in the floating pill
      const homeLink = nav.getByRole("link", { name: "Home", exact: true });
      const cvLink = nav.getByRole("link", { name: "CV", exact: true });
      const blogLink = nav.getByRole("link", { name: "Blog", exact: true });
      const contactLink = nav.getByRole("link", {
        name: "Contact",
        exact: true,
      });

      await expect(homeLink).toBeVisible();
      await expect(cvLink).toBeVisible();
      await expect(blogLink).toBeVisible();
      await expect(contactLink).toBeVisible();

      // Navigate to CV from mobile nav
      await cvLink.click();
      await expect(page).toHaveURL(/\/cv\/?/);
      await expect(page.locator("main")).toBeVisible();
    });
  }
});
