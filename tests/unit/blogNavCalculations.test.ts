import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  setupTableOfContents,
  setupReadingProgress,
} from "../../src/scripts/blog-enhancements";

describe("TableOfContents & ReadingProgressBar calculation utilities", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="reading-progress" style="width: 0%;"></div>
      <aside>
        <a href="#section-1" class="toc-link">Section 1</a>
        <a href="#section-2" class="toc-link">Section 2</a>
      </aside>
      <article>
        <h2 id="section-1">Section 1</h2>
        <p>Paragraph content for section 1...</p>
        <h3 id="section-2">Section 2</h3>
        <p>Paragraph content for section 2...</p>
      </article>
    `;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("setupTableOfContents", () => {
    it("injects permalink anchors and observes headings with IntersectionObserver", () => {
      let observedElements: Element[] = [];
      let observerCallback: (entries: any[]) => void = () => {};

      class MockIntersectionObserver {
        constructor(cb: any) {
          observerCallback = cb;
        }
        observe(el: Element) {
          observedElements.push(el);
        }
        disconnect = vi.fn();
        unobserve = vi.fn();
      }
      vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

      setupTableOfContents();

      // Heading anchors injected
      const anchors = document.querySelectorAll(".heading-anchor");
      expect(anchors.length).toBe(2);
      expect(anchors[0].getAttribute("href")).toBe("#section-1");

      // Headings observed
      expect(observedElements.length).toBe(2);

      // Trigger intersection with top heading
      observerCallback([
        {
          isIntersecting: true,
          target: { id: "section-2" },
          boundingClientRect: { top: 120 },
        },
      ]);

      const link2 = document.querySelector('a[href="#section-2"]');
      expect(link2?.classList.contains("active")).toBe(true);

      vi.unstubAllGlobals();
    });
  });

  describe("setupReadingProgress", () => {
    it("calculates scroll percentage and pins progress bar accurately", () => {
      const progressBar = document.getElementById(
        "reading-progress",
      ) as HTMLElement;
      const article = document.querySelector("article") as HTMLElement;

      // Mock getBoundingClientRect: if articleTop is 0 and scrollY is 500, then top in viewport is -500
      article.getBoundingClientRect = vi.fn().mockReturnValue({
        top: -500,
        height: 2000,
      });

      Object.defineProperty(window, "scrollY", {
        value: 1000,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, "innerHeight", {
        value: 1000,
        writable: true,
        configurable: true,
      });

      // Mock requestAnimationFrame to run synchronously
      vi.stubGlobal("requestAnimationFrame", (cb: Function) => cb());

      setupReadingProgress();

      // articleTop = window.scrollY + articleRect.top = 1000 + (-500) = 500
      // scrollableDistance = 2000 - 1000 = 1000
      // currentProgress = window.scrollY - articleTop = 1000 - 500 = 500
      // percent = (500 / 1000) * 100 = 50%
      expect(progressBar.style.width).toBe("50%");

      vi.unstubAllGlobals();
    });

    it("caps reading progress at 100% when article height is fully traversed", () => {
      const progressBar = document.getElementById(
        "reading-progress",
      ) as HTMLElement;
      const article = document.querySelector("article") as HTMLElement;

      article.getBoundingClientRect = vi.fn().mockReturnValue({
        top: -1500,
        height: 2000,
      });

      Object.defineProperty(window, "scrollY", {
        value: 1500,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, "innerHeight", {
        value: 1000,
        writable: true,
        configurable: true,
      });

      vi.stubGlobal("requestAnimationFrame", (cb: Function) => cb());

      setupReadingProgress();

      // scrollableDistance = 1000; currentProgress = 1500 - (-1500 + 1500) = 1500 -> capped at 100%
      expect(progressBar.style.width).toBe("100%");

      vi.unstubAllGlobals();
    });
  });
});
