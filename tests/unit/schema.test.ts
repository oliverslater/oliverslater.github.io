import { describe, it, expect } from "vitest";
import {
  getCanonicalSiteUrl,
  getPersonSameAs,
  getPersonSchema,
  getProfilePageSchema,
  getTechArticleSchema,
  getBlogIndexSchema,
  getContactPageSchema,
} from "../../src/utils/schema";

describe("schema utils", () => {
  describe("getCanonicalSiteUrl", () => {
    it("strips trailing slashes from URL string or URL object", () => {
      expect(getCanonicalSiteUrl("https://example.com/")).toBe(
        "https://example.com",
      );
      expect(getCanonicalSiteUrl(new URL("https://example.com///"))).toBe(
        "https://example.com",
      );
    });

    it("falls back to profileData.website if no parameter provided", () => {
      const url = getCanonicalSiteUrl();
      expect(url).toMatch(/^https?:\/\//);
      expect(url.endsWith("/")).toBe(false);
    });
  });

  describe("getPersonSameAs", () => {
    it("returns array of non-empty authoritative URLs", () => {
      const sameAs = getPersonSameAs();
      expect(Array.isArray(sameAs)).toBe(true);
      expect(sameAs.length).toBeGreaterThan(0);
      sameAs.forEach((link) => {
        expect(link).toMatch(/^https?:\/\//);
      });
    });
  });

  describe("getPersonSchema", () => {
    it("generates Schema.org Person entity with credentials, worksFor, and knowsAbout", () => {
      const schema = getPersonSchema("https://oliverslater.dev");
      expect(schema["@type"]).toBe("Person");
      expect(schema["@id"]).toBe("https://oliverslater.dev/#person");
      expect(schema.name).toBeDefined();
      expect(schema.jobTitle).toBeDefined();
      expect(schema.sameAs).toBeDefined();
      expect(Array.isArray(schema.knowsAbout)).toBe(true);
      expect(schema.worksFor).toBeDefined();
    });

    it("handles multiple active roles properly in worksFor array", async () => {
      const { vi } = await import("vitest");
      vi.resetModules();

      vi.doMock("../../src/data/siteData", async (importOriginal) => {
        const original: any = await importOriginal();
        return {
          ...original,
          experienceData: {
            roles: [
              { company: "Company A", current: true },
              { company: "Company B", endDate: "present" },
            ],
          },
        };
      });

      const { getPersonSchema: getMockedPerson } =
        await import("../../src/utils/schema");
      const person = getMockedPerson("https://oliverslater.dev");
      expect(Array.isArray(person.worksFor)).toBe(true);
      expect(person.worksFor).toHaveLength(2);

      vi.doUnmock("../../src/data/siteData");
      vi.resetModules();
    });
  });

  describe("getProfilePageSchema", () => {
    it("generates ProfilePage graph with WebSite, Breadcrumbs, and Person entities", () => {
      const graph = getProfilePageSchema({
        path: "/cv",
        name: "Curriculum Vitae",
        siteUrl: "https://oliverslater.dev",
      });

      expect(graph["@context"]).toBe("https://schema.org");
      expect(Array.isArray(graph["@graph"])).toBe(true);

      const profilePage = graph["@graph"].find(
        (node: any) => node["@type"] === "ProfilePage",
      );
      expect(profilePage).toBeDefined();
      expect(profilePage?.url).toBe("https://oliverslater.dev/cv/");
    });

    it("omits breadcrumb on root path", () => {
      const graph = getProfilePageSchema({
        path: "/",
        name: "Home",
        siteUrl: "https://oliverslater.dev",
      });

      const breadcrumb = graph["@graph"].find(
        (node: any) => node["@type"] === "BreadcrumbList",
      );
      expect(breadcrumb).toBeUndefined();
    });

    it("handles custom description and paths without leading/trailing slashes", () => {
      const graph = getProfilePageSchema({
        path: "about",
        name: "About Oliver",
        description: "Custom about description for SEO testing",
        siteUrl: "https://oliverslater.dev",
      });

      const profilePage = graph["@graph"].find(
        (node: any) => node["@type"] === "ProfilePage",
      ) as any;
      expect(profilePage?.url).toBe("https://oliverslater.dev/about/");
      expect(profilePage?.isPartOf?.description).toBe(
        "Custom about description for SEO testing",
      );
    });
  });

  describe("getTechArticleSchema", () => {
    it("generates TechArticle graph with author, publisher, and keywords", () => {
      const graph = getTechArticleSchema({
        title: "Testing Architecture with Vitest",
        description: "A comprehensive guide to Vitest component testing",
        url: "https://oliverslater.dev/blog/2026/09/vitest-testing",
        image: "https://oliverslater.dev/og.png",
        pubDate: "2026-09-15T10:00:00Z",
        updatedDate: "2026-09-20T12:00:00Z",
        wordCount: 1500,
        timeRequired: "PT8M",
        categories: ["Testing", "TypeScript"],
        tags: ["vitest", "ci"],
        siteUrl: "https://oliverslater.dev",
      });

      expect(graph["@context"]).toBe("https://schema.org");
      const article: any = graph["@graph"].find(
        (node: any) =>
          node["@type"] === "TechArticle" ||
          (Array.isArray(node["@type"]) &&
            node["@type"].includes("TechArticle")),
      );
      expect(article).toBeDefined();
      expect(article?.headline).toBe("Testing Architecture with Vitest");
      expect(article?.author["@id"]).toBe("https://oliverslater.dev/#person");
      expect(article?.wordCount).toBe(1500);
      expect(article?.timeRequired).toBe("PT8M");
      expect(article?.dateModified).toContain("2026-09-20");
    });

    it("generates TechArticle with default modified date and without optional metadata", () => {
      const graph = getTechArticleSchema({
        title: "Minimal Article",
        description: "Minimal desc",
        url: "https://oliverslater.dev/blog/2026/09/minimal/",
        image: "https://oliverslater.dev/minimal.png",
        pubDate: "2026-09-01T10:00:00Z",
        siteUrl: "https://oliverslater.dev",
      });

      const article: any = graph["@graph"].find(
        (node: any) =>
          node["@type"] === "TechArticle" ||
          (Array.isArray(node["@type"]) &&
            node["@type"].includes("TechArticle")),
      );
      expect(article).toBeDefined();
      expect(article?.wordCount).toBeUndefined();
      expect(article?.timeRequired).toBeUndefined();
      expect(article?.articleSection).toBeUndefined();
      expect(article?.dateModified).toContain("2026-09-01");
    });
  });

  describe("getBlogIndexSchema", () => {
    it("generates CollectionPage and Blog schemas", () => {
      const graph = getBlogIndexSchema({
        siteUrl: "https://oliverslater.dev",
        posts: [
          {
            title: "Post 1",
            url: "https://oliverslater.dev/blog/2026/09/post-1",
            date: "2026-09-01",
          },
        ],
      });

      const blog: any = graph["@graph"].find(
        (node: any) => node["@type"] === "Blog",
      );
      expect(blog).toBeDefined();
      expect(blog?.url).toBe("https://oliverslater.dev/blog/");
      expect(Array.isArray(blog?.blogPost)).toBe(true);
      expect(blog?.blogPost.length).toBe(1);
    });

    it("handles default options without posts", () => {
      const graph = getBlogIndexSchema();
      expect(graph["@graph"]).toBeDefined();
    });
  });

  describe("getContactPageSchema", () => {
    it("generates ContactPage schema with breadcrumbs", () => {
      const graph = getContactPageSchema({
        siteUrl: "https://oliverslater.dev",
      });

      const contact = graph["@graph"].find(
        (node: any) => node["@type"] === "ContactPage",
      );
      expect(contact).toBeDefined();
      expect(contact?.url).toBe("https://oliverslater.dev/contact/");
    });

    it("handles default options without parameter", () => {
      const graph = getContactPageSchema();
      expect(graph["@graph"]).toBeDefined();
    });
  });
});
