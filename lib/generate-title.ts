import "server-only";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function generateTitle(firstUserMessage: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system:
        "You generate short titles for chat conversations. Reply with just the title (3-6 words, no quotes, no trailing punctuation).",
      prompt: `Generate a title for a chat that begins with this user message:\n\n${firstUserMessage}`,
    });
    const cleaned = text.replace(/^["'`]+|["'`]+$/g, "").trim();
    return cleaned.slice(0, 60) || "New chat";
  } catch (err) {
    console.error("Title generation failed:", err);
    return firstUserMessage.trim().slice(0, 60) || "New chat";
  }
}
