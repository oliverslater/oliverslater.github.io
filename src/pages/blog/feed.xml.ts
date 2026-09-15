import type { APIRoute } from "astro";
import { generateRssFeed } from "../../utils/feed";

export const GET: APIRoute = async () => {
  const feedXml = await generateRssFeed("/blog/feed.xml");
  return new Response(feedXml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
