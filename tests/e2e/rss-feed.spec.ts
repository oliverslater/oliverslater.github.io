import { test, expect } from "@playwright/test";

test.describe("RSS / Atom Feed Endpoints", () => {
  const feedPaths = [
    { name: "RSS feed (/blog/rss.xml)", path: "/blog/rss.xml" },
    { name: "Atom feed (/blog/feed.xml)", path: "/blog/feed.xml" },
  ];

  for (const { name, path } of feedPaths) {
    test(`${name} returns 200 with valid XML and required RSS elements`, async ({
      request,
    }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(200);

      const contentType = response.headers()["content-type"] ?? "";
      // Accept both application/xml and application/rss+xml content types
      expect(contentType).toMatch(/xml/i);

      const body = await response.text();

      // Must be non-empty XML
      expect(body.trim()).not.toBe("");
      expect(body).toMatch(/<\?xml/i);

      // Must contain required RSS 2.0 / Atom channel elements
      expect(body).toMatch(/<channel|<feed/i);
      expect(body).toMatch(/<title>/i);
      expect(body).toMatch(/<link/i);
    });
  }
});
