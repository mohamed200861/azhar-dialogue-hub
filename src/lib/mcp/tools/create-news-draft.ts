import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_news_draft",
  title: "Create news draft",
  description:
    "Create a draft news article (never published directly). Requires an editor/admin account; RLS enforces permissions.",
  inputSchema: {
    title: z.string().trim().min(3).describe("Article headline."),
    slug: z.string().trim().min(3).regex(/^[a-z0-9\u0600-\u06FF-]+$/i).describe("URL slug, lowercase with hyphens."),
    category: z.string().trim().min(1).describe("Content category, e.g. 'news'."),
    excerpt: z.string().trim().optional().describe("Short summary."),
    content: z.string().trim().optional().describe("Full HTML/rich-text body."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ title, slug, category, excerpt, content }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("news_posts")
      .insert({
        title,
        slug: slug.toLowerCase(),
        category,
        excerpt: excerpt ?? null,
        content: content ?? null,
        status: "draft",
        created_by: ctx.getUserId(),
      })
      .select("id,title,slug,status")
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Draft created: ${JSON.stringify(data)}` }],
      structuredContent: { draft: data },
    };
  },
});
