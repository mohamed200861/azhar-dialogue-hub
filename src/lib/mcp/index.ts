import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchContentTool from "./tools/search-content";
import getNewsArticleTool from "./tools/get-news-article";
import listUpcomingEventsTool from "./tools/list-upcoming-events";
import createNewsDraftTool from "./tools/create-news-draft";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "azhar-global-connect",
  title: "Azhar Global Connect",
  version: "0.1.0",
  instructions:
    "Tools for Azhar Global Connect, the Union of Al-Azhar Scholars portal. Use `search_content` to find published news, library items, videos, khutbahs, Quran lessons and events; `get_news_article` for the full body of one article; `list_upcoming_events` for the events calendar; `create_news_draft` to create an unpublished news draft (editors only).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchContentTool, getNewsArticleTool, listUpcomingEventsTool, createNewsDraftTool],
});
