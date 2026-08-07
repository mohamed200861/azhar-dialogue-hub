import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const SOURCES = ["news", "library", "videos", "khutbahs", "quran", "events"] as const;

export default defineTool({
  name: "search_content",
  title: "Search published content",
  description:
    "Search the union's published content (news, library items, videos, khutbahs, Quran lessons, events) by title.",
  inputSchema: {
    query: z.string().trim().min(1).describe("Text to match against titles."),
    sources: z
      .array(z.enum(SOURCES))
      .optional()
      .describe("Limit the search to these content types. Defaults to all."),
    limit: z.number().int().min(1).max(25).optional().describe("Max results per source (default 5)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, sources, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const take = limit ?? 5;
    const wanted = sources?.length ? sources : SOURCES;
    const pattern = `%${query}%`;

    const results: Record<string, unknown[]> = {};
    for (const source of wanted) {
      let rows: unknown[] = [];
      if (source === "news") {
        const { data } = await supabase
          .from("news_posts").select("title,slug,excerpt,category,published_at")
          .eq("status", "published").ilike("title", pattern)
          .order("published_at", { ascending: false }).limit(take);
        rows = data ?? [];
      } else if (source === "library") {
        const { data } = await supabase
          .from("library_items").select("title,slug,description,category,published_at")
          .eq("status", "published").ilike("title", pattern)
          .order("published_at", { ascending: false }).limit(take);
        rows = data ?? [];
      } else if (source === "videos") {
        const { data } = await supabase
          .from("videos").select("title,slug,description,category,created_at")
          .eq("status", "published").ilike("title", pattern)
          .order("created_at", { ascending: false }).limit(take);
        rows = data ?? [];
      } else if (source === "khutbahs") {
        const { data } = await supabase
          .from("khutbahs").select("title,slug,description,speaker_name,khutbah_date")
          .eq("publish_status", "published").ilike("title", pattern)
          .order("published_at", { ascending: false }).limit(take);
        rows = data ?? [];
      } else if (source === "quran") {
        const { data } = await supabase
          .from("quran_lessons").select("title,slug,description,published_at")
          .eq("publish_status", "published").ilike("title", pattern)
          .order("published_at", { ascending: false }).limit(take);
        rows = data ?? [];
      } else {
        const { data } = await supabase
          .from("events").select("title,slug,description,location,start_datetime")
          .eq("publish_status", "published").ilike("title", pattern)
          .order("start_datetime", { ascending: false }).limit(take);
        rows = data ?? [];
      }
      if (rows.length) results[source] = rows;
    }

    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      structuredContent: { results },
    };
  },
});
