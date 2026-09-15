/**
 * blog-enhancements.ts
 *
 * Enterprise-grade client-side enhancements for Astro blog articles:
 * 1. Syntax highlighting code copy engine with visual feedback
 * 2. Asynchronous, lazy-loaded Mermaid.js diagram engine with site token parity and theme switching
 * 3. Table of Contents active heading tracking with IntersectionObserver & permalink anchor injection
 * 4. Reading progress indicator pinned to viewport top
 */

// Icons as SVG strings
const COPY_ICON = `<svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>`;
const CHECK_ICON = `<svg class="w-3.5 h-3.5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`;

/* -------------------------------------------------------------------------- */
/* 1. Code Copy Engine                                                        */
/* -------------------------------------------------------------------------- */
export function setupCodeCopyButtons() {
  const codeBlocks = document.querySelectorAll<HTMLElement>(
    "article .prose pre:not(.mermaid), article pre.astro-code",
  );

  codeBlocks.forEach((pre) => {
    // Skip if already initialized or if this is a mermaid diagram fence
    if (
      pre.dataset.copyInitialized === "true" ||
      pre.classList.contains("mermaid") ||
      pre.dataset.language === "mermaid"
    ) {
      return;
    }

    // Wrap in a relative container if not already wrapped
    let wrapper = pre.parentElement;
    if (!wrapper?.classList.contains("code-block-wrapper")) {
      wrapper = document.createElement("div");
      wrapper.className = "code-block-wrapper group";
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
    }

    // Create the copy button
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-code-btn";
    btn.setAttribute("aria-label", "Copy code to clipboard");
    btn.innerHTML = `${COPY_ICON}<span>Copy</span>`;

    let resetTimer: ReturnType<typeof setTimeout> | null = null;

    btn.addEventListener("click", async () => {
      const codeEl = pre.querySelector("code");
      const textToCopy = (codeEl ? codeEl.innerText : pre.innerText).trimEnd();

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(textToCopy);
        } else {
          // Fallback for non-secure contexts
          const textarea = document.createElement("textarea");
          textarea.value = textToCopy;
          textarea.style.position = "fixed";
          textarea.style.left = "-999999px";
          textarea.style.top = "-999999px";
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          // Fallback copy for legacy/non-secure contexts
          try {
            (document as any).execCommand("copy");
          } catch {}
          document.body.removeChild(textarea);
        }

        // Visual confirmation feedback
        btn.classList.add("copied");
        btn.setAttribute("aria-label", "Code copied to clipboard");
        btn.innerHTML = `${CHECK_ICON}<span>Copied!</span>`;

        if (resetTimer) clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          btn.classList.remove("copied");
          btn.setAttribute("aria-label", "Copy code to clipboard");
          btn.innerHTML = `${COPY_ICON}<span>Copy</span>`;
        }, 2000);
      } catch (err) {
        console.error("Failed to copy code snippet:", err);
      }
    });

    wrapper.appendChild(btn);
    pre.dataset.copyInitialized = "true";
  });
}

/* -------------------------------------------------------------------------- */
/* 2. Dynamic Architectural Diagrams (Mermaid.js Integration)                 */
/* -------------------------------------------------------------------------- */
let mermaidInstance: any = null;
let diagramCounter = 0;

