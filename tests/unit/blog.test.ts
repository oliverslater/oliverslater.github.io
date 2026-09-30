import { describe, it, expect } from "vitest";
import { getBlogUrl, isPostPublished } from "../../src/utils/blog";

describe("blog utils", () => {
  describe("getBlogUrl", () => {
    it("generates canonical /blog/YYYY/MM/slug format", () => {
      const post = {
        id: "architecting-cloud-platform",
        data: {
          pubDate: new Date("2026-09-15T10:00:00Z"),
        },
      };

      expect(getBlogUrl(post)).toBe(
        "/blog/2026/09/architecting-cloud-platform",
      );
    });
  });

  describe("isPostPublished", () => {
    it("strictly hides drafts in production", () => {
      const draftPost = {
        id: "draft-post",
        data: {
          pubDate: new Date(Date.now() - 10000),
          draft: true,
        },
      };

      expect(isPostPublished(draftPost, false)).toBe(false);
    });

    it("strictly hides future dated posts in production", () => {
      const futurePost = {
        id: "future-post",
        data: {
          pubDate: new Date(Date.now() + 1000000),
          draft: false,
        },
      };

      expect(isPostPublished(futurePost, false)).toBe(false);
    });

    it("permits past non-draft posts in production", () => {
      const livePost = {
        id: "live-post",
        data: {
          pubDate: new Date(Date.now() - 100000),
          draft: false,
        },
      };

      expect(isPostPublished(livePost, false)).toBe(true);
    });
  });
});
