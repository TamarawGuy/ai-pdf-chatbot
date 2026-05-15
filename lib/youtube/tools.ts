import { tool } from "ai";
import z from "zod";
import { searchYoutubeChunks } from "@/lib/youtube/search";

export function makeYoutubeTools(videoId: string) {
  return {
    searchVideoTranscript: tool({
      description:
        "Search the transcript of the loaded YouTube video for relevant passages",
      inputSchema: z.object({
        query: z
          .string()
          .describe("The search query to find relevant transcript passages"),
      }),
      execute: async ({ query }) => {
        try {
          const results = await searchYoutubeChunks(videoId, query, 5, 0);
          if (results.length === 0) {
            return "No relevant content found in this video.";
          }
          return results.map((r, i) => `[${i + 1}] ${r.content}`).join("\n\n");
        } catch (err) {
          console.error("Transcript search error:", err);
          return "Error searching transcript";
        }
      },
    }),
  };
}

export const youtubeTools = makeYoutubeTools("");