function getMermaidThemeOptions(isDark: boolean) {
  const root = document.documentElement;
  const styles = getComputedStyle(root);

  // Dynamically resolve design tokens from active CSS variables
  const secColor =
    styles.getPropertyValue("--sec").trim() || (isDark ? "#a476ff" : "#7938ec");
  const textColor =
    styles.getPropertyValue("--white").trim() ||
    (isDark ? "#dfdfdf" : "#121214");
  const bgColor =
    styles.getPropertyValue("--component-bg").trim() ||
    (isDark ? "#141414" : "#ffffff");
  const containerColor =
    styles.getPropertyValue("--container").trim() ||
    (isDark ? "#1a1a1a" : "#f0f0f2");
  const borderTr =
    styles.getPropertyValue("--white-icon-tr").trim() ||
    (isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)");
  const fontFamily =
    styles.getPropertyValue("--font-sans").trim() ||
    '"Montserrat Variable", Montserrat, -apple-system, sans-serif';

  const nodeBkg = isDark ? "#221c35" : "#f3e8ff";

  return {
    theme: "base",
    themeVariables: {
      fontFamily,
      fontSize: "14px",
      darkMode: isDark,
      background: bgColor,
      mainBkg: bgColor,
      primaryColor: nodeBkg,
      primaryTextColor: textColor,
      primaryBorderColor: secColor,
      lineColor: secColor,
      secondaryColor: containerColor,
      tertiaryColor: bgColor,
      nodeBorder: secColor,
      clusterBkg: containerColor,
      clusterBorder: borderTr,
      titleColor: textColor,
      edgeLabelBackground: bgColor,
      actorBkg: nodeBkg,
      actorBorder: secColor,
      actorTextColor: textColor,
      actorLineColor: secColor,
    },
  };
}

async function renderMermaidDiagrams() {
  const isDark = document.documentElement.classList.contains("dark");
  const options = getMermaidThemeOptions(isDark);

  mermaidInstance.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    ...options,
  });

  const containers = document.querySelectorAll<HTMLElement>(
    ".mermaid-container[data-mermaid-src]",
  );

  for (const container of Array.from(containers)) {
    const rawCode = container.dataset.mermaidSrc;
    if (!rawCode) continue;

    diagramCounter++;
    const renderId = `mermaid-svg-${diagramCounter}-${Date.now()}`;

    try {
      const { svg } = await mermaidInstance.render(renderId, rawCode);
      container.innerHTML = svg;
      container.classList.remove("loading");
    } catch (err) {
      console.error("Mermaid rendering error:", err);
      container.innerHTML = `<div class="text-xs font-mono text-rose-400 p-4 text-left border border-rose-500/20 rounded-lg">Mermaid render error: Diagram syntax could not be parsed.</div>`;
    }
  }
}

export async function setupMermaidDiagrams() {
  // Query all potential mermaid code fences
  const mermaidFences = document.querySelectorAll<HTMLElement>(
    'article pre[data-language="mermaid"], article pre.mermaid, article code.language-mermaid, article .mermaid',
  );

  if (mermaidFences.length === 0) {
    return; // Zero performance hit on non-mermaid articles
  }

  // Convert raw code fences into styled diagram containers
  mermaidFences.forEach((fence) => {
    if (fence.dataset.mermaidProcessed === "true") return;

    // Handle code nested in pre
    const targetPre = fence.tagName === "CODE" ? fence.closest("pre") : fence;
    const rawCode = (fence.textContent || "").trim();

    if (!rawCode) return;

    const container = document.createElement("div");
    container.className = "mermaid-container loading";
    container.dataset.mermaidSrc = rawCode;
    container.setAttribute("role", "figure");
    container.setAttribute("aria-label", "Architecture Diagram");
    container.innerHTML = `<span class="opacity-60 font-mono text-xs">Rendering architectural diagram...</span>`;

    if (targetPre && targetPre.parentNode) {
      targetPre.parentNode.replaceChild(container, targetPre);
    } else if (fence.parentNode) {
      fence.parentNode.replaceChild(container, fence);
    }

    fence.dataset.mermaidProcessed = "true";
  });

  // Lazy-load Mermaid bundle
  if (!mermaidInstance) {
    try {
      const mod = await import("mermaid");
      mermaidInstance = mod.default || mod;
    } catch (err) {
      console.error("Failed to load Mermaid.js:", err);
      return;
    }
  }

  // Initial render
  await renderMermaidDiagrams();

  // Re-render when theme changes between dark and light
  const themeObserver = new MutationObserver(() => {
    renderMermaidDiagrams();
  });

  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
}

