export interface BlogPostLike {
  id: string;
  data: {
    pubDate: Date;
    [key: string]: unknown;
  };
}

/**
 * Generates the canonical URL path for a blog post with /blog/YYYY/MM/slug structure.
 */
export function getBlogUrl(post: BlogPostLike): string {
  const pubDate = new Date(post.data.pubDate);
  const year = pubDate.getFullYear();
  const month = String(pubDate.getMonth() + 1).padStart(2, "0");
  return `/blog/${year}/${month}/${post.id}`;
}

export interface PostVisibilityOptions {
  allowFutureInDev?: boolean;
  allowDraftsInDev?: boolean;
}

/**
 * Determines whether a blog post is published and visible based on draft status and publication date.
 *
 * Production Rules (strict):
 * 1. Draft posts (`draft: true`) are omitted.
 * 2. Future-dated posts (`pubDate > Date.now()`) are omitted as scheduled.
 *
 * Local Development Rules (`import.meta.env.DEV`):
 * - Scheduled future posts and draft posts are permitted for previewing and testing when `allowInDev` is enabled (defaults to `import.meta.env.DEV`).
 */
export function isPostPublished(
  post: BlogPostLike & { data: { draft?: boolean } },
  allowInDev: boolean | PostVisibilityOptions = import.meta.env?.DEV ?? false,
): boolean {
  const isDev = Boolean(import.meta.env?.DEV);
  const allowFuture =
    typeof allowInDev === "object"
      ? (allowInDev.allowFutureInDev ?? true)
      : Boolean(allowInDev);
  const allowDrafts =
    typeof allowInDev === "object"
      ? (allowInDev.allowDraftsInDev ?? true)
      : Boolean(allowInDev);

  // In production: strictly omit both drafts and future-dated posts
  if (!isDev) {
    if (post.data.draft) return false;
    const pubDate = new Date(post.data.pubDate);
    if (pubDate.getTime() > Date.now()) return false;
    return true;
  }

  // In development (DEV mode):
  if (post.data.draft && !allowDrafts) return false;

  const pubDate = new Date(post.data.pubDate);
  const isFuture = pubDate.getTime() > Date.now();
  if (isFuture && !allowFuture) return false;

  return true;
}
