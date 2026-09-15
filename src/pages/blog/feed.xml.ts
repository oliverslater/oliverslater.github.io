import type { APIRoute } from "astro";
import { generateRssFeed } from "../../utils/feed";
import { blogConfig } from "../../data/siteData";

export const GET: APIRoute = async () => {
  const feedXml = await generateRssFeed(blogConfig.feedPath);
  return new Response(feedXml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