/* -------------------------------------------------------------------------- */
/* 3. Table of Contents, Anchor Links & Active IntersectionObserver           */
/* -------------------------------------------------------------------------- */
export function setupTableOfContents() {
  const article = document.querySelector("article");
  if (!article) return;

  const headings = article.querySelectorAll<HTMLElement>("h2, h3");
  if (headings.length === 0) return;

  // Ensure all headings have IDs and add permalink anchors
  headings.forEach((heading) => {
    if (!heading.id) {
      const slug =
        heading.textContent
          ?.trim()
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "") ||
        `section-${Math.random().toString(36).substring(2, 8)}`;
      heading.id = slug;
    }

    // Inject anchor link if not already present
    if (!heading.querySelector(".heading-anchor")) {
      const anchor = document.createElement("a");
      anchor.href = `#${heading.id}`;
      anchor.className = "heading-anchor";
      anchor.setAttribute(
        "aria-label",
        `Link to ${heading.textContent?.trim()}`,
      );
      anchor.textContent = "#";
      heading.appendChild(anchor);
    }
  });

  // Track active heading with IntersectionObserver
  const tocLinks = document.querySelectorAll<HTMLAnchorElement>(".toc-link");
  if (tocLinks.length === 0) return;

  const linkMap = new Map<string, HTMLAnchorElement>();
  tocLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (href?.startsWith("#")) {
      linkMap.set(href.slice(1), link);
    }
  });

  let activeHeadingId: string | null = null;

  const observer = new IntersectionObserver(
    (entries) => {
      // Find the top-most visible heading
      const visibleEntries = entries.filter((e) => e.isIntersecting);
      if (visibleEntries.length > 0) {
        // Sort by distance from viewport top
        visibleEntries.sort(
          (a, b) =>
            Math.abs(a.boundingClientRect.top) -
            Math.abs(b.boundingClientRect.top),
        );
        const topEntry = visibleEntries[0];
        activeHeadingId = topEntry.target.id;
      }

      if (activeHeadingId) {
        tocLinks.forEach((l) => l.classList.remove("active"));
        const activeLink = linkMap.get(activeHeadingId);
        if (activeLink) {
          activeLink.classList.add("active");
        }
      }
    },
    {
      rootMargin: "-100px 0px -66% 0px",
      threshold: [0, 0.5, 1],
    },
  );

  headings.forEach((heading) => observer.observe(heading));
}

/* -------------------------------------------------------------------------- */
/* 4. Reading Progress Bar                                                    */
/* -------------------------------------------------------------------------- */
export function setupReadingProgress() {
  const progressBar = document.getElementById("reading-progress");
  const article = document.querySelector("article");

  if (!progressBar || !article) return;

  let ticking = false;

  const updateProgress = () => {
    const articleRect = article.getBoundingClientRect();
    const articleTop = window.scrollY + articleRect.top;
    const articleHeight = articleRect.height;
    const windowHeight = window.innerHeight;

    const scrollableDistance = articleHeight - windowHeight;
    if (scrollableDistance <= 0) {
      progressBar.style.width = "100%";
      ticking = false;
      return;
    }

    const currentProgress = window.scrollY - articleTop;
    const percent = Math.min(
      100,
      Math.max(0, (currentProgress / scrollableDistance) * 100),
    );

    progressBar.style.width = `${percent}%`;
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    },
    { passive: true },
  );

  updateProgress();
}

/* -------------------------------------------------------------------------- */
/* Main Initializer                                                           */
/* -------------------------------------------------------------------------- */
export function initBlogArticleEnhancements() {
  setupCodeCopyButtons();
  setupMermaidDiagrams();
  setupTableOfContents();
  setupReadingProgress();
}

// Auto-run when DOM is ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBlogArticleEnhancements);
  } else {
    initBlogArticleEnhancements();
  }

  // Support Astro view transitions / client navigations
  document.addEventListener("astro:page-load", initBlogArticleEnhancements);
}
