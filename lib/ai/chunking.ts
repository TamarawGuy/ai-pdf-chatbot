import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 600,
  chunkOverlap: 80,
  separators: ["\n\n", "\n", ". ", " "],
});

export async function chunkContent(content: string) {
  return await textSplitter.splitText(content.trim());
}
