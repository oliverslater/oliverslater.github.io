/**
 * blog-enhancements.ts
 *
 * Enterprise-grade client-side enhancements for Astro blog articles:
 * 1. Accessible WAI-ARIA tabbed code blocks
 * 2. Syntax highlighting code copy engine with visual feedback
 * 3. Asynchronous, lazy-loaded Mermaid.js diagram engine with site token parity and theme switching
 * 4. Architecture Diagram Lightbox with full-screen, drag-to-pan, and wheel zoom controls
 * 5. Table of Contents active heading tracking with IntersectionObserver & permalink anchor injection
 * 6. Reading progress indicator pinned to viewport top
 */

import { copyToClipboard } from "../utils/clipboard";

// Icons as SVG strings
const COPY_ICON = `<svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>`;
const CHECK_ICON = `<svg class="w-3.5 h-3.5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`;
const EXPAND_ICON = `<svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>`;

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

      const success = await copyToClipboard(textToCopy);
      if (success) {
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

  // Attach interactive pan-zoom lightbox triggers to rendered diagrams
  attachDiagramLightboxTriggers();
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
/* 5. Accessible WAI-ARIA Tabbed Code Blocks                                  */
/* -------------------------------------------------------------------------- */
const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  terraform: "Terraform",
  tf: "Terraform",
  typescript: "TypeScript",
  ts: "TypeScript",
  javascript: "JavaScript",
  js: "JavaScript",
  python: "Python",
  py: "Python",
  bash: "CLI",
  sh: "CLI",
  shell: "CLI",
  zsh: "CLI",
  yaml: "YAML",
  yml: "YAML",
  json: "JSON",
  dockerfile: "Dockerfile",
  docker: "Dockerfile",
  go: "Go",
  golang: "Go",
  rust: "Rust",
  rs: "Rust",
  html: "HTML",
  css: "CSS",
  sql: "SQL",
};

function formatLanguageName(lang: string): string {
  const normalised = lang.toLowerCase().trim();
  if (LANGUAGE_DISPLAY_NAMES[normalised]) {
    return LANGUAGE_DISPLAY_NAMES[normalised];
  }
  return normalised
    ? normalised.charAt(0).toUpperCase() + normalised.slice(1)
    : "Snippet";
}

function extractTabLabel(pre: HTMLElement): string {
  const codeEl = pre.querySelector("code");
  const fullText = (codeEl ? codeEl.innerText : pre.innerText).trimStart();
  const firstLine = fullText.split("\n")[0]?.trim() || "";
  const match = firstLine.match(
    /^(?:\/\/|#|\/\*)\s*tab:\s*([^*]+?)(?:\*\/)?$/i,
  );

  if (match) {
    const customTitle = match[1].trim();

    // Strip the comment line from the DOM
    if (codeEl) {
      const firstLineSpan = codeEl.querySelector(".line");
      if (firstLineSpan) {
        firstLineSpan.remove();
      } else {
        const lines = codeEl.innerHTML.split("\n");
        lines.shift();
        codeEl.innerHTML = lines.join("\n");
      }
    }
    return customTitle;
  }

  // Fallback to language data attribute or class
  const lang =
    pre.dataset.language || pre.className.match(/language-(\w+)/)?.[1] || "";
  return formatLanguageName(lang);
}

function buildTabGroup(
  container: HTMLElement,
  codeBlocks: HTMLElement[],
  groupId: string,
) {
  const tabsWrapper = document.createElement("div");
  tabsWrapper.className = "code-tabs-wrapper";

  const tabList = document.createElement("div");
  tabList.className = "code-tabs-header";
  tabList.setAttribute("role", "tablist");
  tabList.setAttribute("aria-label", "Code implementations");

  const buttons: HTMLButtonElement[] = [];
  const panels: HTMLElement[] = [];

  codeBlocks.forEach((pre, index) => {
    const tabTitle = extractTabLabel(pre);
    const tabId = `${groupId}-tab-${index}`;
    const panelId = `${groupId}-panel-${index}`;

    // Create accessible tab button
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = tabId;
    btn.className = "code-tab-button";
    btn.textContent = tabTitle;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-controls", panelId);
    btn.setAttribute("aria-selected", index === 0 ? "true" : "false");
    btn.tabIndex = index === 0 ? 0 : -1;

    // Create accessible tab panel
    const panel = document.createElement("div");
    panel.id = panelId;
    panel.className = "code-tab-panel";
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tabId);
    panel.tabIndex = 0;
    if (index !== 0) {
      panel.hidden = true;
    }

    panel.appendChild(pre);

    tabList.appendChild(btn);
    tabsWrapper.appendChild(panel);

    buttons.push(btn);
    panels.push(panel);
  });

  const activateTab = (targetIndex: number) => {
    buttons.forEach((btn, i) => {
      const isSelected = i === targetIndex;
      btn.setAttribute("aria-selected", isSelected ? "true" : "false");
      btn.tabIndex = isSelected ? 0 : -1;
      panels[i].hidden = !isSelected;
    });
    buttons[targetIndex].focus();
  };

  // Accessible keyboard navigation for tablist
  buttons.forEach((btn, index) => {
    btn.addEventListener("click", () => activateTab(index));

    btn.addEventListener("keydown", (e) => {
      let targetIndex = index;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        targetIndex = (index + 1) % buttons.length;
        activateTab(targetIndex);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        targetIndex = (index - 1 + buttons.length) % buttons.length;
        activateTab(targetIndex);
      } else if (e.key === "Home") {
        e.preventDefault();
        activateTab(0);
      } else if (e.key === "End") {
        e.preventDefault();
        activateTab(buttons.length - 1);
      }
    });
  });

  tabsWrapper.insertBefore(tabList, tabsWrapper.firstChild);
  container.parentNode?.replaceChild(tabsWrapper, container);
}

