import { getCollection } from "astro:content";
import { blogConfig, profileData } from "../data/siteData";
import { getBlogUrl, isPostPublished } from "./blog";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function generateRssFeed(
  feedUrlPath = blogConfig.feedPath,
): Promise<string> {
  const siteUrl = (profileData.website || "").replace(/\/+$/, "");

  const posts = await getCollection("blog", (post) => isPostPublished(post));
  const sortedPosts = posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

  const lastBuildDate = sortedPosts[0]
    ? new Date(sortedPosts[0].data.pubDate).toUTCString()
    : new Date().toUTCString();

  const itemsXml = sortedPosts
    .map((post) => {
      const postUrl = `${siteUrl}${getBlogUrl(post)}`;
      const pubDateRfc822 = new Date(post.data.pubDate).toUTCString();
      const categories = (post.data.tags || [])
        .map((tag) => `      <category>${escapeXml(tag)}</category>`)
        .join("\n");

      return `    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDateRfc822}</pubDate>
      <description><![CDATA[${post.data.description}]]></description>
      <dc:creator>${escapeXml(blogConfig.author)}</dc:creator>
${categories ? categories + "\n" : ""}    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(blogConfig.feedTitle)}</title>
    <description>${escapeXml(blogConfig.description)}</description>
    <link>${siteUrl}/blog/</link>
    <atom:link href="${siteUrl}${feedUrlPath}" rel="self" type="application/rss+xml" />
    <language>${blogConfig.language}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${itemsXml}
  </channel>
</rss>
`;
}
