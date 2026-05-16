import "server-only";
import pdf from "pdf-parse-new";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/config";
import { pdfDocuments, pdfChunks } from "@/lib/db/schema";
import { chunkContent } from "@/lib/ai/chunking";
import { generateEmbeddings } from "@/lib/ai/embeddings";
import { generateSummary } from "@/lib/ai/generate-summary";

export const FULL_TEXT_TOKEN_THRESHOLD = 30_000;

function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

export type LoadedPdfDocument = {
  documentId: string;
  filename: string;
};

export async function loadPdfDocument(opts: {
  userId: string;
  file: File;
}): Promise<LoadedPdfDocument> {
  const bytes = await opts.file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const data = await pdf(buffer);

  const fullText = data.text?.trim() ?? "";
  if (fullText.length === 0) {
    throw new Error("No text found in PDF");
  }

  const filename = opts.file.name.trim() || "Untitled PDF";
  const tokenCount = estimateTokenCount(fullText);

  const [document] = await db
    .insert(pdfDocuments)
    .values({
      userId: opts.userId,
      filename,
      fullText,
      tokenCount,
    })
    .returning({ id: pdfDocuments.id });

  if (tokenCount > FULL_TEXT_TOKEN_THRESHOLD) {
    const chunks = await chunkContent(fullText);
    const embeddings = await generateEmbeddings(chunks);

    await db.insert(pdfChunks).values(
      chunks.map((content, i) => ({
        documentId: document.id,
        content,
        embedding: embeddings[i],
      })),
    );

    try {
      const summary = await generateSummary(fullText);
      await db
        .update(pdfDocuments)
        .set({ summary })
        .where(eq(pdfDocuments.id, document.id));
    } catch (err) {
      console.error("Summary generation failed:", err);
    }
  }

  return { documentId: document.id, filename };
}