export function setupCodeTabs() {
  const article = document.querySelector("article");
  if (!article) return;

  // Pattern 1: Explicit <div class="code-tabs"> containers
  const tabContainers = article.querySelectorAll<HTMLElement>(".code-tabs");
  let groupCounter = 0;

  tabContainers.forEach((container) => {
    if (container.dataset.tabsInitialized === "true") return;

    const codeBlocks = Array.from(
      container.querySelectorAll<HTMLElement>(
        "pre:not(.mermaid), pre.astro-code",
      ),
    );

    if (codeBlocks.length === 0) return;

    buildTabGroup(container, codeBlocks, `tabs-explicit-${++groupCounter}`);
    container.dataset.tabsInitialized = "true";
  });

  // Pattern 2: Consecutive code blocks with tab hints (e.g. // tab: Terraform)
  const allPreElements = Array.from(
    article.querySelectorAll<HTMLElement>("pre:not(.mermaid), pre.astro-code"),
  );

  const consecutiveGroups: HTMLElement[][] = [];
  let currentGroup: HTMLElement[] = [];

  for (let i = 0; i < allPreElements.length; i++) {
    const pre = allPreElements[i];
    // Skip if already inside a tab container or already initialised
    if (pre.closest(".code-tabs") || pre.closest(".code-tabs-wrapper")) {
      if (currentGroup.length > 1) {
        consecutiveGroups.push([...currentGroup]);
      }
      currentGroup = [];
      continue;
    }

    const codeText = pre.innerText.trimStart();
    const firstLine = codeText.split("\n")[0]?.trim() || "";
    const hasTabHint = /^(?:\/\/|#|\/\*)\s*tab:\s*[^*]+?(?:\*\/)?$/i.test(
      firstLine,
    );

    if (hasTabHint) {
      currentGroup.push(pre);
    } else {
      if (currentGroup.length > 1) {
        consecutiveGroups.push([...currentGroup]);
      }
      currentGroup = [];
    }
  }

  if (currentGroup.length > 1) {
    consecutiveGroups.push(currentGroup);
  }

  consecutiveGroups.forEach((group) => {
    const firstPre = group[0];
    const wrapper = document.createElement("div");
    wrapper.className = "code-tabs";
    firstPre.parentNode?.insertBefore(wrapper, firstPre);
    group.forEach((p) => wrapper.appendChild(p));
    buildTabGroup(wrapper, group, `tabs-consecutive-${++groupCounter}`);
    wrapper.dataset.tabsInitialized = "true";
  });
}

/* -------------------------------------------------------------------------- */
/* 6. Architecture Diagram Lightbox & Interactive Pan-Zoom Viewer             */
/* -------------------------------------------------------------------------- */
let lightboxListenersInitialized = false;
let currentLightboxScale = 1.0;
let currentLightboxPanX = 0;
let currentLightboxPanY = 0;

function updateLightboxTransform(
  stage: HTMLElement,
  zoomLevelEl: HTMLElement | null,
) {
  stage.style.transform = `translate(${currentLightboxPanX}px, ${currentLightboxPanY}px) scale(${currentLightboxScale})`;
  if (zoomLevelEl) {
    zoomLevelEl.textContent = `${Math.round(currentLightboxScale * 100)}%`;
  }
}

function resetLightboxView(
  stage: HTMLElement,
  zoomLevelEl: HTMLElement | null,
) {
  currentLightboxScale = 1.0;
  currentLightboxPanX = 0;
  currentLightboxPanY = 0;
  updateLightboxTransform(stage, zoomLevelEl);
}

