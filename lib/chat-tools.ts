import { tool } from "ai";
import z from "zod";
import { searchDocuments } from "@/lib/search";

export const chatTools = {
  searchKnowledgeBase: tool({
    description: "Search the knowledge base for relevant information",
    inputSchema: z.object({
      query: z.string().describe("The search query to find relevant documents"),
    }),
    execute: async ({ query }) => {
      try {
        const results = await searchDocuments(query, 5, 0);
        if (results.length === 0) {
          return "No relevant information found in knowledge base.";
        }
        return results.map((res, i) => `[${i + 1}] ${res.content}`).join("\n\n");
      } catch (err) {
        console.error("Search error: ", err);
        return "Error searching knowledge base";
      }
    },
  }),
};
