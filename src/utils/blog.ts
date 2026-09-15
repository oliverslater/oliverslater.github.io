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