function openDiagramLightbox(container: HTMLElement, svgElement: SVGElement) {
  const dialog = document.getElementById(
    "diagram-lightbox",
  ) as HTMLDialogElement | null;
  const stage = document.getElementById("lightbox-stage");
  const zoomLevelEl = document.getElementById("lightbox-zoom-level");
  const titleEl = document.getElementById("lightbox-title");

  if (!dialog || !stage) return;

  // Derive contextual heading title if available
  const prevEl = container.previousElementSibling;
  let diagramTitle = "Interactive Architecture Viewer";
  if (prevEl && /^H[2-4]$/.test(prevEl.tagName)) {
    diagramTitle = prevEl.textContent?.replace(/#$/, "").trim() || diagramTitle;
  }
  if (titleEl) {
    titleEl.textContent = `· ${diagramTitle}`;
  }

  // Clone SVG into interactive stage
  const clone = svgElement.cloneNode(true) as SVGElement;
  clone.style.maxWidth = "100%";
  clone.style.maxHeight = "100%";
  clone.style.width = "auto";
  clone.style.height = "auto";
  clone.removeAttribute("id");

  stage.innerHTML = "";
  stage.appendChild(clone);
  resetLightboxView(stage, zoomLevelEl);
  dialog.showModal();
}

export function attachDiagramLightboxTriggers() {
  const dialog = document.getElementById(
    "diagram-lightbox",
  ) as HTMLDialogElement | null;
  if (!dialog) return;

  const containers =
    document.querySelectorAll<HTMLElement>(".mermaid-container");
  containers.forEach((container) => {
    if (container.dataset.lightboxAttached === "true") return;

    const svg = container.querySelector("svg");
    if (!svg) return;

    const expandBtn = document.createElement("button");
    expandBtn.type = "button";
    expandBtn.className = "expand-diagram-btn";
    expandBtn.setAttribute(
      "aria-label",
      "Expand diagram in interactive viewer",
    );
    expandBtn.title = "Inspect full-screen";
    expandBtn.innerHTML = `${EXPAND_ICON}<span>Expand</span>`;

    expandBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openDiagramLightbox(container, svg);
    });

    container.appendChild(expandBtn);
    container.dataset.lightboxAttached = "true";
  });
}

export function setupDiagramLightbox() {
  const dialog = document.getElementById(
    "diagram-lightbox",
  ) as HTMLDialogElement | null;
  if (!dialog) return;

  attachDiagramLightboxTriggers();

  if (lightboxListenersInitialized) return;

  const stage = document.getElementById("lightbox-stage");
  const stageContainer = document.getElementById("lightbox-stage-container");
  const zoomInBtn = document.getElementById("lightbox-zoom-in");
  const zoomOutBtn = document.getElementById("lightbox-zoom-out");
  const resetBtn = document.getElementById("lightbox-reset");
  const closeBtn = document.getElementById("lightbox-close");
  const zoomLevelEl = document.getElementById("lightbox-zoom-level");

  if (!stage || !stageContainer) return;

  let isDragging = false;
  let startX = 0;
  let startY = 0;

  // Light-dismiss fallback for browsers without native closedby support (Safari)
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      const isInDialog =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!isInDialog) {
        dialog.close();
      }
    }
  });

  // Pan interaction via pointer events
  stageContainer.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    isDragging = true;
    startX = e.clientX - currentLightboxPanX;
    startY = e.clientY - currentLightboxPanY;
    stageContainer.setPointerCapture(e.pointerId);
  });

  stageContainer.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    currentLightboxPanX = e.clientX - startX;
    currentLightboxPanY = e.clientY - startY;
    updateLightboxTransform(stage, zoomLevelEl);
  });

  const stopDragging = (e: PointerEvent) => {
    if (isDragging) {
      isDragging = false;
      try {
        stageContainer.releasePointerCapture(e.pointerId);
      } catch {
        // pointer capture already released
      }
    }
  };

  stageContainer.addEventListener("pointerup", stopDragging);
  stageContainer.addEventListener("pointercancel", stopDragging);

  // Smooth wheel zoom
  stageContainer.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      currentLightboxScale = Math.min(
        5.0,
        Math.max(0.4, currentLightboxScale * zoomFactor),
      );
      updateLightboxTransform(stage, zoomLevelEl);
    },
    { passive: false },
  );

  // Zoom control buttons
  zoomInBtn?.addEventListener("click", () => {
    currentLightboxScale = Math.min(5.0, currentLightboxScale + 0.25);
    updateLightboxTransform(stage, zoomLevelEl);
  });

  zoomOutBtn?.addEventListener("click", () => {
    currentLightboxScale = Math.max(0.4, currentLightboxScale - 0.25);
    updateLightboxTransform(stage, zoomLevelEl);
  });

  resetBtn?.addEventListener("click", () => {
    resetLightboxView(stage, zoomLevelEl);
  });

  closeBtn?.addEventListener("click", () => {
    dialog.close();
  });

  // Keyboard navigation inside lightbox
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      currentLightboxScale = Math.min(5.0, currentLightboxScale + 0.25);
      updateLightboxTransform(stage, zoomLevelEl);
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      currentLightboxScale = Math.max(0.4, currentLightboxScale - 0.25);
      updateLightboxTransform(stage, zoomLevelEl);
    } else if (e.key === "0") {
      e.preventDefault();
      resetLightboxView(stage, zoomLevelEl);
    }
  });

  // Reset stage and clear memory on close
  dialog.addEventListener("close", () => {
    resetLightboxView(stage, zoomLevelEl);
    stage.innerHTML = "";
  });

  lightboxListenersInitialized = true;
}

/* -------------------------------------------------------------------------- */
/* Main Initializer                                                           */
/* -------------------------------------------------------------------------- */
export function initBlogArticleEnhancements() {
  setupCodeTabs();
  setupCodeCopyButtons();
  setupMermaidDiagrams();
  setupDiagramLightbox();
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
