import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_news_article",
  title: "Get news article",
  description: "Fetch a single published news article with its full body, by slug.",
  inputSchema: { slug: z.string().trim().min(1).describe("The article slug, e.g. 'annual-conference-2026'.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("news_posts")
      .select("title,slug,excerpt,content,category,cover_image,published_at,publisher_source,keywords")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: `No published article found for slug "${slug}".` }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { article: data },
    };
  },
});
