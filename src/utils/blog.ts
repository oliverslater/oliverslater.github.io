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

/**
 * Determines whether a blog post is published and visible based on draft flag and pubDate.
 * A post is visible if:
 * 1. `draft` is false (or undefined)
 * 2. `pubDate` <= current date/time (posts with future timestamps are treated as scheduled)
 *
 * In local development (DEV mode), future-dated posts can optionally be previewed if `allowFutureInDev` is true.
 */
export function isPostPublished(
  post: BlogPostLike & { data: { draft?: boolean } },
  allowFutureInDev = false,
): boolean {
  if (post.data.draft) return false;

  const pubDate = new Date(post.data.pubDate);
  const isFuture = pubDate.getTime() > Date.now();

  if (isFuture) {
    // Allow previewing scheduled posts during local development
    if (allowFutureInDev && import.meta.env?.DEV) {
      return true;
    }
    return false;
  }

  return true;
}
