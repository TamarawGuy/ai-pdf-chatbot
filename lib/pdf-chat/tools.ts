import { tool } from "ai";
import z from "zod";
import { searchPdfChunks } from "@/lib/pdf-chat/search";

export function makePdfChatTools(documentId: string) {
  return {
    searchKnowledgeBase: tool({
      description: "Search the loaded PDF for relevant passages",
      inputSchema: z.object({
        query: z
          .string()
          .describe("The search query to find relevant passages in the PDF"),
      }),
      execute: async ({ query }) => {
        try {
          const results = await searchPdfChunks(documentId, query, 12, 0);
          if (results.length === 0) {
            return "No relevant information found in the PDF.";
          }
          return results
            .map((res, i) => `[${i + 1}] ${res.content}`)
            .join("\n\n");
        } catch (err) {
          console.error("Search error: ", err);
          return "Error searching the PDF";
        }
      },
    }),
  };
}

export const pdfChatTools = makePdfChatTools("");
