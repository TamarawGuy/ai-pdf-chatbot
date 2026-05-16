import "server-only";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const MAX_CHARS_FOR_SUMMARY = 200_000;

export async function generateSummary(documentText: string): Promise<string> {
  const truncated = documentText.slice(0, MAX_CHARS_FOR_SUMMARY);
  const { text } = await generateText({
    model: openai("gpt-4.1-mini"),
    system:
      "You write concise document summaries. Reply with a single paragraph (4-6 sentences) covering what the document is about, the main topics, and any conclusions or key data points. No preamble.",
    prompt: `Summarize the following document:\n\n${truncated}`,
  });
  return text.trim();
}
